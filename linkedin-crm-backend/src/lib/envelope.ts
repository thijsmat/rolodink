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
 *
 * Rotating the master key (the old one cannot be read back from Vercel, so it
 * cannot be kept as a "previous" key): the new key is set as
 * `ENCRYPTION_MASTER_KEY_NEXT`, together with its fingerprint in
 * `ENCRYPTION_MASTER_KEY_NEXT_FINGERPRINT`, computed from the operator's own
 * stored copy (`npm run master-key -- fingerprint`). Stored keys always unwrap
 * with either key. Only once the fingerprint matches does the new key wrap new
 * user keys and does the daily cron re-wrap the existing ones
 * (src/lib/key-rotation.ts): a copy with a typo is caught before anything
 * depends on it. The runbook is in .claude/skills/rolodink-release/SKILL.md.
 */

import { randomBytes, createCipheriv, createDecipheriv, createHash } from 'crypto';

export const ENVELOPE_VERSION = 'envelope-v1';

type Env = Partial<Record<string, string>>;

/** A base64-encoded 32-byte key, or null when it is anything else. */
function parseMasterKey(value: string): Buffer | null {
    const key = Buffer.from(value, 'base64');
    return key.length === 32 ? key : null;
}

/** Reads and validates the master key. Throws when it is missing or the wrong size. */
export function getMasterKey(env: Env = process.env): Buffer {
    const masterKeyB64 = env.ENCRYPTION_MASTER_KEY;
    if (!masterKeyB64) {
        throw new Error('ENCRYPTION_MASTER_KEY not configured');
    }
    const masterKey = parseMasterKey(masterKeyB64);
    if (!masterKey) {
        throw new Error('ENCRYPTION_MASTER_KEY must be a base64-encoded 32-byte key');
    }
    return masterKey;
}

/**
 * A short, non-secret check value for a master key, so the operator can prove
 * that the copy they stored is the key Vercel holds. A truncated SHA-256 of a
 * random 256-bit key reveals nothing usable about the key.
 */
export function masterKeyFingerprint(key: Buffer): string {
    return createHash('sha256')
        .update('rolodink-master-key-fingerprint-v1:')
        .update(key)
        .digest('hex')
        .slice(0, 16);
}

/**
 * The state of `ENCRYPTION_MASTER_KEY_NEXT`:
 *  - unset: no rotation going on.
 *  - invalid: not a base64 32-byte key. Ignored entirely; nothing can have been wrapped with it.
 *  - unconfirmed: a valid key whose fingerprint is missing or does not match.
 *    Only used to unwrap, never to wrap.
 *  - confirmed: wraps new user keys, and the cron re-wraps the existing ones with it.
 */
export type NextMasterKey =
    | { state: 'unset' }
    | { state: 'invalid' }
    | { state: 'unconfirmed'; key: Buffer; reason: 'fingerprint-missing' | 'fingerprint-mismatch' }
    | { state: 'confirmed'; key: Buffer };

export function readNextMasterKey(env: Env = process.env): NextMasterKey {
    const value = env.ENCRYPTION_MASTER_KEY_NEXT;
    if (!value) return { state: 'unset' };
    const key = parseMasterKey(value);
    if (!key) return { state: 'invalid' };
    const fingerprint = env.ENCRYPTION_MASTER_KEY_NEXT_FINGERPRINT?.trim().toLowerCase();
    if (!fingerprint) return { state: 'unconfirmed', key, reason: 'fingerprint-missing' };
    if (fingerprint !== masterKeyFingerprint(key)) return { state: 'unconfirmed', key, reason: 'fingerprint-mismatch' };
    return { state: 'confirmed', key };
}

/** Which key wraps a new user key, and which keys may unwrap a stored one, in order. */
export interface MasterKeys {
    wrap: Buffer;
    unwrap: Buffer[];
}

/** The master keys from the environment. Throws when ENCRYPTION_MASTER_KEY itself is missing or invalid. */
export function getMasterKeys(env: Env = process.env): MasterKeys {
    const current = getMasterKey(env);
    const next = readNextMasterKey(env);
    return {
        wrap: next.state === 'confirmed' ? next.key : current,
        unwrap: 'key' in next ? [current, next.key] : [current],
    };
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
 * `masterKeys` defaults to the environment (see `getMasterKeys`); a single
 * key, as the maintenance scripts pass, both wraps and unwraps.
 *
 * Throws `InvalidKeyFormatError` for a key in another format and
 * `KeyUnwrapError` when the stored key unwraps with none of the master keys.
 */
export async function getOrCreateUserKey(
    db: UserKeyStore,
    userId: string,
    masterKeys: MasterKeys | Buffer = getMasterKeys()
): Promise<Buffer> {
    const keys = Buffer.isBuffer(masterKeys) ? { wrap: masterKeys, unwrap: [masterKeys] } : masterKeys;
    let userKey = await db.userKey.findUnique({ where: { user_id: userId } });

    if (!userKey) {
        try {
            userKey = await db.userKey.create({
                data: {
                    user_id: userId,
                    encrypted_key: wrapDataKey(generateDataKey(), keys.wrap),
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

    let firstError: unknown;
    for (const masterKey of keys.unwrap) {
        try {
            return unwrapDataKey(userKey.encrypted_key, masterKey);
        } catch (error) {
            firstError ??= error;
        }
    }
    throw new KeyUnwrapError(firstError);
}
