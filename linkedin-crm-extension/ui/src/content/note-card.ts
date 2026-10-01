/**
 * When the note card may be typed in, and when it may save.
 *
 * These rules live here rather than in main.js because what they prevent is
 * silent data loss, and main.js cannot be loaded in a test: it starts watching
 * the page the moment it is imported. Same reason scheduler.ts and
 * browser-api.ts exist - the decision is the part worth testing, so it is the
 * part that gets a module, and main.js supplies the I/O.
 *
 * **The bug this closes.** The card used to open its textarea after every load
 * except a decrypt failure, including a 429 from the rate limiter, a 5xx, a 401
 * and a message timeout. In each of those the field was empty while a note
 * could exist on the server. The first save then looked the connection up again
 * with a fresh GET - which by then might succeed - encrypted only what had just
 * been typed and PATCHed it over the stored note. The PATCH carries no version,
 * so nothing further down could have caught it.
 *
 * So the textarea opens only after a load that established what the server
 * holds: the note arrived and decrypted, or an ok answer said there is no
 * connection. Anything else keeps it closed, with a Retry beside the status
 * where retrying can help. And a card that did not load never saves - a second
 * check, independent of the closed textarea, so a regression in one does not
 * reopen the overwrite.
 *
 * "No connection" holds when the card loads, not for good: one can appear
 * later, with a note. A save that finds a connection this card did not load
 * reads its note first - see textForUnseenNote.
 *
 * **Another editor.** The same note can be edited in the popup or on another
 * device while this card is open. Every PATCH from the card carries the
 * version it last saw (createNoteVersion); a newer one on the server answers
 * 409 instead of being replaced, and the card stops saving and asks: load the
 * other version, or overwrite it. What was typed stays on the card until the
 * user chooses.
 */

import { readConflict, versionOf, withExpectedVersion, type VersionedRow } from '@rolodink/core';

/** What the background worker hands back for an API_REQUEST. */
export interface ApiResponse {
    status: number;
    ok: boolean;
    data: unknown;
}

/**
 * What one load established, with the status the card shows for it.
 *
 *  - loaded: the connection exists and its note decrypted; the card shows the
 *    server's text.
 *  - absent: an ok answer listing no connection, so no note to overwrite when
 *    the card loaded. That can change before the first save; see
 *    textForUnseenNote.
 *  - locked: a note exists and cannot be decrypted. Never editable, and not
 *    retried: that takes a new sign-in, not another request.
 *  - failed: nothing was established - a 401, 429 or 5xx, an answer that is
 *    not a list of connections, or no answer at all. Retryable.
 */
export type NoteLoad =
    | { state: 'loaded'; status: 'Saved'; connectionId: unknown; updatedAt: string | null; text: string }
    | { state: 'absent'; status: 'Not in Rldnk yet' }
    | { state: 'locked'; status: 'Locked' }
    | { state: 'failed'; status: 'Not logged in' | 'Error loading' | 'Error' };

const isConnection = (value: unknown): value is { id: unknown; notes?: unknown } =>
    typeof value === 'object' && value !== null && (value as { id?: unknown }).id != null;

/**
 * Loads a card's note: one GET, then one decrypt.
 *
 * `request` rejects when the message itself fails - a dead service worker, or
 * the 15-second deadline main.js puts on every message. `decrypt` rejects when
 * the note cannot be read. Neither escapes: every outcome is a NoteLoad.
 */
export async function readNote(
    request: () => Promise<ApiResponse>,
    decrypt: (notes: unknown) => Promise<string>,
): Promise<NoteLoad> {
    let response: ApiResponse;
    try {
        response = await request();
    } catch (error) {
        console.error('Error loading note:', error);
        return { state: 'failed', status: 'Error' };
    }

    if (response.status === 401) return { state: 'failed', status: 'Not logged in' };
    if (!response.ok) return { state: 'failed', status: 'Error loading' };

    // The API answers with a list, and only an empty list means "not in the
    // CRM". An ok answer that is no list of connections - the worker turns an
    // unparseable body into null - says nothing, and nothing is no licence to
    // write.
    const { data } = response;
    if (Array.isArray(data) && data.length === 0) {
        return { state: 'absent', status: 'Not in Rldnk yet' };
    }
    const connection = Array.isArray(data) ? data[0] : data;
    if (!isConnection(connection)) return { state: 'failed', status: 'Error loading' };

    try {
        const text = await decrypt(connection.notes);
        return { state: 'loaded', status: 'Saved', connectionId: connection.id, updatedAt: versionOf(connection), text };
    } catch (error) {
        console.error('Error decrypting note:', error);
        return { state: 'locked', status: 'Locked' };
    }
}

/**
 * What a save may send to a connection whose note this card never showed.
 *
 * A card that loaded "Not in Rldnk yet" has an empty field, and the connection
 * can appear after that with a note on it: the popup's form for a profile that
 * is not in the CRM creates it with one, and so does a second tab with its own
 * card. saveNote then finds it - by looking the id up again, or through a 409
 * on its POST - knowing only what was typed here. PATCHing that would replace
 * a note nobody saw on this card: the same overwrite as above, by another road.
 *
 * So that save reads the note first (`current`, from readNote) and sends the
 * stored text with what was typed after it, keeping both. Anything short of
 * this connection's note, read and decrypted - a failed or locked read, the
 * connection gone again, another id - gives null: send nothing, and the card
 * stays dirty for the next flush.
 */
export function textForUnseenNote(current: NoteLoad, connectionId: unknown, typed: string): string | null {
    if (current.state !== 'loaded' || current.connectionId !== connectionId) return null;
    if (!current.text || current.text === typed) return typed;
    return typed ? `${current.text}\n${typed}` : current.text;
}

/** What one PATCH answer means for the card. */
export type PatchOutcome =
    | { state: 'saved' }
    | { state: 'conflict'; current: VersionedRow }
    | { state: 'failed' };

/**
 * The version of the connection this card's text is based on: the `updatedAt`
 * of the row it loaded, created or last saved, exactly as the API sent it.
 *
 * Saves run one at a time (NoteCard.flush), and each takes the version the
 * previous answer left here, so autosave never conflicts with itself; only
 * another editor's save can.
 */
export interface NoteVersion {
    /** `fields` as a PATCH body that only applies to the version known here. */
    stamp<T extends object>(fields: T): T & { expectedUpdatedAt?: string };
    /** Reads a PATCH answer, keeping the new version of a successful one. */
    settle(response: ApiResponse): PatchOutcome;
    /** The version from a load, a POST that created the row, or a resolved conflict. */
    set(version: string | null): void;
}

export function createNoteVersion(): NoteVersion {
    let version: string | null = null;
    return {
        stamp: (fields) => withExpectedVersion(fields, version),
        settle: (response) => {
            if (response.ok) {
                version = versionOf(response.data);
                return { state: 'saved' };
            }
            const current = readConflict(response.status, response.data);
            return current ? { state: 'conflict', current } : { state: 'failed' };
        },
        set: (next) => {
            version = next;
        },
    };
}

/**
 * The status line under the card, written through one Text node that stays.
 *
 * Assigning `innerText` or `textContent` replaces the element's children: a
 * childList mutation, and main.js's body observer answers every one of those
 * with a full injection round. The input handler sets "Typing..." on each
 * keystroke, so twenty seconds of typing cost some forty rounds where four
 * would do. Changing a Text node's `data` is a characterData mutation, which
 * an observer watching childList does not see.
 */
export interface StatusLine {
    /** Shows `text`. Does nothing when it already shows exactly that. */
    readonly set: (text: string) => void;
    /** What it shows now. */
    readonly text: () => string;
}

export function createStatusLine(element: HTMLElement): StatusLine {
    const node = element.ownerDocument.createTextNode(element.textContent ?? '');
    element.replaceChildren(node);
    return {
        set: (text) => {
            // Put back if something replaced it after all; that costs one
            // childList mutation, once, instead of one per call.
            if (node.parentNode !== element) element.replaceChildren(node);
            if (node.data !== text) node.data = text;
        },
        text: () => node.data,
    };
}

export interface NoteCardOptions {
    textarea: HTMLTextAreaElement;
    /** See createStatusLine: never assign the element's text directly. */
    status: StatusLine;
    /** Shown beside the status after a load that retrying can fix. */
    retry: HTMLButtonElement;
    /** False once the card has left the page; SPA navigation removes it. */
    isAttached: () => boolean;
    /** One load of this card's note - see readNote. */
    load: () => Promise<NoteLoad>;
    /**
     * One save attempt. Resolves true only when the note is on the server, and
     * with the stored row when the server refused because another editor
     * saved a newer version (a 409 conflict).
     */
    save: () => Promise<SaveResult>;
    /** What the card offers after a conflict; see NoteConflictOptions. */
    conflict: NoteConflictOptions;
}

export type SaveResult = boolean | { conflict: VersionedRow };

/**
 * The buttons and I/O behind "Changed elsewhere". Shown beside the status,
 * like Retry, and only while they apply.
 */
export interface NoteConflictOptions {
    /** Shows the other version on the card; what was typed goes to the clipboard and can be put back. */
    loadOther: HTMLButtonElement;
    /** Saves what is on the card over the other version. */
    overwrite: HTMLButtonElement;
    /** After loadOther: puts the typed text back (and saves it). */
    undo: HTMLButtonElement;
    /** The other version's note as text. Rejects when it cannot be decrypted. */
    readText: (current: VersionedRow) => Promise<string>;
    /**
     * Makes `current` the version the next save is based on. `text` is what
     * the server holds for it when the card now shows that, null when the card
     * keeps its own text and will send it.
     */
    adopt: (current: VersionedRow, text: string | null) => void;
    /** Best effort; resolves false when the clipboard is not available. */
    copy: (text: string) => Promise<boolean>;
}

export const CONFLICT_STATUS = 'Changed elsewhere';
export const OTHER_LOADED_STATUS = 'Other version loaded';
export const OTHER_LOADED_COPIED_STATUS = 'Other version loaded, your text is copied';
export const OTHER_UNREADABLE_STATUS = 'Could not load other version';

export interface NoteCard {
    /**
     * Loads the note and opens the textarea if the outcome allows it. One load
     * at a time; none once loaded, because a reload would replace what has been
     * typed since; none for a card that has left the page.
     */
    load(): Promise<void>;
    /** Whether a load established what the server holds. Nothing saves before. */
    isLoaded(): boolean;
    /** The text on the card may differ from what the server has. */
    markDirty(): void;
    isDirty(): boolean;
    /**
     * A save was refused because the note changed elsewhere, and the user has
     * not chosen yet between the two versions. Nothing saves meanwhile.
     */
    isInConflict(): boolean;
    /**
     * Saves if dirty. Saves run one after another, and one that fails leaves
     * the card dirty, so the next input or page-hide flush tries again. There
     * is no timer here: a failing save is never retried in a loop, which
     * matters because the API's rate limiter counts per IP address.
     */
    flush(): Promise<void>;
    /**
     * Retires the card for good, keeping what is on it: the extension behind
     * this script is gone (an update or a reload), so no load or save can
     * reach anything. The text stays selectable - read-only, not disabled -
     * so it can be copied out, and `message` says what to do. After this the
     * card neither loads nor saves; a pending answer is not applied.
     */
    retire(message: string): void;
}

const LOCKED_PLACEHOLDER = 'Unable to decrypt this note. Open the Rolodink popup to sign in again.';

// Both, because the page's stylesheet is not ours: an author rule such as
// `button { display: inline-flex }` beats the browser's own [hidden] rule,
// and loses to an inline style.
function showButton(button: HTMLButtonElement, visible: boolean) {
    button.hidden = !visible;
    button.style.display = visible ? '' : 'none';
}

const isConflictResult = (result: SaveResult): result is { conflict: VersionedRow } =>
    typeof result === 'object' && result !== null && 'conflict' in result;

/** What the card hands its conflict handling: its own state, read and changed through these. */
interface ConflictHost {
    textarea: HTMLTextAreaElement;
    status: StatusLine;
    isRetired: () => boolean;
    /** Marks the card dirty and saves, through the normal serialized flush. */
    resave: () => void;
    /** The card shows what the server has; nothing to save. */
    markClean: () => void;
}

/**
 * "Changed elsewhere": the state between a 409 and the user's choice, and
 * the three buttons. Its own function for SonarCloud S3776, and because it is
 * a separate job from loading and saving.
 *
 *  - Overwrite: the other version becomes the base, and the card's text is
 *    saved over it.
 *  - Load other version: the typed text is copied to the clipboard (best
 *    effort) and kept here; the card shows the other version, which is what
 *    the server holds. Undo puts the typed text back and saves it - the same
 *    as Overwrite, a step later. Typing on dismisses Undo.
 *
 * Until one is chosen nothing saves: another attempt would only conflict
 * again, and the rate limiter counts per IP.
 */
function createConflictState(options: NoteConflictOptions, host: ConflictHost) {
    const { loadOther, overwrite, undo } = options;
    let current: VersionedRow | null = null;
    let stash: string | null = null;

    const showChoice = (visible: boolean) => {
        showButton(loadOther, visible);
        showButton(overwrite, visible);
    };
    const dropStash = () => {
        stash = null;
        showButton(undo, false);
    };

    const enter = (row: VersionedRow) => {
        current = row;
        dropStash();
        host.status.set(CONFLICT_STATUS);
        showChoice(true);
    };

    const leave = (row: VersionedRow, text: string | null) => {
        options.adopt(row, text);
        current = null;
        showChoice(false);
    };

    overwrite.addEventListener('click', () => {
        if (!current || host.isRetired()) return;
        leave(current, null);
        host.resave();
    });

    const showOther = async (row: VersionedRow) => {
        // Copied first, while the click still counts as a user gesture.
        const typed = host.textarea.value;
        const copied = await options.copy(typed);
        let text: string;
        try {
            text = await options.readText(row);
        } catch (error) {
            console.error('Error reading the other version:', error);
            host.status.set(OTHER_UNREADABLE_STATUS);
            return;
        }
        // Retired, or another click got here first.
        if (current !== row || host.isRetired()) return;
        leave(row, text);
        host.textarea.value = text;
        host.markClean();
        stash = typed;
        showButton(undo, true);
        host.status.set(copied ? OTHER_LOADED_COPIED_STATUS : OTHER_LOADED_STATUS);
    };
    loadOther.addEventListener('click', () => {
        if (!current || host.isRetired()) return;
        showOther(current).catch((error: unknown) => console.error('Error loading the other version:', error));
    });

    undo.addEventListener('click', () => {
        if (stash === null || host.isRetired()) return;
        host.textarea.value = stash;
        dropStash();
        host.resave();
    });

    showChoice(false);
    showButton(undo, false);

    return {
        enter,
        isOpen: () => current !== null,
        dropStash,
        hide: () => {
            showChoice(false);
            showButton(undo, false);
        },
    };
}

export function createNoteCard(options: NoteCardOptions): NoteCard {
    const { textarea, status, retry, isAttached } = options;
    let loaded = false;
    let dirty = false;
    let retired = false;
    let loading: Promise<void> | null = null;
    let saving: Promise<void> = Promise.resolve();

    const showRetry = (visible: boolean) => showButton(retry, visible);

    const apply = (note: NoteLoad) => {
        status.set(note.status);
        if (note.state === 'loaded') textarea.value = note.text;
        if (note.state === 'locked') {
            // Nothing rather than the ciphertext.
            textarea.value = '';
            textarea.placeholder = LOCKED_PLACEHOLDER;
        }
        loaded = note.state === 'loaded' || note.state === 'absent';
        textarea.disabled = !loaded;
        showRetry(note.state === 'failed');
    };

    const run = async () => {
        status.set('Loading...');
        textarea.disabled = true;
        showRetry(false);
        let note: NoteLoad;
        try {
            note = await options.load();
        } catch (error) {
            console.error('Error loading note:', error);
            note = { state: 'failed', status: 'Error' };
        }
        // Navigation took the card away while we waited. A new card gets built
        // for whatever page this is now; this answer belongs to neither.
        if (isAttached() && !retired) apply(note);
    };

    const load = (): Promise<void> => {
        if (loading) return loading;
        if (retired || loaded || !isAttached()) return Promise.resolve();
        loading = run().finally(() => {
            loading = null;
        });
        return loading;
    };

    const attempt = async () => {
        let saved = false;
        // Checked when the save runs, before anything is sent: a card that did
        // not load does not know what the server holds, and its PATCH would
        // replace that note with whatever is on the card. A save queued behind
        // the one that met a conflict waits for the user's choice as well.
        if (loaded && !conflict.isOpen()) {
            try {
                const result = await options.save();
                saved = result === true;
                if (isConflictResult(result) && !retired) conflict.enter(result.conflict);
            } catch (error) {
                console.error('Error saving note:', error);
            }
        }
        // Not saved, for whatever reason: the text exists only on the card.
        if (!saved) dirty = true;
    };

    const flush = (): Promise<void> => {
        // Retired: nothing can be sent, and the text stays on the card. In
        // conflict: the user chooses first (see createConflictState).
        if (retired || conflict.isOpen() || !dirty) return saving;
        dirty = false;
        saving = saving.then(attempt);
        return saving;
    };

    const conflict = createConflictState(options.conflict, {
        textarea,
        status,
        isRetired: () => retired,
        resave: () => {
            dirty = true;
            flush().catch((error: unknown) => console.error('Error saving note:', error));
        },
        markClean: () => {
            dirty = false;
        },
    });

    // Closed until a load has established what the server holds.
    textarea.disabled = true;
    showRetry(false);
    retry.addEventListener('click', () => {
        void load();
    });

    return {
        load,
        isLoaded: () => loaded,
        markDirty: () => {
            dirty = true;
            // Typing on after "Load other version": the text on the card is
            // the user's again, and Undo would replace it.
            conflict.dropStash();
        },
        isDirty: () => dirty,
        isInConflict: () => conflict.isOpen(),
        retire: (message) => {
            retired = true;
            textarea.readOnly = true;
            showRetry(false);
            conflict.hide();
            status.set(message);
        },
        flush,
    };
}
