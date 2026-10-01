import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import type { User } from '@supabase/supabase-js';
import type { Connection } from '../context/ConnectionContext';
import { LOCKED_FIELD_PLACEHOLDER } from '../utils/connectionUpdate';
import { clearDecryptMemo, decryptMemoSize } from '../utils/decryptMemo';
import { useConnectionLogic } from './useConnectionLogic';

/**
 * The real hook against a fake API and fake extension storage, to pin down
 * what an edit sends and what a delete leaves in the cache. Both bugs fixed
 * here lost or exposed data without an error anywhere: every edit silently
 * cleared email and phone, and every delete wrote the decrypted notes to
 * browser storage.
 */

vi.mock('../services/supabase', () => ({
    supabase: {
        auth: {
            getSession: async () => ({ data: { session: { access_token: 'token' } } }),
            signOut: async () => ({ error: null }),
        },
    },
}));
vi.mock('../config', () => ({ API_BASE_URL: 'https://api.test' }));
// Only the constant is needed; the real module pulls in the whole auth layer.
vi.mock('../context/ConnectionContext', () => ({ INVALID_PROFILE_PAGE_ERROR: 'invalid-profile-page' }));

const PREFIX = 'rolodink-enc:';
// Reversed so the plaintext never appears verbatim in "ciphertext", which
// lets the cache assertions search for it.
const encrypt = (text: string) => PREFIX + [...text].reverse().join('');
const decrypt = (ciphertext: string) => [...ciphertext.slice(PREFIX.length)].reverse().join('');
// A value encrypted under a key this browser no longer has.
const UNDECRYPTABLE = `${PREFIX}sealed-under-another-key`;

const PROFILE_URL = 'https://www.linkedin.com/in/jane-doe';
const FEED_URL = 'https://www.linkedin.com/feed/';
const USER = { id: 'user-1' } as User;

type Request = { method: string; url: string; body?: Record<string, unknown> };

let rows: Connection[];
let requests: Request[];
let storage: Record<string, unknown>;
let storageWrites: Record<string, unknown>[];
let unauthorized: boolean;
let failPatch: boolean;
let decryptCalls: number;
let failList: boolean;
let tabUrl: string;
// While set, the next list request waits for it, to finish after a newer one.
let holdList: Promise<void> | null;
// While set, every decryption waits for it; inFlight counts those waiting.
let holdDecrypt: Promise<void> | null;
let decryptsInFlight: number;
let maxDecryptsInFlight: number;
let currentUser: User;
let root: Root | null = null;
let probe: (() => null) | null = null;

/** A promise the test resolves when it chooses to. */
function newGate() {
    let release = () => {};
    const promise = new Promise<void>(resolve => { release = resolve; });
    return { promise, release: () => release() };
}

function respond(data: unknown): Response {
    return { ok: true, status: 200, statusText: 'OK', json: async () => data } as unknown as Response;
}

// Behaves like the connections API: a PATCH changes only the fields it names.
async function fakeFetch(input: string, init: RequestInit = {}): Promise<Response> {
    const method = init.method ?? 'GET';
    const body = typeof init.body === 'string' ? JSON.parse(init.body) : undefined;
    requests.push({ method, url: input, body });
    const url = new URL(input);
    if (unauthorized) {
        return { ok: false, status: 401, statusText: 'Unauthorized', json: async () => ({}) } as unknown as Response;
    }

    if (method === 'GET') {
        const wanted = url.searchParams.get('url');
        if (wanted) return respond(rows.filter(r => r.linkedInUrl === wanted));
        if (failList) throw new TypeError('Failed to fetch');
        const answer = structuredClone(rows);
        const hold = holdList;
        holdList = null;
        if (hold) await hold;
        return respond(answer);
    }
    if (method === 'PATCH') {
        if (failPatch) {
            return { ok: false, status: 500, statusText: 'Server Error', json: async () => ({}) } as unknown as Response;
        }
        const { id, ...changes } = body;
        const row = rows.find(r => r.id === id);
        if (!row) throw new Error(`PATCH for unknown id ${id}`);
        Object.assign(row, changes);
        return respond({ ...row });
    }
    if (method === 'DELETE') {
        const id = url.pathname.split('/').pop();
        rows = rows.filter(r => r.id !== id);
        return respond({ success: true });
    }
    throw new Error(`Unexpected ${method} ${input}`);
}

const fakeChrome = {
    storage: {
        local: {
            get: async (keys: string | string[]) =>
                Object.fromEntries((Array.isArray(keys) ? keys : [keys]).map(k => [k, storage[k]])),
            set: async (items: Record<string, unknown>) => {
                storageWrites.push(structuredClone(items));
                Object.assign(storage, items);
            },
            remove: async (keys: string | string[]) => {
                for (const k of Array.isArray(keys) ? keys : [keys]) delete storage[k];
            },
        },
    },
    tabs: {
        query: async () => [{ url: tabUrl, title: 'Jane Doe | LinkedIn' }],
    },
    runtime: {
        sendMessage: async (message: { type: string; text?: string; ciphertext?: string }) => {
            if (message.type === 'ENCRYPT_TEXT') {
                return { success: true, ciphertext: encrypt(message.text ?? '') };
            }
            if (message.type === 'DECRYPT_TEXT') {
                decryptCalls += 1;
                decryptsInFlight += 1;
                maxDecryptsInFlight = Math.max(maxDecryptsInFlight, decryptsInFlight);
                if (holdDecrypt) await holdDecrypt;
                decryptsInFlight -= 1;
                if (message.ciphertext === UNDECRYPTABLE) return { success: false, error: 'Decryption failed' };
                return { success: true, plaintext: decrypt(message.ciphertext ?? '') };
            }
            throw new Error(`Unexpected message ${message.type}`);
        },
    },
};

function janeRow(overrides: Partial<Connection> = {}): Connection {
    return {
        id: 'conn-jane',
        name: 'Jane Doe',
        linkedInUrl: PROFILE_URL,
        meetingPlace: encrypt('Web Summit'),
        userCompanyAtTheTime: encrypt('Acme'),
        notes: encrypt('Talked about hiring'),
        email: encrypt('jane@example.com'),
        phone: encrypt('+31 6 1234 5678'),
        ...overrides,
    };
}

async function renderHook() {
    const result: { current: ReturnType<typeof useConnectionLogic> | null } = { current: null };
    function Probe() {
        result.current = useConnectionLogic(currentUser);
        return null;
    }
    probe = Probe;
    root = createRoot(document.createElement('div'));
    await act(async () => {
        root?.render(createElement(Probe));
    });
    // The mount effects read the cache and fetch the open profile. Every fake
    // resolves at once, so one macrotask is enough for all of it to settle.
    await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
    });
    const hook = () => {
        if (!result.current) throw new Error('hook did not render');
        return result.current;
    };
    return hook;
}

beforeEach(() => {
    rows = [];
    requests = [];
    storage = {};
    storageWrites = [];
    unauthorized = false;
    failPatch = false;
    decryptCalls = 0;
    failList = false;
    tabUrl = PROFILE_URL;
    holdList = null;
    holdDecrypt = null;
    decryptsInFlight = 0;
    maxDecryptsInFlight = 0;
    currentUser = USER;
    // Module state: without this, one test's plaintexts answer the next one's.
    clearDecryptMemo();
    vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
    vi.stubGlobal('chrome', fakeChrome);
    vi.stubGlobal('fetch', fakeFetch);
    // The hook must not ask: ConnectionView asks once before calling it.
    vi.stubGlobal('confirm', () => {
        throw new Error('the hook called confirm()');
    });
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(async () => {
    await act(async () => root?.unmount());
    root = null;
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
});

describe('editing a connection in the popup', () => {
    it('keeps the email and phone the edit form does not show', async () => {
        rows = [janeRow()];
        const hook = await renderHook();
        expect(hook().connection?.email).toBe('jane@example.com');

        // What ConnectionForm submits: its three fields and nothing else.
        await act(async () => {
            await hook().handleUpdate({ meetingPlace: 'Web Summit', userCompanyAtTheTime: 'Acme', notes: 'Hiring in Q1' });
        });

        const patch = requests.find(r => r.method === 'PATCH');
        expect(patch?.body).toBeDefined();
        expect(Object.keys(patch?.body ?? {}).sort()).toEqual(['id', 'meetingPlace', 'notes', 'userCompanyAtTheTime']);
        expect(rows[0].email).toBe(encrypt('jane@example.com'));
        expect(rows[0].phone).toBe(encrypt('+31 6 1234 5678'));
        expect(rows[0].notes).toBe(encrypt('Hiring in Q1'));
        expect(hook().connection?.phone).toBe('+31 6 1234 5678');
    });

    it('still clears a field the user emptied', async () => {
        rows = [janeRow()];
        const hook = await renderHook();

        await act(async () => {
            await hook().handleUpdate({ meetingPlace: '', userCompanyAtTheTime: 'Acme', notes: 'Talked about hiring' });
        });

        expect(rows[0].meetingPlace).toBe('');
    });

    it('does not overwrite a note it could not decrypt', async () => {
        rows = [janeRow({ notes: UNDECRYPTABLE })];
        const hook = await renderHook();
        expect(hook().connection?.notes).toBe(LOCKED_FIELD_PLACEHOLDER);

        // The form was opened with the placeholder in the notes field and saved
        // after changing only the meeting place.
        await act(async () => {
            await hook().handleUpdate({ meetingPlace: 'Slush', userCompanyAtTheTime: 'Acme', notes: LOCKED_FIELD_PLACEHOLDER });
        });

        const patch = requests.find(r => r.method === 'PATCH');
        expect(patch?.body && 'notes' in patch.body).toBe(false);
        expect(rows[0].notes).toBe(UNDECRYPTABLE);
        expect(rows[0].meetingPlace).toBe(encrypt('Slush'));
        expect(hook().toastMessage).toMatch(/Vergrendelde velden/);
    });
    it('throws a failed save back to the form instead of swapping the view', async () => {
        rows = [janeRow()];
        const hook = await renderHook();
        failPatch = true;
        vi.spyOn(console, 'error').mockImplementation(() => {});

        let thrown: unknown = null;
        await act(async () => {
            try {
                await hook().handleUpdate({ meetingPlace: 'Slush', userCompanyAtTheTime: 'Acme', notes: 'Hiring' });
            } catch (e) {
                thrown = e;
            }
        });

        expect(thrown).toBeInstanceOf(Error);
        // Either of these makes App replace the edit form, and the text with it.
        expect(hook().error).toBeNull();
        expect(hook().isLoading).toBe(false);
        expect(hook().connection?.id).toBe('conn-jane');
        expect(rows[0].meetingPlace).toBe(encrypt('Web Summit'));
    });

    it('throws a failed create back to the form instead of swapping the view', async () => {
        rows = [];
        const hook = await renderHook();
        vi.spyOn(console, 'error').mockImplementation(() => {});

        // The fake API has no POST, so the request fails like a server error.
        let thrown: unknown = null;
        await act(async () => {
            try {
                await hook().handleCreateConnection({ meetingPlace: 'Slush', userCompanyAtTheTime: 'Acme', notes: 'Hiring' });
            } catch (e) {
                thrown = e;
            }
        });

        expect(thrown).toBeInstanceOf(Error);
        expect(requests.some(r => r.method === 'POST')).toBe(true);
        // Either of these makes App replace the new-connection form.
        expect(hook().error).toBeNull();
        expect(hook().isLoading).toBe(false);
    });
});

describe('deleting a connection in the popup', () => {
    it('leaves only encrypted rows in the cache', async () => {
        const bob: Connection = {
            id: 'conn-bob',
            name: 'Bob',
            linkedInUrl: 'https://www.linkedin.com/in/bob',
            meetingPlace: null,
            userCompanyAtTheTime: null,
            notes: encrypt('Owes me a coffee'),
            email: encrypt('bob@example.com'),
            phone: null,
        };
        rows = [janeRow(), bob];
        storage.cachedConnections = structuredClone(rows);
        storage.cachedConnectionsOwner = USER.id;
        const hook = await renderHook();
        await act(async () => {
            await hook().showCachedConnections();
        });
        // The list on screen is the decrypted copy.
        expect(hook().allConnections.map(c => c.notes)).toContain('Owes me a coffee');

        await act(async () => {
            await hook().handleDelete();
        });

        expect(requests.some(r => r.method === 'DELETE' && r.url.endsWith('/api/connections/conn-jane'))).toBe(true);
        expect(storage.cachedConnections).toEqual([bob]);
        expect(storage.cachedConnectionsOwner).toBe(USER.id);
        const written = JSON.stringify(storageWrites);
        expect(written).not.toContain('Owes me a coffee');
        expect(written).not.toContain('bob@example.com');
        expect(hook().allConnections.map(c => c.id)).toEqual(['conn-bob']);
    });
});

describe('the connections cache belongs to one user', () => {
    const cachedRow = () => janeRow({ id: 'conn-cached', notes: encrypt('Someone else\'s note') });

    it('does not show, and removes, a cache written for another user', async () => {
        storage.cachedConnections = [cachedRow()];
        storage.cachedConnectionsOwner = 'user-2';
        const hook = await renderHook();
        await act(async () => {
            await hook().showCachedConnections();
        });

        expect(hook().allConnections).toEqual([]);
        expect(storage.cachedConnections).toBeUndefined();
        expect(storage.cachedConnectionsOwner).toBeUndefined();
    });

    it('does not show a cache from before the owner was recorded', async () => {
        storage.cachedConnections = [cachedRow()];
        const hook = await renderHook();
        await act(async () => {
            await hook().showCachedConnections();
        });

        expect(hook().allConnections).toEqual([]);
        expect(storage.cachedConnections).toBeUndefined();
    });

    it('shows its own cache and records the owner when it writes', async () => {
        storage.cachedConnections = [cachedRow()];
        storage.cachedConnectionsOwner = USER.id;
        rows = [janeRow()];
        const hook = await renderHook();
        await act(async () => {
            await hook().showCachedConnections();
        });
        expect(hook().allConnections.map(c => c.notes)).toEqual(["Someone else's note"]);

        await act(async () => {
            await hook().fetchAllConnections();
        });

        expect(storage.cachedConnections).toEqual([janeRow()]);
        expect(storage.cachedConnectionsOwner).toBe(USER.id);
    });

    it('is removed when the list answers 401', async () => {
        storage.cachedConnections = [cachedRow()];
        storage.cachedConnectionsOwner = USER.id;
        const hook = await renderHook();
        unauthorized = true;

        await act(async () => {
            await hook().fetchAllConnections();
        });

        expect(storage.cachedConnections).toBeUndefined();
        expect(storage.cachedConnectionsOwner).toBeUndefined();
    });

    it('is removed when the open profile answers 401', async () => {
        storage.cachedConnections = [cachedRow()];
        storage.cachedConnectionsOwner = USER.id;
        unauthorized = true;
        await renderHook();

        expect(requests.some(r => r.url.includes('?url='))).toBe(true);
        expect(storage.cachedConnections).toBeUndefined();
    });
});

describe('opening the popup', () => {
    it('decrypts the cache once, not again when auth hands over a new user object', async () => {
        // Off a profile, where the start screen uses the list at once.
        tabUrl = FEED_URL;
        storage.cachedConnections = [janeRow({ id: 'conn-cached', linkedInUrl: 'https://www.linkedin.com/in/other' })];
        storage.cachedConnectionsOwner = USER.id;
        await renderHook();
        const afterMount = decryptCalls;
        expect(afterMount).toBeGreaterThan(0);

        // What onAuthStateChange does on a token refresh: same user, new object.
        currentUser = { ...USER } as User;
        await act(async () => {
            // Same component, so this is a re-render and not a remount.
            if (probe) root?.render(createElement(probe));
        });
        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 0));
        });

        expect(decryptCalls).toBe(afterMount);
    });

    it('on a profile, leaves the cached list encrypted until the list is opened', async () => {
        storage.cachedConnections = [janeRow({ id: 'conn-cached', linkedInUrl: 'https://www.linkedin.com/in/other' })];
        storage.cachedConnectionsOwner = USER.id;
        const hook = await renderHook();

        // The open profile has no saved connection, so nothing was decrypted.
        expect(decryptCalls).toBe(0);
        expect(hook().allConnections).toEqual([]);

        await act(async () => {
            await hook().showCachedConnections();
        });
        expect(hook().allConnections.map(c => c.id)).toEqual(['conn-cached']);
        expect(hook().allConnections[0].notes).toBe('Talked about hiring');
    });

    it('off a profile, shows the cached list at once for the start screen', async () => {
        tabUrl = FEED_URL;
        storage.cachedConnections = [janeRow({ id: 'conn-cached' })];
        storage.cachedConnectionsOwner = USER.id;
        const hook = await renderHook();

        expect(hook().allConnections.map(c => c.id)).toEqual(['conn-cached']);
    });
});

describe('a list load that has been overtaken', () => {
    const bob: Connection = { id: 'conn-bob', name: 'Bob', notes: encrypt('Owes me a coffee') };

    it('does not overwrite the answer of a newer load', async () => {
        rows = [janeRow()];
        const hook = await renderHook();
        const gate = newGate();
        holdList = gate.promise;

        let older: Promise<void> = Promise.resolve();
        await act(async () => {
            older = hook().fetchAllConnections(true);
            await Promise.resolve();
        });
        rows = [janeRow(), bob];
        await act(async () => {
            await hook().fetchAllConnections(true);
        });
        expect(hook().allConnections.map(c => c.id)).toEqual(['conn-jane', 'conn-bob']);

        await act(async () => {
            gate.release();
            await older;
        });
        expect(hook().allConnections.map(c => c.id)).toEqual(['conn-jane', 'conn-bob']);
        expect(storage.cachedConnections).toEqual([janeRow(), bob]);
    });

    it('writes nothing after sign-out', async () => {
        rows = [janeRow()];
        const hook = await renderHook();
        const gate = newGate();
        holdList = gate.promise;

        let load: Promise<void> = Promise.resolve();
        await act(async () => {
            load = hook().fetchAllConnections();
            await Promise.resolve();
        });
        await act(async () => {
            await hook().clearConnectionState();
        });
        await act(async () => {
            gate.release();
            await load;
        });

        expect(hook().allConnections).toEqual([]);
        expect(hook().error).toBeNull();
        expect(hook().isLoading).toBe(false);
        expect(storage.cachedConnections).toBeUndefined();
    });

    it('is dropped, with the list, when another account signs in', async () => {
        rows = [janeRow()];
        const hook = await renderHook();
        await act(async () => {
            await hook().fetchAllConnections();
        });
        expect(hook().allConnections).toHaveLength(1);
        const gate = newGate();
        holdList = gate.promise;
        let load: Promise<void> = Promise.resolve();
        await act(async () => {
            load = hook().fetchAllConnections(true);
            await Promise.resolve();
        });

        currentUser = { id: 'user-2' } as User;
        await act(async () => {
            if (probe) root?.render(createElement(probe));
        });
        await act(async () => {
            gate.release();
            await load;
        });

        expect(hook().allConnections).toEqual([]);
    });
});

describe('a failed list load', () => {
    it('keeps the last good list and shows the error', async () => {
        rows = [janeRow()];
        const hook = await renderHook();
        await act(async () => {
            await hook().fetchAllConnections();
        });
        failList = true;
        vi.spyOn(console, 'error').mockImplementation(() => {});

        await act(async () => {
            await hook().fetchAllConnections();
        });

        expect(hook().allConnections.map(c => c.id)).toEqual(['conn-jane']);
        expect(hook().error).toBe('Kon de connecties niet ophalen.');
    });

    it('a profile without a saved connection keeps the list too', async () => {
        rows = [janeRow({ linkedInUrl: 'https://www.linkedin.com/in/other' })];
        const hook = await renderHook();
        await act(async () => {
            await hook().fetchAllConnections();
        });

        await act(async () => {
            await hook().fetchData();
        });

        expect(hook().connection).toBeNull();
        expect(hook().allConnections).toHaveLength(1);
    });
});

describe('decrypting the list', () => {
    it('decrypts an unchanged list only once', async () => {
        rows = [janeRow()];
        const hook = await renderHook();
        await act(async () => {
            await hook().fetchAllConnections();
        });
        const afterFirst = decryptCalls;
        expect(afterFirst).toBeGreaterThan(0);

        await act(async () => {
            await hook().fetchAllConnections();
        });
        expect(decryptCalls).toBe(afterFirst);
        expect(hook().allConnections[0].notes).toBe('Talked about hiring');
    });

    it('forgets every plaintext on sign-out', async () => {
        rows = [janeRow()];
        const hook = await renderHook();
        await act(async () => {
            await hook().fetchAllConnections();
        });
        expect(decryptMemoSize()).toBeGreaterThan(0);

        await act(async () => {
            await hook().clearConnectionState();
        });
        expect(decryptMemoSize()).toBe(0);

        const before = decryptCalls;
        await act(async () => {
            await hook().fetchAllConnections();
        });
        expect(decryptCalls).toBeGreaterThan(before);
    });

    it('does not remember a field it could not decrypt', async () => {
        rows = [janeRow({ notes: UNDECRYPTABLE })];
        const hook = await renderHook();
        await act(async () => {
            await hook().fetchAllConnections();
        });
        const before = decryptCalls;

        await act(async () => {
            await hook().fetchAllConnections();
        });
        expect(decryptCalls).toBe(before + 1);
        expect(hook().allConnections[0].notes).toBe(LOCKED_FIELD_PLACEHOLDER);
    });

    it('asks for every field of every row at once, not one after another', async () => {
        tabUrl = FEED_URL;
        rows = [
            janeRow(),
            janeRow({
                id: 'conn-2',
                meetingPlace: encrypt('Slush'),
                userCompanyAtTheTime: encrypt('Initech'),
                notes: encrypt('Wants an intro'),
                email: encrypt('two@example.com'),
                phone: encrypt('+31 6 0000 0000'),
            }),
        ];
        const hook = await renderHook();
        const gate = newGate();
        holdDecrypt = gate.promise;

        let load: Promise<void> = Promise.resolve();
        await act(async () => {
            load = hook().fetchAllConnections();
            await new Promise(resolve => setTimeout(resolve, 0));
        });
        // Two rows of five encrypted fields, all waiting together.
        expect(maxDecryptsInFlight).toBe(10);

        await act(async () => {
            gate.release();
            await load;
        });
        expect(hook().allConnections.map(c => c.email)).toEqual(['jane@example.com', 'two@example.com']);
    });
});

describe('the profile URL the popup sends', () => {
    const VARIANT = 'https://nl.linkedin.com/in/Jane-Doe/details/experience/?originalSubdomain=nl';

    it('looks the open profile up by its canonical key', async () => {
        tabUrl = VARIANT;
        rows = [janeRow()];
        const hook = await renderHook();

        const lookups = requests.filter(r => r.url.includes('?url='));
        expect(lookups.length).toBeGreaterThan(0);
        for (const r of lookups) {
            expect(new URL(r.url).searchParams.get('url')).toBe(PROFILE_URL);
        }
        expect(hook().connection?.id).toBe('conn-jane');
    });

    it('creates under the canonical key, not the address bar', async () => {
        tabUrl = VARIANT;
        rows = [];
        const hook = await renderHook();
        vi.spyOn(console, 'error').mockImplementation(() => {});

        await act(async () => {
            await hook().handleCreateConnection({ notes: 'Hiring' }).catch(() => {});
        });

        const create = requests.find(r => r.method === 'POST');
        expect(create?.body?.url).toBe(PROFILE_URL);
    });
});
