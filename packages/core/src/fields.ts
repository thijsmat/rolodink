/**
 * Per-field encryption for Connection records.
 *
 * `name` and `linkedInUrl` are deliberately NOT encrypted: the server filters on
 * `linkedInUrl` for the `?url=` lookup and enforces `[ownerId, linkedInUrl]`
 * uniqueness on it, and plaintext `name` is what makes the list render and
 * name-search work before any decryption has happened.
 */

import { isEncryptedString } from './crypto.js';

/** Mirrors SENSITIVE_FIELDS in the extension (ui/src/hooks/useConnectionLogic.ts). */
export const SENSITIVE_FIELDS = [
    'notes',
    'meetingPlace',
    'userCompanyAtTheTime',
    'email',
    'phone',
] as const;

export type SensitiveField = (typeof SENSITIVE_FIELDS)[number];

/**
 * The one place a platform plugs its crypto in.
 *
 * The web app implements this directly against an in-memory CryptoKey; the
 * extension implements it with `chrome.runtime.sendMessage({type:'ENCRYPT_TEXT'})`
 * because its content script has no access to the key; a React Native client
 * would swap in its own AES-GCM implementation. Everything else in this package
 * stays the same.
 */
export interface FieldCipher {
    encrypt(plaintext: string): Promise<string>;
    decrypt(ciphertext: string): Promise<string>;
}

type MaybeEncrypted = Record<string, unknown>;

/**
 * Encrypts every sensitive field that has a value.
 *
 * Throws if any field fails: writing one field as plaintext while the rest are
 * encrypted is exactly the inconsistency that made notes unreadable in the
 * first place, so there is no partial-success path here.
 */
export async function encryptSensitiveFields<T extends MaybeEncrypted>(
    data: T,
    cipher: FieldCipher
): Promise<T> {
    // Widened to a mutable record because TypeScript will not allow writing
    // through a generic index; narrowed back on return.
    const result: MaybeEncrypted = { ...data };

    for (const field of SENSITIVE_FIELDS) {
        const value = result[field];
        if (typeof value === 'string' && value.length > 0) {
            result[field] = await cipher.encrypt(value);
        }
    }

    return result as T;
}

export interface DecryptOptions {
    /**
     * Called instead of throwing when a field cannot be decrypted, so one bad
     * row does not blank an entire list. The field is left as null.
     */
    onError?: (field: SensitiveField, error: unknown) => void;
}

/**
 * Decrypts every sensitive field.
 *
 * Values without the `rolodink-enc:` prefix are passed through untouched: older
 * clients wrote plaintext, and those rows must stay readable.
 */
export async function decryptSensitiveFields<T extends MaybeEncrypted>(
    row: T,
    cipher: FieldCipher,
    options: DecryptOptions = {}
): Promise<T> {
    const result: MaybeEncrypted = { ...row };

    for (const field of SENSITIVE_FIELDS) {
        const value = result[field];
        if (typeof value !== 'string' || value.length === 0) continue;

        if (!isEncryptedString(value)) {
            // Legacy plaintext — already readable.
            continue;
        }

        try {
            result[field] = await cipher.decrypt(value);
        } catch (error) {
            if (!options.onError) throw error;
            options.onError(field, error);
            result[field] = null;
        }
    }

    return result as T;
}

/** Decrypts a list, one row at a time so a single bad row cannot fail the batch. */
export async function decryptMany<T extends MaybeEncrypted>(
    rows: readonly T[],
    cipher: FieldCipher,
    options: DecryptOptions = {}
): Promise<T[]> {
    const decrypted: T[] = [];
    for (const row of rows) {
        decrypted.push(await decryptSensitiveFields(row, cipher, options));
    }
    return decrypted;
}

/**
 * Lowercased haystack of every searchable field, for client-side search.
 *
 * Search has to happen on the client: everything except `name` and
 * `linkedInUrl` is ciphertext in the database, so the server cannot match on
 * it without giving up the encryption.
 */
export function buildSearchHaystack(row: MaybeEncrypted): string {
    const parts: string[] = [];

    for (const field of ['name', ...SENSITIVE_FIELDS]) {
        const value = row[field];
        if (typeof value === 'string' && value.length > 0 && !isEncryptedString(value)) {
            parts.push(value);
        }
    }

    return parts.join('\n').toLowerCase();
}
