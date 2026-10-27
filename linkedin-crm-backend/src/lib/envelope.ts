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

/** A stored key in another format than `envelope-v1`. */
export class InvalidKeyFormatError extends Error {
    constructor() {
        super('Invalid key format');
        this.name = 'InvalidKeyFormatError';
    }
}

/** A stored key that does not unwrap: almost always a different master key. */
export class KeyUnwrapError extends Error {
    constructor(cause: unknown) {
        super('Failed to unwrap data key', { cause });
        this.name = 'KeyUnwrapError';
    }
}

interface UserKeyRow {
    encrypted_key: string;
    salt: string;
}

/** The part of the Prisma client this needs, so tests and scripts can pass a fake. */
export interface UserKeyStore {
    userKey: {
        findUnique(args: { where: { user_id: string } }): Promise<UserKeyRow | null>;
        create(args: { data: { user_id: string; encrypted_key: string; salt: string } }): Promise<UserKeyRow>;
    };
}

/**
 * Returns the user's raw data key, creating and storing one on first use.
 *
 * Two callers can create at the same time (two tabs, or the legacy-field
 * migration while the user signs in). The primary key on `user_keys.user_id`
 * lets only one create win; the loser reads the winner's key back, so both end
 * up with the same key.
 *
 * Throws `InvalidKeyFormatError` for a key in another format and
 * `KeyUnwrapError` when the stored key does not unwrap with `masterKey`.
 */
export async function getOrCreateUserKey(
    db: UserKeyStore,
    userId: string,
    masterKey: Buffer = getMasterKey()
): Promise<Buffer> {
    let userKey = await db.userKey.findUnique({ where: { user_id: userId } });

    if (!userKey) {
        try {
            userKey = await db.userKey.create({
                data: {
                    user_id: userId,
                    encrypted_key: wrapDataKey(generateDataKey(), masterKey),
                    salt: ENVELOPE_VERSION,
                },
            });
        } catch (error) {
            userKey = await db.userKey.findUnique({ where: { user_id: userId } });
            if (!userKey) throw error;
        }
    }

    if (!userKey.encrypted_key || userKey.salt !== ENVELOPE_VERSION) {
        throw new InvalidKeyFormatError();
    }

    try {
        return unwrapDataKey(userKey.encrypted_key, masterKey);
    } catch (error) {
        throw new KeyUnwrapError(error);
    }
}
