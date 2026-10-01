import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act } from 'react';
import { createDomHarness } from '../test/domHarness';
import { SettingsView } from './SettingsView';
import { clearDecryptMemo } from '../utils/decryptMemo';
import { REVOKE_DELAY_MS } from '../utils/download';

/**
 * The two exports in Settings: the server's encrypted backup, unchanged, and
 * the readable export that fetches every connection, decrypts it through the
 * background script and downloads CSV or JSON.
 */

const auth = vi.hoisted(() => ({ getSession: vi.fn() }));
const context = vi.hoisted(() => ({
    setToastMessage: vi.fn(),
    fetchAllConnections: vi.fn(),
    handleLogout: vi.fn(),
}));

vi.mock('../services/supabase', () => ({ supabase: { auth } }));
vi.mock('../config', () => ({ API_BASE_URL: 'https://api.test' }));
vi.mock('../context/ConnectionContext', () => ({ useConnection: () => context }));
vi.mock('../context/UpdateContext', () => ({
    useUpdate: () => ({
        versionInfo: null,
        isCheckingForUpdates: false,
        checkForUpdates: vi.fn(),
        getCurrentVersion: () => '0.0.0',
    }),
}));

const ENC = 'rolodink-enc:';

const dom = createDomHarness();
const { render, button, click } = dom;

let fetchMock: ReturnType<typeof vi.fn>;
let sendMessage: ReturnType<typeof vi.fn>;
let downloads: { filename: string; blob: Blob }[];
let revoked: string[];

function apiRow(i: number, overrides: Record<string, unknown> = {}) {
    return {
        id: `c${i}`,
        ownerId: 'user-1',
        name: `Person ${i}`,
        linkedInUrl: `https://www.linkedin.com/in/p${i}`,
        meetingPlace: `${ENC}place-${i}`,
        userCompanyAtTheTime: null,
        email: `${ENC}p${i}@example.com`,
        phone: `${ENC}=1+${i}`,
        notes: `${ENC}note ${i}, "quoted"\nline two`,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-02-01T00:00:00.000Z',
        ...overrides,
    };
}

function respondWith(rows: unknown[]) {
    fetchMock.mockResolvedValue({ ok: true, status: 200, json: async () => rows });
}

beforeEach(() => {
    vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
    clearDecryptMemo();
    // Decrypts "rolodink-enc:<text>" to "<text>"; anything containing "locked" fails like a missing key.
    sendMessage = vi.fn(async (message: { type: string; ciphertext: string }) => {
        const body = message.ciphertext.slice(ENC.length);
        return body.includes('locked') ? { success: false, error: 'No key' } : { success: true, plaintext: body };
    });
    vi.stubGlobal('chrome', {
        i18n: {
            getMessage: (key: string, subs?: string[]) => (subs ? `${key}:${subs.join('|')}` : key),
            getUILanguage: () => 'en',
        },
        runtime: { sendMessage },
    });
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    auth.getSession.mockResolvedValue({ data: { session: { access_token: 'token', user: { id: 'user-1' } } } });

    downloads = [];
    revoked = [];
    let blobCount = 0;
    const blobs = new Map<string, Blob>();
    // jsdom has neither, so they are defined here and removed after each test.
    Object.assign(URL, {
        createObjectURL: vi.fn((blob: Blob) => {
            const url = `blob:test/${++blobCount}`;
            blobs.set(url, blob);
            return url;
        }),
        revokeObjectURL: vi.fn((url: string) => { revoked.push(url); }),
    });
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
        downloads.push({ filename: this.download, blob: blobs.get(this.href) as Blob });
    });
});

afterEach(async () => {
    await dom.unmount();
    vi.restoreAllMocks();
    const urlStatics = URL as unknown as Record<string, unknown>;
    delete urlStatics.createObjectURL;
    delete urlStatics.revokeObjectURL;
    vi.unstubAllGlobals();
    vi.clearAllMocks();
    vi.useRealTimers();
});

// jsdom's Blob has no text() or arrayBuffer(); FileReader it does have.
function readBytes(blob: Blob): Promise<Uint8Array> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(new Uint8Array(reader.result as ArrayBuffer));
        reader.onerror = () => reject(reader.error);
        reader.readAsArrayBuffer(blob);
    });
}

// Decoded without stripping the BOM, so tests can see it is there.
async function readText(blob: Blob): Promise<string> {
    return new TextDecoder('utf-8', { ignoreBOM: true }).decode(await readBytes(blob));
}

const today = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

describe('readable export', () => {
    it('shows the unencrypted-file warning next to the buttons', async () => {
        await render(SettingsView);
        expect(dom.container.textContent).toContain('readable_export_warning');
        expect(button('readable_export_csv_button')).toBeTruthy();
        expect(button('readable_export_json_button')).toBeTruthy();
    });

    it('fetches the list fresh and downloads a decrypted CSV with the right filename', async () => {
        respondWith([apiRow(1), apiRow(2)]);
        await render(SettingsView);
        await click(button('readable_export_csv_button'));
        await dom.settle();

        expect(fetchMock).toHaveBeenCalledWith('https://api.test/api/connections', {
            headers: { Authorization: 'Bearer token' },
        });
        expect(downloads).toHaveLength(1);
        expect(downloads[0].filename).toBe(`rolodink-readable-export-${today()}.csv`);
        expect(downloads[0].blob.type).toBe('text/csv;charset=utf-8');

        const bytes = await readBytes(downloads[0].blob);
        expect([...bytes.slice(0, 3)]).toEqual([0xef, 0xbb, 0xbf]);
        const csv = new TextDecoder().decode(bytes.slice(3));
        expect(csv).not.toContain(ENC);
        expect(csv).toContain('p1@example.com');
        expect(csv).toContain(`"note 1, ""quoted""\nline two"`);
        expect(csv).toContain(`'=1+1`);
        expect(context.setToastMessage).toHaveBeenLastCalledWith('msg_readable_export_success:2');
        // No anchor left behind in the popup.
        expect(document.querySelector('a[download]')).toBeNull();
    });

    it('revokes the object URL a moment after the download has started', async () => {
        vi.useFakeTimers({ toFake: ['setTimeout'], shouldAdvanceTime: true });
        respondWith([apiRow(1)]);
        await render(SettingsView);
        await click(button('readable_export_csv_button'));
        await dom.settle();
        expect(downloads).toHaveLength(1);
        expect(revoked).toEqual([]);
        vi.advanceTimersByTime(REVOKE_DELAY_MS);
        expect(revoked).toEqual(['blob:test/1']);
    });

    it('downloads JSON with the header and the rows', async () => {
        respondWith([apiRow(1)]);
        await render(SettingsView);
        await click(button('readable_export_json_button'));
        await dom.settle();

        expect(downloads[0].filename).toBe(`rolodink-readable-export-${today()}.json`);
        const parsed = JSON.parse(await readText(downloads[0].blob));
        expect(parsed.format).toBe('rolodink-readable');
        expect(parsed.version).toBe(1);
        expect(typeof parsed.exportedAt).toBe('string');
        expect(parsed.connections[0]).toMatchObject({
            name: 'Person 1',
            meetingPlace: 'place-1',
            email: 'p1@example.com',
            phone: '=1+1',
            undecryptableFields: [],
        });
    });

    it('leaves undecryptable fields empty, flags them and says how many there were', async () => {
        respondWith([
            apiRow(1, { notes: `${ENC}locked-1`, email: `${ENC}locked-2` }),
            apiRow(2, { phone: `${ENC}locked-3` }),
        ]);
        await render(SettingsView);
        await click(button('readable_export_json_button'));
        await dom.settle();

        const text = await readText(downloads[0].blob);
        expect(text).not.toContain(ENC);
        expect(text).not.toContain('locked');
        expect(text).not.toContain('Encrypted - Passphrase Required');
        const parsed = JSON.parse(text);
        expect(parsed.connections[0].notes).toBeNull();
        expect(parsed.connections[0].undecryptableFields).toEqual(['email', 'notes']);
        expect(parsed.connections[1].undecryptableFields).toEqual(['phone']);
        expect(context.setToastMessage).toHaveBeenLastCalledWith('msg_readable_export_partial:2|3');
    });

    it('treats every encrypted field as undecryptable when the extension API is missing', async () => {
        vi.stubGlobal('chrome', {
            i18n: { getMessage: (key: string, subs?: string[]) => (subs ? `${key}:${subs.join('|')}` : key), getUILanguage: () => 'en' },
        });
        respondWith([apiRow(1)]);
        await render(SettingsView);
        await click(button('readable_export_csv_button'));
        await dom.settle();
        const csv = await readText(downloads[0].blob);
        expect(csv).not.toContain(ENC);
        expect(context.setToastMessage).toHaveBeenLastCalledWith('msg_readable_export_partial:1|4');
    });

    it('decrypts a thousand rows with bounded parallelism', async () => {
        let inFlight = 0;
        let peak = 0;
        const base = sendMessage.getMockImplementation()!;
        sendMessage.mockImplementation(async (message) => {
            inFlight++;
            peak = Math.max(peak, inFlight);
            await new Promise(resolve => setTimeout(resolve, 0));
            inFlight--;
            return base(message);
        });
        respondWith(Array.from({ length: 1000 }, (_, i) => apiRow(i)));
        await render(SettingsView);
        await click(button('readable_export_csv_button'));
        await act(() => vi.waitFor(() => {
            expect(dom.container.querySelector('output')?.textContent).toMatch(/^readable_export_progress:\d+\|1000$/);
        }));
        await act(() => vi.waitFor(() => expect(downloads).toHaveLength(1), { timeout: 5000 }));

        expect(sendMessage).toHaveBeenCalledTimes(4000);
        // 8 rows at a time, at most 5 encrypted fields each.
        expect(peak).toBeLessThanOrEqual(40);
        expect(peak).toBeGreaterThan(1);
        const csv = await readText(downloads[0].blob);
        // Header, 1000 rows and the final line end; a note's own \n is not a row end.
        expect(csv.split('\r\n')).toHaveLength(1002);
    });

    it('shows a busy state and disables both buttons while it runs', async () => {
        let release: (rows: unknown[]) => void = () => {};
        fetchMock.mockReturnValue(new Promise(resolve => {
            release = (rows) => resolve({ ok: true, status: 200, json: async () => rows });
        }));
        await render(SettingsView);
        await click(button('readable_export_csv_button'));

        expect(button('exporting_button').disabled).toBe(true);
        expect(button('readable_export_json_button').disabled).toBe(true);
        expect(dom.container.querySelector('output')?.textContent).toBe('readable_export_fetching');

        release([apiRow(1)]);
        await dom.settle();
        await dom.settle();
        expect(downloads).toHaveLength(1);
        expect(button('readable_export_csv_button').disabled).toBe(false);
        expect(dom.container.querySelector('output')).toBeNull();
    });

    it('does not download when the list cannot be fetched', async () => {
        fetchMock.mockResolvedValue({ ok: false, status: 500, json: async () => ({}) });
        await render(SettingsView);
        await click(button('readable_export_csv_button'));
        await dom.settle();
        expect(downloads).toHaveLength(0);
        expect(context.setToastMessage).toHaveBeenLastCalledWith('msg_export_failed');
    });

    it('does not fetch when signed out', async () => {
        auth.getSession.mockResolvedValue({ data: { session: null } });
        await render(SettingsView);
        await click(button('readable_export_json_button'));
        expect(fetchMock).not.toHaveBeenCalled();
        expect(downloads).toHaveLength(0);
        expect(context.setToastMessage).toHaveBeenLastCalledWith('msg_not_logged_in_export');
    });
});

describe('encrypted backup', () => {
    it('still downloads the server export under its own filename', async () => {
        const blob = new Blob(['{"connections":[]}'], { type: 'application/json' });
        fetchMock.mockResolvedValue({
            ok: true,
            status: 200,
            headers: new Headers({ 'Content-Disposition': 'attachment; filename="linkedin-crm-export-2026-10-01.json"' }),
            blob: async () => blob,
        });
        await render(SettingsView);
        await click(button('export_data_button'));
        await dom.settle();
        expect(fetchMock).toHaveBeenCalledWith('https://api.test/api/user/export', expect.anything());
        expect(downloads).toEqual([{ filename: 'linkedin-crm-export-2026-10-01.json', blob }]);
        expect(context.setToastMessage).toHaveBeenLastCalledWith('msg_export_success');
    });
});
