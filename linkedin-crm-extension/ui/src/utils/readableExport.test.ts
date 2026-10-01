import { describe, expect, it, vi } from 'vitest';
import {
    READABLE_EXPORT_FIELDS,
    buildReadableExport,
    csvCell,
    mapWithConcurrency,
    readableExportFilename,
    toCsv,
    csvDelimiterFor,
    toJson,
    toReadableRow,
    type ReadableRow,
} from './readableExport';

const ENC = 'rolodink-enc:';

// Decrypts "rolodink-enc:<text>" to "<text>", except ciphertexts that say "locked".
const fakeDecrypt = vi.fn(async (ciphertext: string) => {
    const body = ciphertext.slice(ENC.length);
    return body.includes('locked') ? null : body;
});

function row(overrides: Partial<ReadableRow> = {}): ReadableRow {
    const base = Object.fromEntries(READABLE_EXPORT_FIELDS.map(f => [f, null])) as Record<string, null>;
    return { ...base, undecryptableFields: [], ...overrides } as ReadableRow;
}

describe('csvCell', () => {
    it('leaves plain values alone and writes empty for null', () => {
        expect(csvCell('Jane Doe')).toBe('Jane Doe');
        expect(csvCell(null)).toBe('');
        expect(csvCell('')).toBe('');
    });

    it('quotes values with a comma, quote or newline and doubles the quotes (RFC 4180)', () => {
        expect(csvCell('a,b')).toBe('"a,b"');
        expect(csvCell('say "hi"')).toBe('"say ""hi"""');
        expect(csvCell('line 1\nline 2')).toBe('"line 1\nline 2"');
        expect(csvCell('line 1\r\nline 2')).toBe('"line 1\r\nline 2"');
    });

    it.each(['=SUM(A1:A9)', '+31 6 12345678', '-2+3', '@cmd', '\tx', '\rx'])(
        'neutralises a leading formula character in %j',
        (value) => {
            const cell = csvCell(value);
            const unquoted = cell.startsWith('"') ? cell.slice(1, -1) : cell;
            expect(unquoted.startsWith(`'${value[0]}`)).toBe(true);
        },
    );

    it('neutralises before quoting, so the apostrophe sits inside the quotes', () => {
        expect(csvCell('=HYPERLINK("http://evil","x")')).toBe('"\'=HYPERLINK(""http://evil"",""x"")"');
    });

    it('does not touch the same characters further into a value', () => {
        expect(csvCell('a=b')).toBe('a=b');
        expect(csvCell('mail@example.com')).toBe('mail@example.com');
    });
});

describe('toCsv', () => {
    it('starts with a UTF-8 BOM and a readable English header, and ends lines with CRLF', () => {
        const csv = toCsv([row({ name: 'Jane', notes: 'Ëén, twee' })]);
        expect(csv.startsWith('﻿')).toBe(true);
        const lines = csv.slice(1).split('\r\n');
        expect(lines[0]).toBe('Name,LinkedIn URL,Meeting place,Company at the time,Email,Phone,Notes,Created at,Updated at,Not decrypted');
        expect(lines[1]).toBe('Jane,,,,,,"Ëén, twee",,,');
        expect(lines[2]).toBe('');
        expect(lines).toHaveLength(3);
    });

    it('encodes as UTF-8 with the BOM bytes first', () => {
        const bytes = new TextEncoder().encode(toCsv([]));
        expect([...bytes.slice(0, 3)]).toEqual([0xef, 0xbb, 0xbf]);
    });

    it('names the fields it could not decrypt in the last column', () => {
        const csv = toCsv([row({ name: 'Jane', undecryptableFields: ['notes', 'email'] })]);
        expect(csv.split('\r\n')[1].endsWith(',Notes / Email')).toBe(true);
    });
});

describe('toJson', () => {
    it('is pretty-printed, with a small header and the rows', () => {
        const json = toJson([row({ name: 'Jane' })], new Date('2026-10-01T12:00:00Z'));
        expect(json).toContain('\n  "format"');
        const parsed = JSON.parse(json);
        expect(Object.keys(parsed)).toEqual(['format', 'version', 'exportedAt', 'connections']);
        expect(parsed.format).toBe('rolodink-readable');
        expect(parsed.version).toBe(1);
        expect(parsed.exportedAt).toBe('2026-10-01T12:00:00.000Z');
        expect(parsed.connections).toHaveLength(1);
        expect(Object.keys(parsed.connections[0])).toEqual([...READABLE_EXPORT_FIELDS, 'undecryptableFields']);
    });
});

describe('toReadableRow and buildReadableExport', () => {
    const connection = {
        id: 'c1',
        ownerId: 'user-1',
        name: 'Jane Doe',
        linkedInUrl: 'https://www.linkedin.com/in/jane',
        meetingPlace: `${ENC}Conference`,
        userCompanyAtTheTime: 'Legacy plaintext BV',
        email: `${ENC}jane@example.com`,
        phone: `${ENC}locked-phone`,
        notes: `${ENC}locked-notes`,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-02-01T00:00:00.000Z',
    };

    it('decrypts encrypted fields, keeps legacy plaintext and drops other API fields', async () => {
        const result = await toReadableRow(connection, fakeDecrypt);
        expect(result).toEqual({
            name: 'Jane Doe',
            linkedInUrl: 'https://www.linkedin.com/in/jane',
            meetingPlace: 'Conference',
            userCompanyAtTheTime: 'Legacy plaintext BV',
            email: 'jane@example.com',
            phone: null,
            notes: null,
            createdAt: '2026-01-01T00:00:00.000Z',
            updatedAt: '2026-02-01T00:00:00.000Z',
            undecryptableFields: ['phone', 'notes'],
        });
    });

    it('flags a field whose decryption throws or still returns ciphertext', async () => {
        const result = await toReadableRow(
            { name: 'X', notes: `${ENC}a`, email: `${ENC}b` },
            async (c) => {
                if (c.endsWith('a')) throw new Error('no key');
                return `${ENC}still`;
            },
        );
        expect(result.notes).toBeNull();
        expect(result.email).toBeNull();
        expect(result.undecryptableFields).toEqual(['email', 'notes']);
    });

    it('counts every undecryptable field and never lets ciphertext into CSV or JSON', async () => {
        const connections = Array.from({ length: 30 }, (_, i) => ({ ...connection, id: `c${i}` }));
        const { rows, undecryptableCount } = await buildReadableExport(connections, fakeDecrypt);
        expect(rows).toHaveLength(30);
        expect(undecryptableCount).toBe(60);
        expect(toCsv(rows)).not.toContain(ENC);
        expect(toJson(rows, new Date())).not.toContain(ENC);
        expect(toCsv(rows)).not.toContain('locked');
    });
});

describe('mapWithConcurrency', () => {
    it('keeps input order, never runs more than the limit at once and reports progress', async () => {
        let running = 0;
        let peak = 0;
        const progress: number[] = [];
        const items = Array.from({ length: 50 }, (_, i) => i);
        const results = await mapWithConcurrency(items, 4, async (n) => {
            running++;
            peak = Math.max(peak, running);
            await new Promise(resolve => setTimeout(resolve, n % 3));
            running--;
            return n * 2;
        }, (done) => progress.push(done));
        expect(results).toEqual(items.map(n => n * 2));
        expect(peak).toBe(4);
        expect(progress).toEqual(items.map(n => n + 1));
    });

    it('handles an empty list', async () => {
        await expect(mapWithConcurrency([], 4, async () => 1)).resolves.toEqual([]);
    });
});

describe('readableExportFilename', () => {
    it('uses the local date and the format as extension', () => {
        const date = new Date(2026, 0, 5, 23, 30);
        expect(readableExportFilename('csv', date)).toBe('rolodink-readable-export-2026-01-05.csv');
        expect(readableExportFilename('json', date)).toBe('rolodink-readable-export-2026-01-05.json');
    });
});

describe('semicolon CSV for Dutch Excel', () => {
    it('picks the delimiter from the UI language', () => {
        expect(csvDelimiterFor('nl')).toBe(';');
        expect(csvDelimiterFor('nl-NL')).toBe(';');
        expect(csvDelimiterFor('de')).toBe(';');
        expect(csvDelimiterFor('en-US')).toBe(',');
        expect(csvDelimiterFor(undefined)).toBe(',');
    });

    it('separates on ; and quotes cells that contain it', () => {
        const csv = toCsv([row({ name: 'Jane', notes: 'a;b, c' })], ';');
        const line = csv.split('\r\n')[1];
        expect(line.startsWith('Jane;')).toBe(true);
        expect(line).toContain('"a;b, c"');
        expect(csv.split('\r\n')[0]).toContain('Name;LinkedIn URL;');
    });
});

describe('mapWithConcurrency after a failure', () => {
    it('stops starting new items and reports no more progress', async () => {
        const started: number[] = [];
        const progress: number[] = [];
        const run = mapWithConcurrency([1, 2, 3, 4, 5, 6], 2, async (n) => {
            started.push(n);
            if (n === 2) throw new Error('boom');
            return n;
        }, (done) => progress.push(done));
        await expect(run).rejects.toThrow('boom');
        await new Promise((resolve) => setTimeout(resolve, 0));
        expect(started.length).toBeLessThan(6);
        const after = progress.length;
        await new Promise((resolve) => setTimeout(resolve, 0));
        expect(progress).toHaveLength(after);
    });
});
