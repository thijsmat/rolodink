import { describe, it, expect } from 'vitest';
import { randomBytes } from 'crypto';
import {
    wrapDataKey,
    unwrapDataKey,
    generateDataKey,
    getOrCreateUserKey,
    getMasterKeys,
    masterKeyFingerprint,
    readNextMasterKey,
    ENVELOPE_VERSION,
    InvalidKeyFormatError,
    KeyUnwrapError,
    type UserKeyStore,
} from './envelope';

/**
 * These tests guard the code that unwraps every user's data key. The one that
 * matters most is the fixed vector: it was generated with the implementation
 * as it existed BEFORE `authTagLength: 16` was pinned on `createDecipheriv`,
 * so it proves that every wrapped key already sitting in `user_keys` stays
 * readable. If a change to this file ever fails that test, the change orphans
 * production data - do not "update the vector", fix the change.
 */

// Deterministic inputs: masterKey = 0x07 x32, dataKey = bytes 00..1f, iv = 0x03 x12.
const VECTOR_MASTER_KEY = Buffer.from('BwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwc=', 'base64');
const VECTOR_DATA_KEY = Buffer.from('AAECAwQFBgcICQoLDA0ODxAREhMUFRYXGBkaGxwdHh8=', 'base64');
const VECTOR_WRAPPED =
    'AwMDAwMDAwMDAwMDu/+f6f4nwzrGhOlV2n5HwCX/oQBeLVhFcklJV+da8QP9LfL8oICCZzfHnar/+F6n';

describe('unwrapDataKey', () => {
    it('still reads a blob written by the pre-authTagLength implementation', () => {
        expect(unwrapDataKey(VECTOR_WRAPPED, VECTOR_MASTER_KEY).equals(VECTOR_DATA_KEY)).toBe(true);
    });

    it('round-trips what wrapDataKey produces today', () => {
        const masterKey = randomBytes(32);
        const dataKey = generateDataKey();
        expect(unwrapDataKey(wrapDataKey(dataKey, masterKey), masterKey).equals(dataKey)).toBe(true);
    });

    it('rejects a blob shorter than iv + tag', () => {
        // 27 bytes is one short of the 12-byte IV plus 16-byte tag minimum.
        const short = randomBytes(27).toString('base64');
        expect(() => unwrapDataKey(short, randomBytes(32))).toThrow('Invalid wrapped key length');
    });

    it('rejects a tampered auth tag', () => {
        const masterKey = randomBytes(32);
        const blob = Buffer.from(wrapDataKey(generateDataKey(), masterKey), 'base64');
        const tampered = Buffer.concat([blob.subarray(0, 12), randomBytes(16), blob.subarray(28)]);
        expect(() => unwrapDataKey(tampered.toString('base64'), masterKey)).toThrow();
    });

    it('rejects the wrong master key', () => {
        const wrapped = wrapDataKey(generateDataKey(), randomBytes(32));
        expect(() => unwrapDataKey(wrapped, randomBytes(32))).toThrow();
    });

    it('rejects tampered ciphertext', () => {
        const masterKey = randomBytes(32);
        const blob = Buffer.from(wrapDataKey(generateDataKey(), masterKey), 'base64');
        blob[blob.length - 1] ^= 0xff; // flip bits in the last ciphertext byte
        expect(() => unwrapDataKey(blob.toString('base64'), masterKey)).toThrow();
    });
});

/**
 * An in-memory `user_keys` with its primary key: a second create for the same
 * user fails, like Postgres would with P2002. `beforeCreate` lets a test pause
 * one caller between its read and its create.
 */
function fakeStore(beforeCreate: () => Promise<void> = async () => {}) {
    const rows = new Map<string, { encrypted_key: string; salt: string }>();
    let creates = 0;
    const store: UserKeyStore = {
        userKey: {
            findUnique: async ({ where }) => rows.get(where.user_id) ?? null,
            create: async ({ data }) => {
                await beforeCreate();
                creates++;
                if (rows.has(data.user_id)) {
                    throw Object.assign(new Error('Unique constraint failed'), { code: 'P2002' });
                }
                const row = { encrypted_key: data.encrypted_key, salt: data.salt };
                rows.set(data.user_id, row);
                return row;
            },
        },
    };
    return { store, rows, creates: () => creates };
}

describe('getOrCreateUserKey', () => {
    const masterKey = randomBytes(32);

    it('creates one wrapped key on first use and returns the same key after that', async () => {
        const { store, rows } = fakeStore();

        const first = await getOrCreateUserKey(store, 'user-1', masterKey);
        const second = await getOrCreateUserKey(store, 'user-1', masterKey);

        expect(second.equals(first)).toBe(true);
        expect(rows.get('user-1')?.salt).toBe(ENVELOPE_VERSION);
        expect(unwrapDataKey(rows.get('user-1')!.encrypted_key, masterKey).equals(first)).toBe(true);
    });

    it('gives both callers the same key when the second creates first', async () => {
        // Caller A reads "no key", then waits; caller B creates; A's create
        // then hits the primary key and reads B's key back.
        let release!: () => void;
        const gate = new Promise<void>((resolve) => { release = resolve; });
        let paused = false;
        const { store, creates } = fakeStore(async () => {
            if (!paused) { paused = true; await gate; }
        });

        const a = getOrCreateUserKey(store, 'user-1', masterKey);
        await new Promise((resolve) => setTimeout(resolve, 0));
        const b = await getOrCreateUserKey(store, 'user-1', masterKey);
        release();

        expect((await a).equals(b)).toBe(true);
        expect(creates()).toBe(2);
    });

    it('gives both callers the same key when the first finishes before the second reads', async () => {
        const { store, creates } = fakeStore();

        const a = await getOrCreateUserKey(store, 'user-1', masterKey);
        const b = await getOrCreateUserKey(store, 'user-1', masterKey);

        expect(b.equals(a)).toBe(true);
        expect(creates()).toBe(1);
    });

    it('rethrows a failed create when there is still no key afterwards', async () => {
        const store: UserKeyStore = {
            userKey: {
                findUnique: async () => null,
                create: async () => { throw new Error('connection lost'); },
            },
        };
        await expect(getOrCreateUserKey(store, 'user-1', masterKey)).rejects.toThrow('connection lost');
    });

    it('refuses a key in another format', async () => {
        const { store, rows } = fakeStore();
        rows.set('user-1', { encrypted_key: wrapDataKey(generateDataKey(), masterKey), salt: 'old-salt' });
        await expect(getOrCreateUserKey(store, 'user-1', masterKey)).rejects.toBeInstanceOf(InvalidKeyFormatError);
    });

    it('reports a key wrapped with another master key as an unwrap error', async () => {
        const { store, rows } = fakeStore();
        rows.set('user-1', { encrypted_key: wrapDataKey(generateDataKey(), randomBytes(32)), salt: ENVELOPE_VERSION });
        await expect(getOrCreateUserKey(store, 'user-1', masterKey)).rejects.toBeInstanceOf(KeyUnwrapError);
    });
});

describe('masterKeyFingerprint', () => {
    it('stays the same scheme, so a fingerprint set in Vercel keeps matching', () => {
        // If this changes, every ENCRYPTION_MASTER_KEY_NEXT_FINGERPRINT already
        // set stops matching and a rotation in progress stalls.
        expect(masterKeyFingerprint(VECTOR_MASTER_KEY)).toBe('28d33da0a651ec28');
    });

    it('differs for a key that differs in one bit', () => {
        const other = Buffer.from(VECTOR_MASTER_KEY);
        other[31] ^= 0x01;
        expect(masterKeyFingerprint(other)).not.toBe(masterKeyFingerprint(VECTOR_MASTER_KEY));
    });
});

describe('readNextMasterKey', () => {
    const next = randomBytes(32);
    const nextB64 = next.toString('base64');

    it('is unset without ENCRYPTION_MASTER_KEY_NEXT', () => {
        expect(readNextMasterKey({})).toEqual({ state: 'unset' });
    });

    it('ignores a value that is not a 32-byte key', () => {
        expect(readNextMasterKey({ ENCRYPTION_MASTER_KEY_NEXT: randomBytes(31).toString('base64') })).toEqual({
            state: 'invalid',
        });
    });

    it('is unconfirmed without a fingerprint or with a wrong one', () => {
        expect(readNextMasterKey({ ENCRYPTION_MASTER_KEY_NEXT: nextB64 })).toMatchObject({
            state: 'unconfirmed',
            reason: 'fingerprint-missing',
        });
        expect(
            readNextMasterKey({
                ENCRYPTION_MASTER_KEY_NEXT: nextB64,
                ENCRYPTION_MASTER_KEY_NEXT_FINGERPRINT: masterKeyFingerprint(randomBytes(32)),
            })
        ).toMatchObject({ state: 'unconfirmed', reason: 'fingerprint-mismatch' });
    });

    it('is confirmed with the right fingerprint, whatever its case or surrounding spaces', () => {
        const result = readNextMasterKey({
            ENCRYPTION_MASTER_KEY_NEXT: nextB64,
            ENCRYPTION_MASTER_KEY_NEXT_FINGERPRINT: ` ${masterKeyFingerprint(next).toUpperCase()} `,
        });
        expect(result.state).toBe('confirmed');
        expect('key' in result && result.key.equals(next)).toBe(true);
    });
});

describe('getOrCreateUserKey during a rotation', () => {
    const current = randomBytes(32);
    const next = randomBytes(32);
    const base = { ENCRYPTION_MASTER_KEY: current.toString('base64'), ENCRYPTION_MASTER_KEY_NEXT: next.toString('base64') };
    const confirmed = getMasterKeys({ ...base, ENCRYPTION_MASTER_KEY_NEXT_FINGERPRINT: masterKeyFingerprint(next) });
    const unconfirmed = getMasterKeys(base);

    it('reads a key wrapped with the current master key and one wrapped with the next', async () => {
        const { store, rows } = fakeStore();
        const oldUser = generateDataKey();
        const movedUser = generateDataKey();
        rows.set('old', { encrypted_key: wrapDataKey(oldUser, current), salt: ENVELOPE_VERSION });
        rows.set('moved', { encrypted_key: wrapDataKey(movedUser, next), salt: ENVELOPE_VERSION });

        for (const keys of [confirmed, unconfirmed]) {
            expect((await getOrCreateUserKey(store, 'old', keys)).equals(oldUser)).toBe(true);
            expect((await getOrCreateUserKey(store, 'moved', keys)).equals(movedUser)).toBe(true);
        }
    });

    it('wraps a new key with the next master key only once its fingerprint is confirmed', async () => {
        const { store, rows } = fakeStore();

        const a = await getOrCreateUserKey(store, 'a', confirmed);
        const b = await getOrCreateUserKey(store, 'b', unconfirmed);

        expect(unwrapDataKey(rows.get('a')!.encrypted_key, next).equals(a)).toBe(true);
        expect(unwrapDataKey(rows.get('b')!.encrypted_key, current).equals(b)).toBe(true);
        expect(() => unwrapDataKey(rows.get('b')!.encrypted_key, next)).toThrow();
    });

    it('reports a key that opens with neither master key as an unwrap error', async () => {
        const { store, rows } = fakeStore();
        rows.set('user-1', { encrypted_key: wrapDataKey(generateDataKey(), randomBytes(32)), salt: ENVELOPE_VERSION });
        await expect(getOrCreateUserKey(store, 'user-1', confirmed)).rejects.toBeInstanceOf(KeyUnwrapError);
    });

    it('ignores an invalid next key and keeps working with the current one', async () => {
        const keys = getMasterKeys({ ...base, ENCRYPTION_MASTER_KEY_NEXT: 'not-a-key' });
        expect(keys.wrap.equals(current)).toBe(true);
        expect(keys.unwrap).toHaveLength(1);
    });
});
