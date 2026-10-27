import { afterEach, describe, expect, it, vi } from 'vitest';
import { randomBytes } from 'crypto';
import {
    ENVELOPE_VERSION,
    generateDataKey,
    getMasterKeys,
    getOrCreateUserKey,
    masterKeyFingerprint,
    unwrapDataKey,
    wrapDataKey,
    type UserKeyStore,
} from './envelope';
import { rewrapUserKeys, runKeyRotation, type RotationStore, type StoredUserKey } from './key-rotation';
import { checkMasterKey } from '../../scripts/lib/legacy-fields';

/**
 * These tests guard the step that rewrites every row of user_keys. A row
 * written wrongly here is a user whose notes can never be read again, so the
 * tests check the outcome against real unwraps, not against call counts.
 */

/**
 * An in-memory user_keys that serves both the key route (findUnique/create)
 * and the rotation (list/compare-and-set). `beforeWrite` lets a test change a
 * row between the rotation's read and its write.
 */
function fakeUserKeys() {
    const rows = new Map<string, StoredUserKey>();
    let writes = 0;
    let beforeWrite: (userId: string) => void = () => {};

    const store: UserKeyStore & RotationStore = {
        userKey: {
            findUnique: async ({ where }) => rows.get(where.user_id) ?? null,
            create: async ({ data }) => {
                if (rows.has(data.user_id)) throw Object.assign(new Error('Unique constraint'), { code: 'P2002' });
                rows.set(data.user_id, { ...data });
                return data;
            },
        },
        listUserKeys: async () => [...rows.values()].map((row) => ({ ...row })),
        compareAndSetKey: async (userId, expected, next) => {
            beforeWrite(userId);
            const row = rows.get(userId);
            if (!row || row.encrypted_key !== expected) return 0;
            writes++;
            row.encrypted_key = next;
            return 1;
        },
    };

    return {
        store,
        rows,
        writes: () => writes,
        onBeforeWrite(fn: typeof beforeWrite) {
            beforeWrite = fn;
        },
        add(userId: string, dataKey: Buffer, masterKey: Buffer, salt = ENVELOPE_VERSION) {
            rows.set(userId, { user_id: userId, encrypted_key: wrapDataKey(dataKey, masterKey), salt });
        },
    };
}

/** `fingerprintOf` defaults to `next` itself; null leaves the fingerprint unset. */
function env(current: Buffer, next?: Buffer, fingerprintOf: Buffer | null = next ?? null) {
    return {
        ENCRYPTION_MASTER_KEY: current.toString('base64'),
        ...(next && { ENCRYPTION_MASTER_KEY_NEXT: next.toString('base64') }),
        ...(fingerprintOf && { ENCRYPTION_MASTER_KEY_NEXT_FINGERPRINT: masterKeyFingerprint(fingerprintOf) }),
    };
}

afterEach(() => {
    vi.restoreAllMocks();
});

const quiet = () => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
};

describe('rewrapUserKeys', () => {
    const current = randomBytes(32);
    const next = randomBytes(32);

    it('moves every key to the next master key without changing the data key', async () => {
        const fake = fakeUserKeys();
        const dataKeys = [generateDataKey(), generateDataKey()];
        fake.add('u1', dataKeys[0], current);
        fake.add('u2', dataKeys[1], current);

        const report = await rewrapUserKeys(fake.store, current, next);

        expect(report).toEqual({ total: 2, rewrapped: 2, alreadyNext: 0, changedMeanwhile: 0, failed: [] });
        expect(unwrapDataKey(fake.rows.get('u1')!.encrypted_key, next).equals(dataKeys[0])).toBe(true);
        expect(unwrapDataKey(fake.rows.get('u2')!.encrypted_key, next).equals(dataKeys[1])).toBe(true);
    });

    it('changes nothing on a second run', async () => {
        const fake = fakeUserKeys();
        fake.add('u1', generateDataKey(), current);
        fake.add('u2', generateDataKey(), next);

        await rewrapUserKeys(fake.store, current, next);
        const before = new Map([...fake.rows].map(([id, row]) => [id, row.encrypted_key]));
        const second = await rewrapUserKeys(fake.store, current, next);

        expect(second).toEqual({ total: 2, rewrapped: 0, alreadyNext: 2, changedMeanwhile: 0, failed: [] });
        for (const [id, row] of fake.rows) expect(row.encrypted_key).toBe(before.get(id));
        expect(fake.writes()).toBe(1);
    });

    it('leaves a key that opens with neither master key untouched', async () => {
        const fake = fakeUserKeys();
        fake.add('stranger', generateDataKey(), randomBytes(32));
        const original = fake.rows.get('stranger')!.encrypted_key;

        const report = await rewrapUserKeys(fake.store, current, next);

        expect(report.failed).toEqual([{ userId: 'stranger', reason: 'opens-with-neither-key' }]);
        expect(fake.rows.get('stranger')!.encrypted_key).toBe(original);
        expect(fake.writes()).toBe(0);
    });

    it('leaves a key in another format untouched', async () => {
        const fake = fakeUserKeys();
        fake.add('legacy', generateDataKey(), current, 'some-passphrase-salt');

        const report = await rewrapUserKeys(fake.store, current, next);

        expect(report.failed).toEqual([{ userId: 'legacy', reason: 'unexpected-format' }]);
        expect(fake.writes()).toBe(0);
    });

    it('does not overwrite a row that changed between its read and its write', async () => {
        const fake = fakeUserKeys();
        const original = generateDataKey();
        const replaced = generateDataKey();
        fake.add('u1', original, current);
        fake.onBeforeWrite((userId) => fake.add(userId, replaced, current));

        const report = await rewrapUserKeys(fake.store, current, next);

        expect(report.changedMeanwhile).toBe(1);
        expect(unwrapDataKey(fake.rows.get('u1')!.encrypted_key, current).equals(replaced)).toBe(true);
    });
});

describe('runKeyRotation', () => {
    const current = randomBytes(32);
    const next = randomBytes(32);

    it('does nothing without a next key', async () => {
        const fake = fakeUserKeys();
        fake.add('u1', generateDataKey(), current);

        expect(await runKeyRotation(fake.store, env(current))).toEqual({ state: 'unset' });
        expect(fake.writes()).toBe(0);
    });

    it('does nothing when the fingerprint is missing or belongs to another key', async () => {
        quiet();
        const fake = fakeUserKeys();
        fake.add('u1', generateDataKey(), current);
        const typo = Buffer.from(next);
        typo[0] ^= 0x01;

        expect(await runKeyRotation(fake.store, env(current, next, null))).toEqual({ state: 'fingerprint-missing' });
        expect(await runKeyRotation(fake.store, env(current, next, typo))).toEqual({ state: 'fingerprint-mismatch' });
        expect(fake.writes()).toBe(0);
    });

    it('never logs or returns the expected fingerprint', async () => {
        const log = vi.spyOn(console, 'log').mockImplementation(() => {});
        const error = vi.spyOn(console, 'error').mockImplementation(() => {});
        const fake = fakeUserKeys();
        fake.add('u1', generateDataKey(), current);

        const results = [
            await runKeyRotation(fake.store, env(current, next, randomBytes(32))),
            await runKeyRotation(fake.store, env(current, next)),
        ];

        const output = JSON.stringify([results, log.mock.calls, error.mock.calls]);
        expect(output).not.toContain(masterKeyFingerprint(next));
        expect(output).not.toContain(next.toString('base64'));
        expect(output).not.toContain(current.toString('base64'));
    });

    it('reports done once every key opens with the next key, and counts failures without naming users', async () => {
        quiet();
        const fake = fakeUserKeys();
        fake.add('u1', generateDataKey(), current);
        fake.add('stranger', generateDataKey(), randomBytes(32));

        const result = await runKeyRotation(fake.store, env(current, next));

        expect(result).toEqual({
            state: 'confirmed',
            done: false,
            total: 2,
            rewrapped: 1,
            alreadyNext: 0,
            changedMeanwhile: 0,
            failed: 1,
        });
        expect(JSON.stringify(result)).not.toContain('stranger');
    });
});

describe('a whole rotation, in the order of the runbook', () => {
    it('keeps every data key readable at every step and ends with the next key alone', async () => {
        quiet();
        const oldKey = randomBytes(32);
        const newKey = randomBytes(32);
        const fake = fakeUserKeys();
        const issued = new Map<string, Buffer>();
        const readAll = async (environment: Record<string, string>) => {
            for (const [userId, dataKey] of issued) {
                const read = await getOrCreateUserKey(fake.store, userId, getMasterKeys(environment));
                expect(read.equals(dataKey), `${userId} under ${Object.keys(environment).join(',')}`).toBe(true);
            }
        };

        // Before: users with keys under the old master key.
        const before = env(oldKey);
        issued.set('early', await getOrCreateUserKey(fake.store, 'early', getMasterKeys(before)));
        issued.set('early-2', await getOrCreateUserKey(fake.store, 'early-2', getMasterKeys(before)));

        // Step 1: NEXT set, fingerprint not yet. Nothing is wrapped with it.
        const unconfirmed = env(oldKey, newKey, null);
        issued.set('during-unconfirmed', await getOrCreateUserKey(fake.store, 'during-unconfirmed', getMasterKeys(unconfirmed)));
        await runKeyRotation(fake.store, unconfirmed);
        const stored = await fake.store.listUserKeys();
        expect(() => checkMasterKey(stored, newKey)).toThrow('not the production master key');
        await readAll(unconfirmed);

        // Step 2: fingerprint confirmed. A user who signs up now gets a key under NEXT,
        // before the cron runs; the others are still under the old key.
        const confirmed = env(oldKey, newKey);
        issued.set('during-confirmed', await getOrCreateUserKey(fake.store, 'during-confirmed', getMasterKeys(confirmed)));
        await readAll(confirmed);

        // Step 3: the cron.
        const result = await runKeyRotation(fake.store, confirmed);
        expect(result).toMatchObject({ state: 'confirmed', done: true, total: 4, rewrapped: 3, alreadyNext: 1 });
        await readAll(confirmed);

        // Step 4: the local dry run with the new key alone. This is the gate before step 5.
        const unwrapped = checkMasterKey(await fake.store.listUserKeys(), newKey);
        for (const [userId, dataKey] of issued) expect(unwrapped.get(userId)?.equals(dataKey)).toBe(true);

        // Step 5: ENCRYPTION_MASTER_KEY replaced by the new key, NEXT removed.
        const after = env(newKey);
        await readAll(after);
        issued.set('after', await getOrCreateUserKey(fake.store, 'after', getMasterKeys(after)));
        expect(checkMasterKey(await fake.store.listUserKeys(), newKey).size).toBe(5);
        await readAll(after);
    });

    it('a wrong fingerprint leaves the old key as the only one in use, so removing NEXT is safe', async () => {
        quiet();
        const oldKey = randomBytes(32);
        const newKey = randomBytes(32);
        const pastedWithTypo = Buffer.from(newKey);
        pastedWithTypo[5] ^= 0x10;
        const fake = fakeUserKeys();
        const dataKey = await getOrCreateUserKey(fake.store, 'u1', getMasterKeys(env(oldKey)));

        const mismatched = env(oldKey, newKey, pastedWithTypo);
        const second = await getOrCreateUserKey(fake.store, 'u2', getMasterKeys(mismatched));
        await runKeyRotation(fake.store, mismatched);

        // Back out: remove NEXT. Everything still opens with the old key.
        const unwrapped = checkMasterKey(await fake.store.listUserKeys(), oldKey);
        expect(unwrapped.get('u1')?.equals(dataKey)).toBe(true);
        expect(unwrapped.get('u2')?.equals(second)).toBe(true);
    });
});
