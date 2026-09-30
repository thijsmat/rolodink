import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import type { User } from '@supabase/supabase-js';
import type { Connection } from '../context/ConnectionContext';
import { LOCKED_FIELD_PLACEHOLDER } from '../utils/connectionUpdate';
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
const USER = { id: 'user-1' } as User;

type Request = { method: string; url: string; body?: Record<string, unknown> };

let rows: Connection[];
let requests: Request[];
let storage: Record<string, unknown>;
let storageWrites: Record<string, unknown>[];
let root: Root | null = null;

function respond(data: unknown): Response {
    return { ok: true, status: 200, statusText: 'OK', json: async () => data } as unknown as Response;
}

// Behaves like the connections API: a PATCH changes only the fields it names.
async function fakeFetch(input: string, init: RequestInit = {}): Promise<Response> {
    const method = init.method ?? 'GET';
    const body = typeof init.body === 'string' ? JSON.parse(init.body) : undefined;
    requests.push({ method, url: input, body });
    const url = new URL(input);

    if (method === 'GET') {
        const wanted = url.searchParams.get('url');
        return respond(wanted ? rows.filter(r => r.linkedInUrl === wanted) : rows);
    }
    if (method === 'PATCH') {
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
            get: async (key: string) => ({ [key]: storage[key] }),
            set: async (items: Record<string, unknown>) => {
                storageWrites.push(structuredClone(items));
                Object.assign(storage, items);
            },
            remove: async () => {},
        },
    },
    tabs: {
        query: async () => [{ url: PROFILE_URL, title: 'Jane Doe | LinkedIn' }],
    },
    runtime: {
        sendMessage: async (message: { type: string; text?: string; ciphertext?: string }) => {
            if (message.type === 'ENCRYPT_TEXT') {
                return { success: true, ciphertext: encrypt(message.text ?? '') };
            }
            if (message.type === 'DECRYPT_TEXT') {
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
        result.current = useConnectionLogic(USER);
        return null;
    }
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
    vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
    vi.stubGlobal('chrome', fakeChrome);
    vi.stubGlobal('fetch', fakeFetch);
    vi.stubGlobal('confirm', () => true);
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
        const hook = await renderHook();
        // The list on screen is the decrypted copy.
        expect(hook().allConnections.map(c => c.notes)).toContain('Owes me a coffee');

        await act(async () => {
            await hook().handleDelete();
        });

        expect(requests.some(r => r.method === 'DELETE' && r.url.endsWith('/api/connections/conn-jane'))).toBe(true);
        expect(storage.cachedConnections).toEqual([bob]);
        const written = JSON.stringify(storageWrites);
        expect(written).not.toContain('Owes me a coffee');
        expect(written).not.toContain('bob@example.com');
        expect(hook().allConnections.map(c => c.id)).toEqual(['conn-bob']);
    });
});
