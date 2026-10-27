/**
 * Encrypts the sensitive Connection fields that older clients stored as
 * plaintext, and can put them back within the restore window.
 *
 * Used once by scripts/encrypt-legacy-fields.ts. Everything that touches data
 * lives here, behind the small `LegacyDb` interface, so the tests can run the
 * whole flow against an in-memory fake.
 *
 * The rules, in the order they are enforced:
 *  1. The master key must unwrap every existing user key. A wrong but valid
 *     key (from staging, an old .env) would otherwise create new user keys
 *     that production can never unwrap, and nothing would fail until a user
 *     came back to unreadable notes.
 *  2. Every value that is already encrypted must decrypt. A corrupt value is
 *     reported and the run stops before writing anything.
 *  3. A value is only ever encrypted once: anything with the `rolodink-enc:`
 *     prefix is left alone (encryptSensitiveFields from @rolodink/core does
 *     not check this, which is why it is not used here).
 *  4. Each write is a compare-and-set on the old value. If the user changed
 *     the field in the meantime, their value wins and the change is skipped.
 *     The write is raw SQL, so Prisma's @updatedAt is not touched.
 *  5. Each new ciphertext is decrypted again before it is written; a value
 *     that does not round-trip is skipped and stays readable as plaintext.
 */

import {
  SENSITIVE_FIELDS,
  type SensitiveField,
  isEncryptedString,
  importDataKey,
  encryptText,
  decryptText,
} from '@rolodink/core';
import { ENVELOPE_VERSION, getOrCreateUserKey, unwrapDataKey, type UserKeyStore } from '../../src/lib/envelope';

export type ConnectionRow = { id: string; ownerId: string } & { [K in SensitiveField]?: string | null };

export interface StoredUserKey {
  user_id: string;
  encrypted_key: string;
  salt: string;
}

export interface LegacyDb extends UserKeyStore {
  listUserKeys(): Promise<StoredUserKey[]>;
  listConnections(ownerId?: string): Promise<ConnectionRow[]>;
  /** Sets `field` to `next` only while it still holds `expected`. Returns the number of rows changed (0 or 1). */
  compareAndSet(id: string, field: SensitiveField, expected: string, next: string): Promise<number>;
}

export interface PlannedChange {
  connectionId: string;
  ownerId: string;
  field: SensitiveField;
  plaintext: string;
}

export type ChangeStatus = 'encrypted' | 'skipped-concurrent-edit' | 'skipped-round-trip';

export interface ChangeResult {
  connectionId: string;
  field: SensitiveField;
  status: ChangeStatus;
}

export class MigrationAbortedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MigrationAbortedError';
  }
}

export function isSensitiveField(field: string): field is SensitiveField {
  return (SENSITIVE_FIELDS as readonly string[]).includes(field);
}

/**
 * The Supabase project ref in a connection string, for the operator to
 * confirm: `db.<ref>.supabase.co` (direct) or user `postgres.<ref>` (pooler).
 */
export function projectRefFromDatabaseUrl(url: string | undefined): string | null {
  if (!url) return null;
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }
  const direct = /^db\.([a-z0-9]+)\.supabase\.co$/.exec(parsed.hostname);
  if (direct) return direct[1];
  const pooler = /^postgres\.([a-z0-9]+)$/.exec(decodeURIComponent(parsed.username));
  return pooler ? pooler[1] : null;
}

/**
 * Proves the loaded master key is the one production uses: it must unwrap
 * every stored user key. With no stored keys there is nothing to prove it
 * against, so that stops the run too.
 */
export function checkMasterKey(keys: StoredUserKey[], masterKey: Buffer): Map<string, Buffer> {
  if (keys.length === 0) {
    throw new MigrationAbortedError(
      'There are no stored user keys to check the master key against. Not writing anything.'
    );
  }
  const unwrapped = new Map<string, Buffer>();
  for (const key of keys) {
    if (key.salt !== ENVELOPE_VERSION) {
      throw new MigrationAbortedError(`User key of ${key.user_id} has an unexpected format. Not writing anything.`);
    }
    try {
      unwrapped.set(key.user_id, unwrapDataKey(key.encrypted_key, masterKey));
    } catch {
      throw new MigrationAbortedError(
        'ENCRYPTION_MASTER_KEY does not unwrap the stored user keys: this is not the production master key. ' +
          'Not writing anything.'
      );
    }
  }
  return unwrapped;
}

/** Every plaintext value of a sensitive field. Pure: no I/O, no crypto. */
export function planChanges(rows: ConnectionRow[]): PlannedChange[] {
  const plan: PlannedChange[] = [];
  for (const row of rows) {
    for (const field of SENSITIVE_FIELDS) {
      const value = row[field];
      if (typeof value === 'string' && value.length > 0 && !isEncryptedString(value)) {
        plan.push({ connectionId: row.id, ownerId: row.ownerId, field, plaintext: value });
      }
    }
  }
  return plan;
}

export interface CorruptValue {
  connectionId: string;
  field: SensitiveField;
  reason: string;
}

/** Encrypted values that do not decrypt with their owner's key. */
export async function findCorruptValues(
  rows: ConnectionRow[],
  ownerKeys: Map<string, Buffer>
): Promise<CorruptValue[]> {
  const corrupt: CorruptValue[] = [];
  const cryptoKeys = new Map<string, CryptoKey>();
  for (const row of rows) {
    for (const field of SENSITIVE_FIELDS) {
      const value = row[field];
      if (!isEncryptedString(value)) continue;
      const raw = ownerKeys.get(row.ownerId);
      if (!raw) {
        corrupt.push({ connectionId: row.id, field, reason: 'encrypted, but the owner has no key' });
        continue;
      }
      let key = cryptoKeys.get(row.ownerId);
      if (!key) {
        key = await importDataKey(raw.toString('base64'));
        cryptoKeys.set(row.ownerId, key);
      }
      try {
        await decryptText(value as string, key);
      } catch {
        corrupt.push({ connectionId: row.id, field, reason: 'does not decrypt with the owner key' });
      }
    }
  }
  return corrupt;
}

export interface MigrateOptions {
  masterKey: Buffer;
  /** Limit the run to one owner (the canary). */
  onlyOwner?: string;
  /** Count and report, write nothing. */
  dryRun?: boolean;
  /** Called with the plan before the first write; must throw if the pre-images are not safely stored. */
  savePreImages: (plan: PlannedChange[]) => Promise<void> | void;
}

export interface VerifyReport {
  readable: number;
  changedSince: number;
  unreadable: Array<{ connectionId: string; field: SensitiveField }>;
}

export interface MigrateReport {
  plan: PlannedChange[];
  ownersWithoutKey: string[];
  results: ChangeResult[];
  verify: VerifyReport | null;
}

export async function migrate(db: LegacyDb, options: MigrateOptions): Promise<MigrateReport> {
  const existingKeys = checkMasterKey(await db.listUserKeys(), options.masterKey);
  const rows = await db.listConnections(options.onlyOwner);

  const corrupt = await findCorruptValues(rows, existingKeys);
  if (corrupt.length > 0) {
    const list = corrupt.map((c) => `  ${c.connectionId} ${c.field}: ${c.reason}`).join('\n');
    throw new MigrationAbortedError(`Found ${corrupt.length} corrupt encrypted value(s). Not writing anything.\n${list}`);
  }

  const plan = planChanges(rows);
  const ownersWithoutKey = [...new Set(plan.map((c) => c.ownerId))].filter((id) => !existingKeys.has(id));
  if (options.dryRun || plan.length === 0) {
    return { plan, ownersWithoutKey, results: [], verify: null };
  }

  await options.savePreImages(plan);

  const results: ChangeResult[] = [];
  const keys = new Map<string, CryptoKey>();
  for (const change of plan) {
    let key = keys.get(change.ownerId);
    if (!key) {
      const raw = await getOrCreateUserKey(db, change.ownerId, options.masterKey);
      key = await importDataKey(raw.toString('base64'));
      keys.set(change.ownerId, key);
    }

    const ciphertext = await encryptText(change.plaintext, key);
    if ((await decryptText(ciphertext, key)) !== change.plaintext) {
      results.push({ connectionId: change.connectionId, field: change.field, status: 'skipped-round-trip' });
      continue;
    }

    const changed = await db.compareAndSet(change.connectionId, change.field, change.plaintext, ciphertext);
    results.push({
      connectionId: change.connectionId,
      field: change.field,
      status: changed === 1 ? 'encrypted' : 'skipped-concurrent-edit',
    });
  }

  const verify = await verifyEncrypted(db, plan, results, keys, options.onlyOwner);
  return { plan, ownersWithoutKey, results, verify };
}

/** Re-reads every value the run encrypted and checks it decrypts to the original. */
async function verifyEncrypted(
  db: LegacyDb,
  plan: PlannedChange[],
  results: ChangeResult[],
  keys: Map<string, CryptoKey>,
  onlyOwner: string | undefined
): Promise<VerifyReport> {
  const rows = new Map((await db.listConnections(onlyOwner)).map((row) => [row.id, row]));
  const report: VerifyReport = { readable: 0, changedSince: 0, unreadable: [] };

  for (const [index, change] of plan.entries()) {
    if (results[index].status !== 'encrypted') continue;
    const current = rows.get(change.connectionId)?.[change.field];
    const key = keys.get(change.ownerId);
    if (typeof current !== 'string' || !isEncryptedString(current) || !key) {
      report.changedSince++;
      continue;
    }
    try {
      if ((await decryptText(current, key)) === change.plaintext) report.readable++;
      else report.changedSince++;
    } catch {
      report.unreadable.push({ connectionId: change.connectionId, field: change.field });
    }
  }
  return report;
}

export type RestoreStatus = 'restored' | 'skipped-changed-since' | 'skipped-no-key';

export interface RestoreResult {
  connectionId: string;
  field: SensitiveField;
  status: RestoreStatus;
}

/**
 * Puts the original plaintext back for every value that still decrypts to it.
 * A value the user changed after the migration is left as it is.
 */
export async function restore(
  db: LegacyDb,
  preImages: PlannedChange[],
  masterKey: Buffer
): Promise<RestoreResult[]> {
  const existingKeys = checkMasterKey(await db.listUserKeys(), masterKey);
  const owners = [...new Set(preImages.map((entry) => entry.ownerId))];
  const rows = new Map<string, ConnectionRow>();
  for (const owner of owners) {
    for (const row of await db.listConnections(owner)) rows.set(row.id, row);
  }

  const keys = new Map<string, CryptoKey>();
  const results: RestoreResult[] = [];
  for (const entry of preImages) {
    if (!isSensitiveField(entry.field)) {
      throw new MigrationAbortedError(`Pre-image file names an unknown field: ${String(entry.field)}`);
    }
    const raw = existingKeys.get(entry.ownerId);
    if (!raw) {
      results.push({ connectionId: entry.connectionId, field: entry.field, status: 'skipped-no-key' });
      continue;
    }
    let key = keys.get(entry.ownerId);
    if (!key) {
      key = await importDataKey(raw.toString('base64'));
      keys.set(entry.ownerId, key);
    }

    const current = rows.get(entry.connectionId)?.[entry.field];
    let matches = false;
    if (typeof current === 'string' && isEncryptedString(current)) {
      try {
        matches = (await decryptText(current, key)) === entry.plaintext;
      } catch {
        matches = false;
      }
    }
    if (!matches) {
      results.push({ connectionId: entry.connectionId, field: entry.field, status: 'skipped-changed-since' });
      continue;
    }

    const changed = await db.compareAndSet(entry.connectionId, entry.field, current as string, entry.plaintext);
    results.push({
      connectionId: entry.connectionId,
      field: entry.field,
      status: changed === 1 ? 'restored' : 'skipped-changed-since',
    });
  }
  return results;
}
