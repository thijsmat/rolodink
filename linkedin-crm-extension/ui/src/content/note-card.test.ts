import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
    createNoteCard,
    createNoteVersion,
    createStatusLine,
    readNote,
    textForUnseenNote,
    type ApiResponse,
    type NoteConflictOptions,
    type NoteLoad,
    type SaveResult,
} from './note-card';

/**
 * The note card against a real (jsdom) textarea, with only the I/O faked.
 *
 * What this guards is data loss that makes no noise. The card used to open its
 * textarea after a 429, a 5xx, a 401 or a timeout, empty, while a note could
 * exist on the server; the first save then PATCHed what had been typed over
 * it. Each outcome below is one a real user reaches without doing anything
 * unusual - the rate limiter counts per IP, so an office shares one budget.
 */

// Answers as background/main.ts (performApiRequest) delivers them.
const NOT_IN_CRM: ApiResponse = { status: 200, ok: true, data: [] };
const WITH_NOTE: ApiResponse = {
    status: 200,
    ok: true,
    data: [{ id: 'conn-1', notes: 'rolodink-enc:ciphertext' }],
};
// The body rate-limit.ts sends.
const RATE_LIMITED: ApiResponse = {
    status: 429,
    ok: false,
    data: { error: 'Rate limit exceeded', message: 'Too many requests. Please try again later.', retryAfter: 42 },
};
const SERVER_ERROR: ApiResponse = { status: 500, ok: false, data: { error: 'Er is een interne serverfout opgetreden' } };
// The worker's own answer when there is no session.
const SIGNED_OUT: ApiResponse = { status: 401, ok: false, data: null };
// sendRuntimeMessage in main.js rejects with this after 15 s without an answer.
const TIMEOUT = new Error('Geen antwoord van de achtergrondservice');

const STORED_TEXT = 'Met at the Utrecht meetup';

type Reply = ApiResponse | Error | Promise<ApiResponse>;

/** A GET giving the scripted replies in order. An Error rejects, like a message that timed out. */
function scriptedRequest(...replies: Reply[]) {
    return vi.fn(async (): Promise<ApiResponse> => {
        const reply = replies.shift();
        if (reply === undefined) throw new Error('unexpected extra request');
        if (reply instanceof Error) throw reply;
        return reply;
    });
}

function deferred<T>() {
    let resolve: (value: T) => void = () => {};
    const promise = new Promise<T>((settle) => {
        resolve = settle;
    });
    return { promise, resolve };
}

const decryptStored = async (notes: unknown) => (notes ? STORED_TEXT : '');

interface MountOptions {
    decrypt?: (notes: unknown) => Promise<string>;
    save?: () => Promise<SaveResult>;
    /** The conflict I/O; the buttons are made here. */
    conflict?: Partial<Pick<NoteConflictOptions, 'readText' | 'adopt' | 'copy'>>;
    /** Besides being on the page; stands in for main.js's "url still this profile". */
    owned?: () => boolean;
    /** What attachNoteBehaviour does with a load, besides the card. */
    afterLoad?: (note: NoteLoad) => void;
}

/** Builds the card the way injectContextField does, and wires it the way attachNoteBehaviour does. */
function mountCard(request: () => Promise<ApiResponse>, options: MountOptions = {}) {
    const container = document.createElement('div');
    const textarea = document.createElement('textarea');
    const status = document.createElement('div');
    const retry = document.createElement('button');
    const loadOther = document.createElement('button');
    const overwrite = document.createElement('button');
    const undo = document.createElement('button');
    container.append(textarea, status, retry, loadOther, overwrite, undo);
    document.body.append(container);

    const decrypt = options.decrypt ?? decryptStored;
    // Stands in for saveNote, which is where the PATCH is sent from.
    const save = vi.fn(options.save ?? (async () => true));
    const card = createNoteCard({
        textarea,
        status: createStatusLine(status),
        retry,
        isAttached: () => container.isConnected && (options.owned?.() ?? true),
        load: async () => {
            const note = await readNote(request, decrypt);
            options.afterLoad?.(note);
            return note;
        },
        save,
        conflict: {
            loadOther,
            overwrite,
            undo,
            readText: options.conflict?.readText ?? (async () => ''),
            adopt: options.conflict?.adopt ?? (() => {}),
            copy: options.conflict?.copy ?? (async () => true),
        },
    });
    return { card, container, textarea, status, retry, loadOther, overwrite, undo, save };
}

const shown = (button: HTMLButtonElement) => !button.hidden && button.style.display !== 'none';
const retryShown = shown;

beforeEach(() => {
    document.body.innerHTML = '';
    // readNote logs the failures it absorbs; that is wanted in a browser and
    // noise here.
    vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
});

describe('readNote', () => {
    it('reads an empty list, and only that, as "not in the CRM"', async () => {
        await expect(readNote(scriptedRequest(NOT_IN_CRM), decryptStored)).resolves.toEqual({
            state: 'absent',
            status: 'Not in Rldnk yet',
        });
    });

    it('loads a connection whose note decrypts', async () => {
        await expect(readNote(scriptedRequest(WITH_NOTE), decryptStored)).resolves.toEqual({
            state: 'loaded',
            status: 'Saved',
            connectionId: 'conn-1',
            updatedAt: null,
            text: STORED_TEXT,
        });
    });

    it.each([
        ['a 429 from the rate limiter', RATE_LIMITED, 'Error loading'],
        ['a 500', SERVER_ERROR, 'Error loading'],
        ['a 503', { status: 503, ok: false, data: null }, 'Error loading'],
        ['a 401', SIGNED_OUT, 'Not logged in'],
    ] as const)('treats %s as a failure, not as an absence', async (_label, reply, status) => {
        await expect(readNote(scriptedRequest(reply), decryptStored)).resolves.toEqual({
            state: 'failed',
            status,
        });
    });

    it('treats no answer at all (the 15 s deadline, a dead worker) as a failure', async () => {
        await expect(readNote(scriptedRequest(TIMEOUT), decryptStored)).resolves.toEqual({
            state: 'failed',
            status: 'Error',
        });
    });

    it.each([
        ['null (an unparseable body)', null],
        ['an object without an id', { error: 'something' }],
        ['a list whose first entry has no id', [{ notes: 'rolodink-enc:x' }]],
    ])('does not read an ok answer carrying %s as "not in the CRM"', async (_label, data) => {
        const result = await readNote(scriptedRequest({ status: 200, ok: true, data }), decryptStored);
        expect(result).toEqual({ state: 'failed', status: 'Error loading' });
    });

    it('locks a note that cannot be decrypted', async () => {
        const result = await readNote(scriptedRequest(WITH_NOTE), async () => {
            throw new Error('Decryption failed');
        });
        expect(result).toEqual({ state: 'locked', status: 'Locked' });
    });
});

describe('the textarea opens only after a load that established the server state', () => {
    it('starts closed, without a Retry', () => {
        const { textarea, retry } = mountCard(scriptedRequest());
        expect(textarea.disabled).toBe(true);
        expect(retryShown(retry)).toBe(false);
    });

    it('stays closed while the load is in flight', async () => {
        const pending = deferred<ApiResponse>();
        const { card, textarea, status, retry } = mountCard(scriptedRequest(pending.promise));

        const loading = card.load();
        expect(textarea.disabled).toBe(true);
        expect(status.textContent).toBe('Loading...');
        expect(retryShown(retry)).toBe(false);

        pending.resolve(NOT_IN_CRM);
        await loading;
        expect(textarea.disabled).toBe(false);
    });

    it('keeps the field disabled after a 429 on load, and offers Retry', async () => {
        const { card, textarea, status, retry } = mountCard(scriptedRequest(RATE_LIMITED));
        await card.load();

        expect(textarea.disabled).toBe(true);
        expect(textarea.value).toBe('');
        expect(status.textContent).toBe('Error loading');
        expect(retryShown(retry)).toBe(true);
        expect(card.isLoaded()).toBe(false);
    });

    it.each([
        ['a 500', SERVER_ERROR, 'Error loading'],
        ['a 401', SIGNED_OUT, 'Not logged in'],
    ] as const)('keeps the field disabled after %s, and offers Retry', async (_label, reply, text) => {
        const { card, textarea, status, retry } = mountCard(scriptedRequest(reply));
        await card.load();

        expect(textarea.disabled).toBe(true);
        expect(status.textContent).toBe(text);
        expect(retryShown(retry)).toBe(true);
        expect(card.isLoaded()).toBe(false);
    });

    it('keeps the field disabled after a timeout, and offers Retry', async () => {
        const { card, textarea, status, retry } = mountCard(scriptedRequest(TIMEOUT));
        await card.load();

        expect(textarea.disabled).toBe(true);
        expect(status.textContent).toBe('Error');
        expect(retryShown(retry)).toBe(true);
        expect(card.isLoaded()).toBe(false);
    });

    it('enables the field on "Not in Rldnk yet"', async () => {
        const { card, textarea, status, retry } = mountCard(scriptedRequest(NOT_IN_CRM));
        await card.load();

        expect(textarea.disabled).toBe(false);
        expect(status.textContent).toBe('Not in Rldnk yet');
        expect(retryShown(retry)).toBe(false);
        expect(card.isLoaded()).toBe(true);
    });

    it('fills and enables the field with a note that decrypted', async () => {
        const { card, textarea, status, retry } = mountCard(scriptedRequest(WITH_NOTE));
        await card.load();

        expect(textarea.value).toBe(STORED_TEXT);
        expect(textarea.disabled).toBe(false);
        expect(status.textContent).toBe('Saved');
        expect(retryShown(retry)).toBe(false);
    });

    it('keeps a note it cannot decrypt locked, without a Retry', async () => {
        const { card, textarea, status, retry } = mountCard(scriptedRequest(WITH_NOTE), {
            decrypt: async () => {
                throw new Error('Decryption failed');
            },
        });
        await card.load();

        expect(textarea.disabled).toBe(true);
        expect(textarea.value).toBe('');
        expect(textarea.placeholder).toBe('Unable to decrypt this note. Open the Rolodink popup to sign in again.');
        expect(status.textContent).toBe('Locked');
        // A new sign-in fixes this, another request does not.
        expect(retryShown(retry)).toBe(false);
        expect(card.isLoaded()).toBe(false);
    });
});

describe('Retry', () => {
    it('enables the field once a retry after a failure loads', async () => {
        const request = scriptedRequest(RATE_LIMITED, WITH_NOTE);
        const { card, textarea, status, retry, save } = mountCard(request);
        await card.load();
        expect(textarea.disabled).toBe(true);

        retry.click();
        // The click itself sent the request; the load below only joins it.
        expect(request).toHaveBeenCalledTimes(2);
        await card.load(); // the retry's own load, still in flight

        expect(request).toHaveBeenCalledTimes(2);
        expect(textarea.disabled).toBe(false);
        expect(textarea.value).toBe(STORED_TEXT);
        expect(status.textContent).toBe('Saved');
        expect(retryShown(retry)).toBe(false);

        // And from here on the card saves.
        card.markDirty();
        await card.flush();
        expect(save).toHaveBeenCalledTimes(1);
    });

    it('keeps the field closed, and Retry on offer, when the retry fails too', async () => {
        const { card, textarea, status, retry } = mountCard(scriptedRequest(TIMEOUT, SERVER_ERROR));
        await card.load();

        retry.click();
        await card.load();

        expect(textarea.disabled).toBe(true);
        expect(status.textContent).toBe('Error loading');
        expect(retryShown(retry)).toBe(true);
    });

    it('runs one retry at a time', async () => {
        const pending = deferred<ApiResponse>();
        const request = scriptedRequest(RATE_LIMITED, pending.promise);
        const { card, textarea, retry } = mountCard(request);
        await card.load();

        retry.click();
        retry.click();
        retry.click();
        void card.load();
        expect(request).toHaveBeenCalledTimes(2);
        expect(retryShown(retry)).toBe(false);

        pending.resolve(NOT_IN_CRM);
        await card.load();
        expect(request).toHaveBeenCalledTimes(2);
        expect(textarea.disabled).toBe(false);
    });

    it('does not load for a card that navigation removed', async () => {
        const request = scriptedRequest(RATE_LIMITED);
        const { card, container, retry } = mountCard(request);
        await card.load();

        container.remove();
        retry.click();
        await card.load();

        expect(request).toHaveBeenCalledTimes(1);
    });

    it('ignores an answer that arrives after the card was removed', async () => {
        const pending = deferred<ApiResponse>();
        const { card, container, textarea, retry, save } = mountCard(scriptedRequest(RATE_LIMITED, pending.promise));
        await card.load();

        retry.click();
        container.remove();
        pending.resolve(WITH_NOTE);
        await card.load();

        expect(textarea.disabled).toBe(true);
        expect(textarea.value).toBe('');
        expect(card.isLoaded()).toBe(false);
        card.markDirty();
        await card.flush();
        expect(save).not.toHaveBeenCalled();
    });

    it('ignores an answer for a card that is still on the page but no longer owns it', async () => {
        // main.js starts the load without awaiting it, so ticks keep running
        // while it is in flight. Between an SPA navigation and the tick that
        // removes the card, the card is still connected while the url already
        // belongs to the next profile: isAttached (stillOwned in main.js)
        // answers for the profile, not only for the DOM.
        const pending = deferred<ApiResponse>();
        let owned = true;
        const { card, container, textarea, save } = mountCard(scriptedRequest(pending.promise), {
            owned: () => owned,
        });

        const loading = card.load();
        owned = false;
        pending.resolve(WITH_NOTE);
        await loading;

        expect(container.isConnected).toBe(true);
        expect(textarea.value).toBe('');
        expect(textarea.disabled).toBe(true);
        expect(card.isLoaded()).toBe(false);
        card.markDirty();
        await card.flush();
        expect(save).not.toHaveBeenCalled();
    });

    it('does not load again once loaded, so what was typed stays', async () => {
        const request = scriptedRequest(WITH_NOTE);
        const { card, textarea } = mountCard(request);
        await card.load();

        textarea.value = `${STORED_TEXT}, follow up in March`;
        await card.load();

        expect(request).toHaveBeenCalledTimes(1);
        expect(textarea.value).toBe(`${STORED_TEXT}, follow up in March`);
    });
});

describe('saving', () => {
    it('refuses to save - so never PATCHes - when the load failed', async () => {
        const { card, save } = mountCard(scriptedRequest(RATE_LIMITED));
        await card.load();

        card.markDirty();
        await card.flush();

        expect(save).not.toHaveBeenCalled();
        // Kept, not dropped: the text is still only on the card.
        expect(card.isDirty()).toBe(true);
    });

    it('refuses to save a note it could not decrypt', async () => {
        const { card, save } = mountCard(scriptedRequest(WITH_NOTE), {
            decrypt: async () => {
                throw new Error('Decryption failed');
            },
        });
        await card.load();

        card.markDirty();
        await card.flush();
        expect(save).not.toHaveBeenCalled();
    });

    it('saves once loaded, including a profile that is not in the CRM yet', async () => {
        const { card, save } = mountCard(scriptedRequest(NOT_IN_CRM));
        await card.load();

        card.markDirty();
        await card.flush();

        expect(save).toHaveBeenCalledTimes(1);
        expect(card.isDirty()).toBe(false);
    });

    it('leaves the card dirty after a failed save, and the next flush retries it', async () => {
        const outcomes = [false, true];
        const { card, save } = mountCard(scriptedRequest(WITH_NOTE), {
            save: async () => outcomes.shift() ?? true,
        });
        await card.load();

        card.markDirty();
        await card.flush();
        expect(save).toHaveBeenCalledTimes(1);
        expect(card.isDirty()).toBe(true);

        // pagehide, visibilitychange or the next input's debounce.
        await card.flush();
        expect(save).toHaveBeenCalledTimes(2);
        expect(card.isDirty()).toBe(false);
    });

    it('leaves the card dirty after a save that throws', async () => {
        const { card } = mountCard(scriptedRequest(WITH_NOTE), {
            save: async () => {
                throw new Error('Geen antwoord van de achtergrondservice');
            },
        });
        await card.load();

        card.markDirty();
        await card.flush();
        expect(card.isDirty()).toBe(true);
    });

    it('does not send anything when nothing changed', async () => {
        const { card, save } = mountCard(scriptedRequest(WITH_NOTE));
        await card.load();

        card.markDirty();
        await card.flush();
        await card.flush();
        expect(save).toHaveBeenCalledTimes(1);
    });

    it('never retries a failed save on its own', async () => {
        vi.useFakeTimers();
        const { card, save } = mountCard(scriptedRequest(WITH_NOTE), { save: async () => false });
        await card.load();

        card.markDirty();
        await card.flush();
        // Ten quiet minutes: no input, no page hide. A timer-driven retry
        // would hit the per-IP rate limiter for everyone behind the address.
        await vi.advanceTimersByTimeAsync(10 * 60_000);

        expect(save).toHaveBeenCalledTimes(1);
        expect(card.isDirty()).toBe(true);
    });

    it('runs saves one after another', async () => {
        const first = deferred<boolean>();
        const results = [first.promise, Promise.resolve(true)];
        let running = 0;
        let overlapped = false;
        const { card, save } = mountCard(scriptedRequest(WITH_NOTE), {
            save: async () => {
                running++;
                if (running > 1) overlapped = true;
                try {
                    return await (results.shift() ?? Promise.resolve(true));
                } finally {
                    running--;
                }
            },
        });
        await card.load();

        card.markDirty();
        void card.flush();
        card.markDirty();
        const second = card.flush();
        await Promise.resolve();
        expect(save).toHaveBeenCalledTimes(1);

        first.resolve(true);
        await second;
        expect(save).toHaveBeenCalledTimes(2);
        expect(overlapped).toBe(false);
    });
});

describe('saving to a connection the card has not shown', () => {
    // A card that loaded "Not in Rldnk yet" is empty. The connection can appear
    // after that with a note on it - the popup creates it with one, a second
    // tab saves one - and the save that then finds it knows only what was typed
    // on this card. saveNote reads that connection first; this is what it may
    // send afterwards.
    const typed = 'follow up in March';
    const read = (reply: Reply, decrypt = decryptStored) => readNote(scriptedRequest(reply), decrypt);

    it('keeps a note that appeared after "Not in Rldnk yet", with what was typed after it', async () => {
        expect(textForUnseenNote(await read(WITH_NOTE), 'conn-1', typed)).toBe(`${STORED_TEXT}\n${typed}`);
    });

    it('sends what was typed to a connection without a note, as the card or Add to Rldnk creates it', async () => {
        const created: ApiResponse = { status: 200, ok: true, data: [{ id: 'conn-1', notes: null }] };
        expect(textForUnseenNote(await read(created), 'conn-1', typed)).toBe(typed);
    });

    it('does not clear a note it never showed when the field is empty', async () => {
        expect(textForUnseenNote(await read(WITH_NOTE), 'conn-1', '')).toBe(STORED_TEXT);
    });

    it('does not repeat a note that already reads the same', async () => {
        expect(textForUnseenNote(await read(WITH_NOTE), 'conn-1', STORED_TEXT)).toBe(STORED_TEXT);
    });

    it.each([
        ['a 429', RATE_LIMITED],
        ['a 500', SERVER_ERROR],
        ['a 401', SIGNED_OUT],
        ['no answer', TIMEOUT],
        ['an empty list, the connection gone again', NOT_IN_CRM],
    ] as const)('sends nothing after %s', async (_label, reply) => {
        expect(textForUnseenNote(await read(reply), 'conn-1', typed)).toBeNull();
    });

    it('sends nothing when the note cannot be decrypted', async () => {
        const locked = await read(WITH_NOTE, async () => {
            throw new Error('Decryption failed');
        });
        expect(textForUnseenNote(locked, 'conn-1', typed)).toBeNull();
    });

    it('sends nothing when the note read belongs to another connection', async () => {
        expect(textForUnseenNote(await read(WITH_NOTE), 'conn-2', typed)).toBeNull();
    });
});

describe('the status line', () => {
    // main.js watches document.body for childList mutations and answers each
    // with a full injection round. A status written through innerText or
    // textContent is one such mutation per keystroke.
    function watchChildList(target: Node) {
        const records: MutationRecord[] = [];
        const observer = new MutationObserver((batch) => records.push(...batch));
        observer.observe(target, { childList: true, subtree: true });
        return {
            childListRecords: () => {
                records.push(...observer.takeRecords());
                return records.filter((record) => record.type === 'childList');
            },
            stop: () => observer.disconnect(),
        };
    }

    it('changes its text without adding or removing nodes', () => {
        const element = document.createElement('div');
        document.body.append(element);
        const line = createStatusLine(element);
        const watcher = watchChildList(element);

        for (const text of ['Typing...', 'Typing...', 'Saving...', 'Saved', 'Typing...']) line.set(text);

        expect(element.textContent).toBe('Typing...');
        expect(line.text()).toBe('Typing...');
        expect(watcher.childListRecords()).toHaveLength(0);
        watcher.stop();
    });

    it('keeps text that was already there', () => {
        const element = document.createElement('div');
        element.textContent = 'Loading...';
        expect(createStatusLine(element).text()).toBe('Loading...');
        expect(element.childNodes).toHaveLength(1);
    });

    it('puts its node back once if something replaced it', () => {
        const element = document.createElement('div');
        const line = createStatusLine(element);
        element.textContent = 'stray';
        line.set('Saved');
        expect(element.textContent).toBe('Saved');
        expect(element.childNodes).toHaveLength(1);
    });

    it('is what the card writes through while it loads', async () => {
        const pending = deferred<ApiResponse>();
        const { card, status } = mountCard(scriptedRequest(pending.promise));
        const watcher = watchChildList(status);

        const loading = card.load();
        expect(status.textContent).toBe('Loading...');
        pending.resolve(WITH_NOTE);
        await loading;

        expect(status.textContent).toBe('Saved');
        expect(watcher.childListRecords()).toHaveLength(0);
        watcher.stop();
    });
});

describe('retiring a card whose extension is gone', () => {
    const ORPHANED = 'Extension updated – copy your note and reload the page';

    it('keeps the text, read-only, and says what to do', async () => {
        const { card, textarea, status, retry } = mountCard(scriptedRequest(WITH_NOTE));
        await card.load();
        textarea.value = `${STORED_TEXT}, call back Friday`;

        card.retire(ORPHANED);

        expect(textarea.value).toBe(`${STORED_TEXT}, call back Friday`);
        expect(textarea.readOnly).toBe(true);
        // Not disabled: a disabled field cannot be selected to copy from.
        expect(textarea.disabled).toBe(false);
        expect(status.textContent).toBe(ORPHANED);
        expect(retryShown(retry)).toBe(false);
    });

    it('does not save afterwards, and the text stays dirty', async () => {
        const { card, save } = mountCard(scriptedRequest(WITH_NOTE));
        await card.load();
        card.markDirty();

        card.retire(ORPHANED);
        await card.flush();

        expect(save).not.toHaveBeenCalled();
        expect(card.isDirty()).toBe(true);
    });

    it('does not apply a load that answers after it', async () => {
        const pending = deferred<ApiResponse>();
        const { card, textarea, status } = mountCard(scriptedRequest(pending.promise));
        const loading = card.load();

        card.retire(ORPHANED);
        pending.resolve(WITH_NOTE);
        await loading;

        expect(status.textContent).toBe(ORPHANED);
        expect(textarea.value).toBe('');
        expect(card.isLoaded()).toBe(false);
    });

    it('does not start a load, also not from Retry', async () => {
        const request = scriptedRequest(RATE_LIMITED);
        const { card, retry } = mountCard(request);
        await card.load();

        card.retire(ORPHANED);
        retry.click();
        await card.load();

        expect(request).toHaveBeenCalledTimes(1);
    });
});

describe('createNoteVersion', () => {
    const V1 = '2026-09-30T12:00:00.000Z';
    const V2 = '2026-09-30T12:00:05.123Z';

    it('sends no version before one is known, so the PATCH stays as it was', () => {
        expect(createNoteVersion().stamp({ id: 'conn-1', notes: 'x' })).toEqual({ id: 'conn-1', notes: 'x' });
    });

    it('sends the version it was given, and takes the next one from an ok answer', () => {
        const version = createNoteVersion();
        version.set(V1);
        expect(version.stamp({ id: 'conn-1' })).toEqual({ id: 'conn-1', expectedUpdatedAt: V1 });

        expect(version.settle({ status: 200, ok: true, data: { id: 'conn-1', updatedAt: V2 } })).toEqual({ state: 'saved' });
        expect(version.stamp({ id: 'conn-1' })).toEqual({ id: 'conn-1', expectedUpdatedAt: V2 });
    });

    it('reports a conflict with the stored row, and keeps its own version', () => {
        const version = createNoteVersion();
        version.set(V1);
        const current = { id: 'conn-1', notes: 'rolodink-enc:other', updatedAt: V2 };

        expect(version.settle({ status: 409, ok: false, data: { error: 'conflict', code: 'CONNECTION_CONFLICT', current } }))
            .toEqual({ state: 'conflict', current });
        expect(version.stamp({ id: 'conn-1' })).toEqual({ id: 'conn-1', expectedUpdatedAt: V1 });
    });

    it('reads any other refusal, the duplicate-URL 409 too, as a plain failure', () => {
        const version = createNoteVersion();
        expect(version.settle({ status: 409, ok: false, data: { error: 'Connectie bestaat al voor deze URL.' } }))
            .toEqual({ state: 'failed' });
        expect(version.settle({ status: 500, ok: false, data: null })).toEqual({ state: 'failed' });
    });
});

/**
 * The API's PATCH, as route.ts answers it: applies only to the expected
 * version, else 409 with the stored row. Notes are kept as plain text here;
 * encryption is not what this is about.
 */
function fakeServer(notes: string) {
    let tick = 0;
    const stamp = () => new Date(Date.UTC(2026, 8, 30, 12, 0, 0, ++tick)).toISOString();
    const row = { id: 'conn-1', notes, updatedAt: stamp() };
    const bodies: Record<string, unknown>[] = [];
    let gate: Promise<void> = Promise.resolve();
    return {
        row,
        bodies,
        /** Holds the next PATCH answer until the returned function is called. */
        hold() {
            const open = deferred<void>();
            gate = open.promise;
            return () => open.resolve();
        },
        get: async (): Promise<ApiResponse> => ({ status: 200, ok: true, data: [{ ...row }] }),
        /** Another editor - the popup, another device - saves. */
        editElsewhere(text: string) {
            row.notes = text;
            row.updatedAt = stamp();
        },
        patch: async (body: Record<string, unknown>): Promise<ApiResponse> => {
            bodies.push(body);
            await gate;
            gate = Promise.resolve();
            if (body.expectedUpdatedAt !== undefined && body.expectedUpdatedAt !== row.updatedAt) {
                return { status: 409, ok: false, data: { error: 'conflict', code: 'CONNECTION_CONFLICT', current: { ...row } } };
            }
            row.notes = String(body.notes);
            row.updatedAt = stamp();
            return { status: 200, ok: true, data: { ...row } };
        },
    };
}

/** The card wired the way attachNoteBehaviour wires it, against fakeServer. */
function mountVersioned(server: ReturnType<typeof fakeServer>, conflict: MountOptions['conflict'] = {}) {
    const version = createNoteVersion();
    let textarea: HTMLTextAreaElement | null = null;
    const mounted = mountCard(server.get, {
        decrypt: async (notes) => String(notes ?? ''),
        afterLoad: (note) => {
            if (note.state === 'loaded') version.set(note.updatedAt);
        },
        // patchNote in main.js: stamp, send, settle.
        save: async () => {
            const resp = await server.patch(version.stamp({ id: 'conn-1', notes: textarea?.value }));
            const outcome = version.settle(resp);
            if (resp.ok) return true;
            if (outcome.state === 'conflict') return { conflict: outcome.current };
            return false;
        },
        conflict: {
            readText: async (current) => String(current.notes),
            adopt: (current) => version.set(typeof current.updatedAt === 'string' ? current.updatedAt : null),
            ...conflict,
        },
    });
    textarea = mounted.textarea;
    return mounted;
}

/** Loads, lets another editor save `other`, then types on the card and flushes into the 409. */
async function typeIntoConflict(
    server: ReturnType<typeof fakeServer>,
    mounted: ReturnType<typeof mountVersioned>,
    other = 'written in the popup',
) {
    await mounted.card.load();
    server.editElsewhere(other);
    mounted.textarea.value = 'typed on the card';
    mounted.card.markDirty();
    await mounted.card.flush();
}

/** Lets queued promise callbacks run. */
const settle = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

describe('saving against another editor', () => {
    it('serialises quick edits, each on the version the previous save returned, so autosave never conflicts with itself', async () => {
        const server = fakeServer('first');
        const { card, textarea, save } = mountVersioned(server);
        await card.load();
        const loadedVersion = server.row.updatedAt;

        const release = server.hold();
        textarea.value = 'first, then';
        card.markDirty();
        const one = card.flush();
        textarea.value = 'first, then second';
        card.markDirty();
        const two = card.flush();
        await settle();
        // The second waits for the first.
        expect(save).toHaveBeenCalledTimes(1);

        release();
        await Promise.all([one, two]);

        expect(server.bodies).toHaveLength(2);
        expect(server.bodies[0].expectedUpdatedAt).toBe(loadedVersion);
        const afterFirst = server.bodies[1].expectedUpdatedAt;
        expect(afterFirst).not.toBe(loadedVersion);
        expect(server.row.notes).toBe('first, then second');
        expect(card.isInConflict()).toBe(false);
        expect(card.isDirty()).toBe(false);
    });

    it('keeps what was typed after a 409, offers the choice and stops saving', async () => {
        const server = fakeServer('stored');
        const { card, textarea, status, loadOther, overwrite, undo, save } = mountVersioned(server);
        await card.load();
        expect(shown(loadOther) || shown(overwrite) || shown(undo)).toBe(false);

        server.editElsewhere('written in the popup');
        textarea.value = 'typed on the card';
        card.markDirty();
        await card.flush();

        expect(textarea.value).toBe('typed on the card');
        expect(server.row.notes).toBe('written in the popup');
        expect(status.textContent).toBe('Changed elsewhere');
        expect(shown(loadOther)).toBe(true);
        expect(shown(overwrite)).toBe(true);
        expect(shown(undo)).toBe(false);
        expect(card.isInConflict()).toBe(true);
        expect(card.isDirty()).toBe(true);

        // Typing on and the page-hide flush send nothing until the user chooses.
        textarea.value = 'typed on the card, and more';
        card.markDirty();
        await card.flush();
        expect(save).toHaveBeenCalledTimes(1);
        expect(status.textContent).toBe('Changed elsewhere');
    });

    it('overwrites on request, sending the other version as the expected one', async () => {
        const server = fakeServer('stored');
        const mounted = mountVersioned(server);
        const { card, loadOther, overwrite } = mounted;
        await typeIntoConflict(server, mounted);
        const otherVersion = server.row.updatedAt;

        overwrite.click();
        await settle();
        await card.flush();

        expect(server.bodies).toHaveLength(2);
        expect(server.bodies[1].expectedUpdatedAt).toBe(otherVersion);
        expect(server.row.notes).toBe('typed on the card');
        expect(card.isInConflict()).toBe(false);
        expect(card.isDirty()).toBe(false);
        expect(shown(loadOther) || shown(overwrite)).toBe(false);
    });

    it('loads the other version on request, copies what was typed, and can put it back', async () => {
        const server = fakeServer('stored');
        const copy = vi.fn(async () => true);
        const mounted = mountVersioned(server, { copy });
        const { card, textarea, status, loadOther, overwrite, undo } = mounted;
        await typeIntoConflict(server, mounted);

        loadOther.click();
        await settle();

        expect(copy).toHaveBeenCalledWith('typed on the card');
        expect(textarea.value).toBe('written in the popup');
        expect(status.textContent).toBe('Other version loaded, your text is copied');
        expect(card.isInConflict()).toBe(false);
        expect(card.isDirty()).toBe(false);
        expect(shown(loadOther) || shown(overwrite)).toBe(false);
        expect(shown(undo)).toBe(true);
        // Loading sends nothing.
        expect(server.bodies).toHaveLength(1);

        undo.click();
        await settle();
        await card.flush();

        expect(textarea.value).toBe('typed on the card');
        expect(server.row.notes).toBe('typed on the card');
        expect(shown(undo)).toBe(false);
    });

    it('says so when the clipboard is not available, and still keeps the text for Undo', async () => {
        const server = fakeServer('stored');
        const mounted = mountVersioned(server, { copy: async () => false });
        const { status, loadOther, undo } = mounted;
        await typeIntoConflict(server, mounted);

        loadOther.click();
        await settle();

        expect(status.textContent).toBe('Other version loaded');
        expect(shown(undo)).toBe(true);
    });

    it('stays in conflict, with the typed text, when the other version cannot be read', async () => {
        const server = fakeServer('stored');
        const mounted = mountVersioned(server, {
            readText: async () => {
                throw new Error('Decryption failed');
            },
        });
        const { card, textarea, status, loadOther, overwrite } = mounted;
        await typeIntoConflict(server, mounted, 'rolodink-enc:unreadable');

        loadOther.click();
        await settle();

        expect(textarea.value).toBe('typed on the card');
        expect(status.textContent).toBe('Could not load other version');
        expect(card.isInConflict()).toBe(true);
        expect(shown(overwrite)).toBe(true);
    });

    it('hides the choice when the card retires, and does not act on it afterwards', async () => {
        const server = fakeServer('stored');
        const mounted = mountVersioned(server);
        const { card, textarea, loadOther, overwrite } = mounted;
        await typeIntoConflict(server, mounted);

        card.retire('Extension updated – copy your note and reload the page');
        overwrite.click();
        await settle();

        expect(shown(loadOther) || shown(overwrite)).toBe(false);
        expect(server.bodies).toHaveLength(1);
        expect(textarea.value).toBe('typed on the card');
    });
});
