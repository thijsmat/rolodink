import { describe, expect, it } from 'vitest';
import { randomBytes } from 'crypto';
import { decryptText, encryptText, importDataKey, isEncryptedString, type SensitiveField } from '@rolodink/core';
import { ENVELOPE_VERSION, unwrapDataKey, wrapDataKey } from '../../src/lib/envelope';
import {
  type ConnectionRow,
  type LegacyDb,
  type PlannedChange,
  MigrationAbortedError,
  migrate,
  planChanges,
  projectRefFromDatabaseUrl,
  restore,
} from './legacy-fields';

const MASTER_KEY = randomBytes(32);

/**
 * In-memory Connection and user_keys tables. `compareAndSet` behaves like the
 * real UPDATE … WHERE field = expected; `beforeWrite` lets a test act as the
 * user between the script's read and its write.
 */
function fakeDb(rows: ConnectionRow[], keys: Record<string, Buffer> = {}) {
  const connections = new Map(rows.map((row) => [row.id, { ...row }]));
  const userKeys = new Map(
    Object.entries(keys).map(([userId, dataKey]) => [
      userId,
      { user_id: userId, encrypted_key: wrapDataKey(dataKey, MASTER_KEY), salt: ENVELOPE_VERSION },
    ])
  );
  const calls = { compareAndSet: 0, createKey: 0 };
  let beforeWrite: (id: string, field: SensitiveField) => void = () => {};

  const db: LegacyDb = {
    userKey: {
      findUnique: async ({ where }) => userKeys.get(where.user_id) ?? null,
      create: async ({ data }) => {
        calls.createKey++;
        if (userKeys.has(data.user_id)) throw Object.assign(new Error('Unique constraint'), { code: 'P2002' });
        userKeys.set(data.user_id, data);
        return data;
      },
    },
    listUserKeys: async () => [...userKeys.values()],
    listConnections: async (ownerId) =>
      [...connections.values()].filter((row) => !ownerId || row.ownerId === ownerId).map((row) => ({ ...row })),
    compareAndSet: async (id, field, expected, next) => {
      calls.compareAndSet++;
      beforeWrite(id, field);
      const row = connections.get(id);
      if (!row || row[field] !== expected) return 0;
      row[field] = next;
      return 1;
    },
  };

  return {
    db,
    calls,
    connections,
    userKeys,
    onBeforeWrite(fn: typeof beforeWrite) {
      beforeWrite = fn;
    },
    async keyOf(userId: string) {
      const stored = userKeys.get(userId);
      if (!stored) throw new Error(`no key for ${userId}`);
      return importDataKey(unwrapDataKey(stored.encrypted_key, MASTER_KEY).toString('base64'));
    },
  };
}

const noPreImages = () => {};

describe('projectRefFromDatabaseUrl', () => {
  it('reads the ref from a direct and from a pooler connection string', () => {
    expect(projectRefFromDatabaseUrl('postgresql://postgres:pw@db.abcdefgh.supabase.co:5432/postgres')).toBe('abcdefgh');
    expect(
      projectRefFromDatabaseUrl('postgres://postgres.abcdefgh:pw@aws-0-eu-central-1.pooler.supabase.com:6543/postgres')
    ).toBe('abcdefgh');
  });

  it('returns null for anything else', () => {
    expect(projectRefFromDatabaseUrl(undefined)).toBeNull();
    expect(projectRefFromDatabaseUrl('not a url')).toBeNull();
    expect(projectRefFromDatabaseUrl('postgres://user:pw@localhost:5432/db')).toBeNull();
  });
});

describe('planChanges', () => {
  it('plans only the plaintext fields of a row that is partly encrypted already', () => {
    const plan = planChanges([
      {
        id: 'c1',
        ownerId: 'u1',
        notes: 'rolodink-enc:AAAA',
        meetingPlace: 'Web Summit',
        userCompanyAtTheTime: '',
        email: null,
        phone: undefined,
      },
    ]);
    expect(plan).toEqual([{ connectionId: 'c1', ownerId: 'u1', field: 'meetingPlace', plaintext: 'Web Summit' }]);
  });
});

describe('migrate', () => {
  const existingOwnerKey = randomBytes(32);

  async function encryptedFor(dataKey: Buffer, text: string) {
    return encryptText(text, await importDataKey(dataKey.toString('base64')));
  }

  it('writes nothing when the master key is not the one that wrapped the stored keys', async () => {
    const fake = fakeDb([{ id: 'c1', ownerId: 'u2', notes: 'plain' }], { u1: existingOwnerKey });

    await expect(
      migrate(fake.db, { masterKey: randomBytes(32), savePreImages: noPreImages })
    ).rejects.toThrow('not the production master key');
    expect(fake.calls.compareAndSet).toBe(0);
    expect(fake.calls.createKey).toBe(0);
  });

  it('writes nothing when there is no stored key to check the master key against', async () => {
    const fake = fakeDb([{ id: 'c1', ownerId: 'u2', notes: 'plain' }]);

    await expect(migrate(fake.db, { masterKey: MASTER_KEY, savePreImages: noPreImages })).rejects.toBeInstanceOf(
      MigrationAbortedError
    );
    expect(fake.calls.compareAndSet).toBe(0);
  });

  it('writes nothing when an encrypted value is corrupt', async () => {
    const good = await encryptedFor(existingOwnerKey, 'fine');
    const fake = fakeDb(
      [
        { id: 'c1', ownerId: 'u1', notes: good + 'appended plaintext', meetingPlace: 'plain' },
        { id: 'c2', ownerId: 'u1', notes: 'plain' },
      ],
      { u1: existingOwnerKey }
    );

    await expect(migrate(fake.db, { masterKey: MASTER_KEY, savePreImages: noPreImages })).rejects.toThrow(
      'c1 notes: does not decrypt'
    );
    expect(fake.calls.compareAndSet).toBe(0);
  });

  it('writes nothing when saving the pre-images fails', async () => {
    const fake = fakeDb([{ id: 'c1', ownerId: 'u1', notes: 'plain' }], { u1: existingOwnerKey });

    await expect(
      migrate(fake.db, {
        masterKey: MASTER_KEY,
        savePreImages: () => {
          throw new Error('disk full');
        },
      })
    ).rejects.toThrow('disk full');
    expect(fake.calls.compareAndSet).toBe(0);
  });

  it('counts but writes nothing on a dry run', async () => {
    const fake = fakeDb([{ id: 'c1', ownerId: 'u2', notes: 'plain' }], { u1: existingOwnerKey });

    const report = await migrate(fake.db, { masterKey: MASTER_KEY, dryRun: true, savePreImages: noPreImages });

    expect(report.plan).toHaveLength(1);
    expect(report.ownersWithoutKey).toEqual(['u2']);
    expect(fake.calls.compareAndSet).toBe(0);
    expect(fake.calls.createKey).toBe(0);
  });

  it('encrypts every plaintext value once, leaves encrypted ones alone, and they decrypt to the original', async () => {
    const alreadyEncrypted = await encryptedFor(existingOwnerKey, 'old note');
    const texts = {
      emoji: 'Koffie ☕ bij Hutspot 👋',
      rtl: 'מנכ״ל, נפגשנו בכנס',
      long: 'x'.repeat(10_000),
    };
    const fake = fakeDb(
      [
        { id: 'c1', ownerId: 'u1', notes: alreadyEncrypted, meetingPlace: texts.emoji },
        { id: 'c2', ownerId: 'u2', notes: texts.rtl, userCompanyAtTheTime: texts.long, phone: '' },
      ],
      { u1: existingOwnerKey }
    );
    const saved: PlannedChange[][] = [];

    const report = await migrate(fake.db, { masterKey: MASTER_KEY, savePreImages: (plan) => void saved.push(plan) });

    expect(report.results.map((r) => r.status)).toEqual(['encrypted', 'encrypted', 'encrypted']);
    expect(report.verify).toEqual({ readable: 3, changedSince: 0, unreadable: [] });
    expect(saved[0]).toHaveLength(3);
    expect(fake.connections.get('c1')!.notes).toBe(alreadyEncrypted);
    expect(fake.connections.get('c2')!.phone).toBe('');
    // u2 had no key and got exactly one.
    expect(fake.calls.createKey).toBe(1);
    const u1 = await fake.keyOf('u1');
    const u2 = await fake.keyOf('u2');
    expect(await decryptText(fake.connections.get('c1')!.meetingPlace!, u1)).toBe(texts.emoji);
    expect(await decryptText(fake.connections.get('c2')!.notes!, u2)).toBe(texts.rtl);
    expect(await decryptText(fake.connections.get('c2')!.userCompanyAtTheTime!, u2)).toBe(texts.long);
  });

  it('changes nothing on a second run', async () => {
    const fake = fakeDb([{ id: 'c1', ownerId: 'u1', notes: 'plain' }], { u1: existingOwnerKey });
    await migrate(fake.db, { masterKey: MASTER_KEY, savePreImages: noPreImages });
    const writes = fake.calls.compareAndSet;

    const second = await migrate(fake.db, { masterKey: MASTER_KEY, savePreImages: noPreImages });

    expect(second.plan).toEqual([]);
    expect(fake.calls.compareAndSet).toBe(writes);
  });

  it('touches only the given owner on a canary run', async () => {
    const fake = fakeDb(
      [
        { id: 'c1', ownerId: 'u1', notes: 'mine' },
        { id: 'c2', ownerId: 'u2', notes: 'theirs' },
      ],
      { u1: existingOwnerKey }
    );

    await migrate(fake.db, { masterKey: MASTER_KEY, onlyOwner: 'u1', savePreImages: noPreImages });

    expect(isEncryptedString(fake.connections.get('c1')!.notes)).toBe(true);
    expect(fake.connections.get('c2')!.notes).toBe('theirs');
    expect(fake.userKeys.has('u2')).toBe(false);
  });

  it('keeps the user’s edit when they change the field between the read and the write', async () => {
    const fake = fakeDb([{ id: 'c1', ownerId: 'u1', notes: 'old' }], { u1: existingOwnerKey });
    const userEdit = await encryptedFor(existingOwnerKey, 'edited by the user');
    fake.onBeforeWrite((id, field) => {
      fake.connections.get(id)![field] = userEdit;
    });

    const report = await migrate(fake.db, { masterKey: MASTER_KEY, savePreImages: noPreImages });

    expect(report.results[0].status).toBe('skipped-concurrent-edit');
    expect(fake.connections.get('c1')!.notes).toBe(userEdit);
  });

  it('leaves a later edit by the user alone when it runs again', async () => {
    const fake = fakeDb([{ id: 'c1', ownerId: 'u1', notes: 'old' }], { u1: existingOwnerKey });
    await migrate(fake.db, { masterKey: MASTER_KEY, savePreImages: noPreImages });
    const userEdit = await encryptedFor(existingOwnerKey, 'edited afterwards');
    fake.connections.get('c1')!.notes = userEdit;

    const again = await migrate(fake.db, { masterKey: MASTER_KEY, savePreImages: noPreImages });

    expect(again.plan).toEqual([]);
    expect(fake.connections.get('c1')!.notes).toBe(userEdit);
  });
});

describe('restore', () => {
  it('puts the original plaintext back, except where the user changed the value since', async () => {
    const ownerKey = randomBytes(32);
    const fake = fakeDb(
      [
        { id: 'c1', ownerId: 'u1', notes: 'first' },
        { id: 'c2', ownerId: 'u1', notes: 'second' },
      ],
      { u1: ownerKey }
    );
    let preImages: PlannedChange[] = [];
    await migrate(fake.db, { masterKey: MASTER_KEY, savePreImages: (plan) => void (preImages = plan) });
    const userEdit = await encryptText('changed after the migration', await fake.keyOf('u1'));
    fake.connections.get('c2')!.notes = userEdit;

    const results = await restore(fake.db, preImages, MASTER_KEY);

    expect(results.map((r) => r.status)).toEqual(['restored', 'skipped-changed-since']);
    expect(fake.connections.get('c1')!.notes).toBe('first');
    expect(fake.connections.get('c2')!.notes).toBe(userEdit);
  });

  it('migrates, restores and migrates again to the same plaintext', async () => {
    const fake = fakeDb([{ id: 'c1', ownerId: 'u1', meetingPlace: 'Utrecht' }], { u1: randomBytes(32) });
    let preImages: PlannedChange[] = [];

    await migrate(fake.db, { masterKey: MASTER_KEY, savePreImages: (plan) => void (preImages = plan) });
    await restore(fake.db, preImages, MASTER_KEY);
    expect(fake.connections.get('c1')!.meetingPlace).toBe('Utrecht');
    await migrate(fake.db, { masterKey: MASTER_KEY, savePreImages: noPreImages });

    expect(await decryptText(fake.connections.get('c1')!.meetingPlace!, await fake.keyOf('u1'))).toBe('Utrecht');
  });

  it('writes nothing with the wrong master key', async () => {
    const fake = fakeDb([{ id: 'c1', ownerId: 'u1', notes: 'rolodink-enc:AAAA' }], { u1: randomBytes(32) });
    const entries: PlannedChange[] = [{ connectionId: 'c1', ownerId: 'u1', field: 'notes', plaintext: 'x' }];

    await expect(restore(fake.db, entries, randomBytes(32))).rejects.toThrow('not the production master key');
    expect(fake.calls.compareAndSet).toBe(0);
  });
});
