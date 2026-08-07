/**
 * Envelope encryption for per-user data keys.
 *
 * Each user gets a random 32-byte AES data key. That key is wrapped with the
 * server-held `ENCRYPTION_MASTER_KEY` and stored in `user_keys.encrypted_key` as
 *
 *     base64( iv[12] || authTag[16] || wrappedKey )
 *
 * with `user_keys.salt` holding the format marker `envelope-v1` (a leftover
 * column name from the old passphrase scheme).
 *
 * This is the single implementation — the API route and the maintenance scripts
 * both use it, so the format can never drift between them.
 */

import { randomBytes, createCipheriv, createDecipheriv } from 'crypto';

export const ENVELOPE_VERSION = 'envelope-v1';

/** Reads and validates the master key. Throws when it is missing or the wrong size. */
export function getMasterKey(): Buffer {
    const masterKeyB64 = process.env.ENCRYPTION_MASTER_KEY;
    if (!masterKeyB64) {
        throw new Error('ENCRYPTION_MASTER_KEY not configured');
    }
    const masterKey = Buffer.from(masterKeyB64, 'base64');
    if (masterKey.length !== 32) {
        throw new Error('ENCRYPTION_MASTER_KEY must be a base64-encoded 32-byte key');
    }
    return masterKey;
}

/** Wraps a raw data key for storage. */
export function wrapDataKey(dataKey: Buffer, masterKey: Buffer): string {
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', masterKey, iv);
    const ciphertext = Buffer.concat([cipher.update(dataKey), cipher.final()]);
    const authTag = cipher.getAuthTag();
    return Buffer.concat([iv, authTag, ciphertext]).toString('base64');
}

/** Unwraps a stored data key. Throws when the blob is malformed or the master key is wrong. */
export function unwrapDataKey(wrapped: string, masterKey: Buffer): Buffer {
    const blob = Buffer.from(wrapped, 'base64');
    if (blob.length < 28) {
        throw new Error('Invalid wrapped key length');
    }
    const iv = blob.subarray(0, 12);
    const authTag = blob.subarray(12, 28);
    const ciphertext = blob.subarray(28);
    // authTagLength is pinned even though the fixed-width slice above already
    // guarantees 16 bytes: it states the assumption where it is enforced, and
    // it keeps Node from ever accepting a shorter (forgeable) tag if the
    // slicing is later refactored. Semgrep: gcm-no-tag-length.
    const decipher = createDecipheriv('aes-256-gcm', masterKey, iv, { authTagLength: 16 });
    decipher.setAuthTag(authTag);
    return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
}

/** Generates a fresh 32-byte data key. */
export function generateDataKey(): Buffer {
    return randomBytes(32);
}
