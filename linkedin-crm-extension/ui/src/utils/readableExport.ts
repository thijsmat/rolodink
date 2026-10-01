import { isEncryptedString } from '@rolodink/core';

/**
 * The readable export: every connection with its fields decrypted in the
 * popup, as CSV or JSON. The server's own export (/api/user/export) stays
 * encrypted by design, because the server never has the key.
 *
 * A field that cannot be decrypted is never written as ciphertext dressed up
 * as text: it is left empty (null in JSON) and named in the row's
 * undecryptableFields, and the caller tells the user how many there were.
 */

export const READABLE_EXPORT_FIELDS = [
    'name',
    'linkedInUrl',
    'meetingPlace',
    'userCompanyAtTheTime',
    'email',
    'phone',
    'notes',
    'createdAt',
    'updatedAt',
] as const;

export type ReadableField = (typeof READABLE_EXPORT_FIELDS)[number];

export type ReadableRow = Record<ReadableField, string | null> & {
    /** Fields that were encrypted and could not be decrypted, in column order. */
    undecryptableFields: ReadableField[];
};

export type ReadableExportFormat = 'csv' | 'json';

/** Null when the value cannot be decrypted. */
export type DecryptFn = (ciphertext: string) => Promise<string | null>;

export const READABLE_EXPORT_FORMAT_ID = 'rolodink-readable';
export const READABLE_EXPORT_VERSION = 1;

/**
 * Fixed English column names, whatever the UI language: the JSON keys are
 * English too, and a header that changed with the browser language would
 * break any import mapping or formula built on an earlier export.
 */
export const CSV_HEADERS: Readonly<Record<ReadableField, string>> = {
    name: 'Name',
    linkedInUrl: 'LinkedIn URL',
    meetingPlace: 'Meeting place',
    userCompanyAtTheTime: 'Company at the time',
    email: 'Email',
    phone: 'Phone',
    notes: 'Notes',
    createdAt: 'Created at',
    updatedAt: 'Updated at',
};

export const CSV_UNDECRYPTABLE_HEADER = 'Not decrypted';

type FieldResult = { value: string | null; locked: boolean };

async function readableValue(raw: unknown, decrypt: DecryptFn): Promise<FieldResult> {
    if (typeof raw !== 'string') return { value: null, locked: false };
    // Legacy rows were written as plaintext and are readable as they are.
    if (!isEncryptedString(raw)) return { value: raw, locked: false };
    const plaintext = await decrypt(raw).catch(() => null);
    // A "plaintext" that is itself still ciphertext does not count either.
    if (plaintext === null || isEncryptedString(plaintext)) return { value: null, locked: true };
    return { value: plaintext, locked: false };
}

/** One connection as the API sent it, with every exported field made readable. */
export async function toReadableRow(connection: Readonly<Record<string, unknown>>, decrypt: DecryptFn): Promise<ReadableRow> {
    const results = await Promise.all(
        READABLE_EXPORT_FIELDS.map(field => readableValue(connection[field], decrypt)),
    );
    const values = {} as Record<ReadableField, string | null>;
    const undecryptableFields: ReadableField[] = [];
    READABLE_EXPORT_FIELDS.forEach((field, i) => {
        values[field] = results[i].value;
        if (results[i].locked) undecryptableFields.push(field);
    });
    return { ...values, undecryptableFields };
}

/**
 * Run fn over items with at most `limit` running at once, results in input
 * order. Each finished item reports progress.
 */
export async function mapWithConcurrency<T, R>(
    items: readonly T[],
    limit: number,
    fn: (item: T) => Promise<R>,
    onProgress?: (done: number, total: number) => void,
): Promise<R[]> {
    const results = new Array<R>(items.length);
    let next = 0;
    let done = 0;
    const worker = async () => {
        while (next < items.length) {
            const index = next++;
            results[index] = await fn(items[index]);
            done++;
            onProgress?.(done, items.length);
        }
    };
    const workers = Math.max(1, Math.min(limit, items.length));
    await Promise.all(Array.from({ length: workers }, worker));
    return results;
}

/** Rows at a time; each row decrypts its own fields together, so up to 8 x 5 messages are in flight. */
export const READABLE_EXPORT_CONCURRENCY = 8;

export async function buildReadableExport(
    connections: ReadonlyArray<Readonly<Record<string, unknown>>>,
    decrypt: DecryptFn,
    onProgress?: (done: number, total: number) => void,
): Promise<{ rows: ReadableRow[]; undecryptableCount: number }> {
    const rows = await mapWithConcurrency(
        connections,
        READABLE_EXPORT_CONCURRENCY,
        connection => toReadableRow(connection, decrypt),
        onProgress,
    );
    const undecryptableCount = rows.reduce((sum, row) => sum + row.undecryptableFields.length, 0);
    return { rows, undecryptableCount };
}

// A spreadsheet treats a cell starting with one of these as a formula (tab
// and carriage return too, in some), which a crafted note could abuse.
const FORMULA_TRIGGERS = new Set(['=', '+', '-', '@', '\t', '\r']);

/** One CSV cell: formula-neutralised, then quoted per RFC 4180 when needed. */
export function csvCell(value: string | null): string {
    if (!value) return '';
    const safe = FORMULA_TRIGGERS.has(value[0]) ? `'${value}` : value;
    const needsQuotes = safe.includes('"') || safe.includes(',') || safe.includes('\n') || safe.includes('\r');
    return needsQuotes ? `"${safe.replaceAll('"', '""')}"` : safe;
}

const CSV_LINE_END = '\r\n';
const UTF8_BOM = '﻿';

/** CSV text with a BOM, so Excel reads it as UTF-8, and CRLF line ends. */
export function toCsv(rows: readonly ReadableRow[]): string {
    const header = [...READABLE_EXPORT_FIELDS.map(field => CSV_HEADERS[field]), CSV_UNDECRYPTABLE_HEADER];
    const lines = [header.map(csvCell).join(',')];
    for (const row of rows) {
        const cells = READABLE_EXPORT_FIELDS.map(field => csvCell(row[field]));
        cells.push(csvCell(row.undecryptableFields.map(field => CSV_HEADERS[field]).join('; ')));
        lines.push(cells.join(','));
    }
    return UTF8_BOM + lines.join(CSV_LINE_END) + CSV_LINE_END;
}

export function toJson(rows: readonly ReadableRow[], exportedAt: Date): string {
    return JSON.stringify({
        format: READABLE_EXPORT_FORMAT_ID,
        version: READABLE_EXPORT_VERSION,
        exportedAt: exportedAt.toISOString(),
        connections: rows,
    }, null, 2);
}

export function toExportBlob(rows: readonly ReadableRow[], format: ReadableExportFormat, exportedAt: Date): Blob {
    if (format === 'csv') return new Blob([toCsv(rows)], { type: 'text/csv;charset=utf-8' });
    return new Blob([toJson(rows, exportedAt)], { type: 'application/json;charset=utf-8' });
}

/** rolodink-readable-export-YYYY-MM-DD.csv|json, in the user's local date. */
export function readableExportFilename(format: ReadableExportFormat, date: Date): string {
    const pad = (n: number) => String(n).padStart(2, '0');
    const day = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
    return `rolodink-readable-export-${day}.${format}`;
}
