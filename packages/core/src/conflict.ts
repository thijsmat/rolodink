/**
 * Optimistic concurrency for `PATCH /api/connections`.
 *
 * The same connection can be edited in the popup, in the note card on the
 * LinkedIn page and on another device. Without a version every save replaced
 * whatever was stored, so the slower of two edits silently erased the other.
 * The server cannot merge: the fields are ciphertext to it.
 *
 * So a client sends the `updatedAt` it last saw as `expectedUpdatedAt`, exactly
 * as the API serialised it (an ISO string with milliseconds). The server
 * applies the update only while the row still has that version; otherwise it
 * answers 409 with `{ error: 'conflict', code: CONNECTION_CONFLICT_CODE,
 * current }`, `current` being the row as GET returns it - still encrypted. The
 * client then decides: show the other version, or send again with
 * `current.updatedAt` to overwrite it.
 *
 * Without `expectedUpdatedAt` the server behaves as before, so older builds
 * keep working.
 *
 * A 409 on the same route can also mean "this URL is already another
 * connection" (a POST, or a PATCH of `url`); only the code tells them apart.
 */
export const CONNECTION_CONFLICT_CODE = 'CONNECTION_CONFLICT';

/** A row as the API returns it, as far as conflict handling needs to know. */
export interface VersionedRow {
    id: unknown;
    updatedAt?: unknown;
    [field: string]: unknown;
}

const isRow = (value: unknown): value is VersionedRow =>
    typeof value === 'object' && value !== null && (value as { id?: unknown }).id != null;

/**
 * The current row from a version-conflict answer, or null for any other
 * answer - including the duplicate-URL 409, which carries no `current`.
 */
export function readConflict(status: number, body: unknown): VersionedRow | null {
    if (status !== 409 || typeof body !== 'object' || body === null) return null;
    const { code, current } = body as { code?: unknown; current?: unknown };
    return code === CONNECTION_CONFLICT_CODE && isRow(current) ? current : null;
}

/** A row's `updatedAt` as the API sent it, or null when it has none. */
export function versionOf(row: unknown): string | null {
    if (typeof row !== 'object' || row === null) return null;
    const { updatedAt } = row as { updatedAt?: unknown };
    return typeof updatedAt === 'string' && updatedAt !== '' ? updatedAt : null;
}

/**
 * `body` plus `expectedUpdatedAt` when a version is known. Without one the
 * PATCH stays unconditional, as it always was: refusing to save would lose
 * the edit outright, which is worse than the risk this guards against.
 */
export function withExpectedVersion<T extends object>(
    body: T,
    version: string | null | undefined,
): T & { expectedUpdatedAt?: string } {
    return version ? { ...body, expectedUpdatedAt: version } : body;
}
