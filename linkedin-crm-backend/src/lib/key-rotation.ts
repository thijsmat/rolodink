/**
 * Moves every stored user key over to `ENCRYPTION_MASTER_KEY_NEXT`, as one
 * step of a master-key rotation. Run daily by GET /api/cron/keep-alive; it
 * does nothing unless the next key is set and its fingerprint is confirmed
 * (see `readNextMasterKey` in envelope.ts).
 *
 * Only the wrapping changes: each user's data key, and so every note, stays
 * the same. Per row:
 *  1. A key that already unwraps with the next key is left alone, so a second
 *     run changes nothing.
 *  2. Otherwise it must unwrap with the current key; a row that opens with
 *     neither is reported and left untouched.
 *  3. The new wrapping is unwrapped again and compared with the data key
 *     before it is written.
 *  4. The write is a compare-and-set on the old `encrypted_key`: a row that
 *     changed in the meantime is skipped and picked up by the next run.
 *
 * A run cut short (a function timeout) loses nothing: rows already moved are
 * skipped by the next run, which carries on with the rest.
 *
 * The report holds counts only. User ids of failed rows go to the server log,
 * never into the HTTP response, and no key material goes anywhere.
 */

import { ENVELOPE_VERSION, getMasterKey, readNextMasterKey, unwrapDataKey, wrapDataKey } from './envelope';

export interface StoredUserKey {
    user_id: string;
    encrypted_key: string;
    salt: string;
}

export interface RotationStore {
    listUserKeys(): Promise<StoredUserKey[]>;
    /** Sets `encrypted_key` to `next` only while it still holds `expected`. Returns the number of rows changed (0 or 1). */
    compareAndSetKey(userId: string, expected: string, next: string): Promise<number>;
}

export interface RewrapFailure {
    userId: string;
    reason: 'unexpected-format' | 'opens-with-neither-key' | 'round-trip';
}

export interface RewrapReport {
    total: number;
    rewrapped: number;
    alreadyNext: number;
    changedMeanwhile: number;
    failed: RewrapFailure[];
}

function opensWith(wrapped: string, masterKey: Buffer): Buffer | null {
    try {
        return unwrapDataKey(wrapped, masterKey);
    } catch {
        return null;
    }
}

export async function rewrapUserKeys(db: RotationStore, current: Buffer, next: Buffer): Promise<RewrapReport> {
    const report: RewrapReport = { total: 0, rewrapped: 0, alreadyNext: 0, changedMeanwhile: 0, failed: [] };

    for (const row of await db.listUserKeys()) {
        report.total++;
        if (row.salt !== ENVELOPE_VERSION) {
            report.failed.push({ userId: row.user_id, reason: 'unexpected-format' });
            continue;
        }
        if (opensWith(row.encrypted_key, next)) {
            report.alreadyNext++;
            continue;
        }
        const dataKey = opensWith(row.encrypted_key, current);
        if (!dataKey) {
            report.failed.push({ userId: row.user_id, reason: 'opens-with-neither-key' });
            continue;
        }

        const rewrapped = wrapDataKey(dataKey, next);
        if (!opensWith(rewrapped, next)?.equals(dataKey)) {
            report.failed.push({ userId: row.user_id, reason: 'round-trip' });
            continue;
        }

        const changed = await db.compareAndSetKey(row.user_id, row.encrypted_key, rewrapped);
        if (changed === 1) report.rewrapped++;
        else report.changedMeanwhile++;
    }
    return report;
}

/** What the cron reports: the state of the next key and, when it ran, the counts. */
export type RotationResult =
    | { state: 'unset' | 'invalid' | 'fingerprint-missing' | 'fingerprint-mismatch' }
    | ({ state: 'confirmed'; done: boolean } & Omit<RewrapReport, 'failed'> & { failed: number });

/**
 * One rotation pass with the keys from `env`. The expected fingerprint is
 * never logged or returned: copying it from a log into Vercel would defeat
 * the check, which is there to prove the operator's own copy is right.
 */
export async function runKeyRotation(
    db: RotationStore,
    env: Partial<Record<string, string>> = process.env
): Promise<RotationResult> {
    const next = readNextMasterKey(env);
    if (next.state === 'unset') return { state: 'unset' };
    if (next.state === 'invalid') {
        console.error('Key rotation: ENCRYPTION_MASTER_KEY_NEXT is not a base64 32-byte key; ignoring it.');
        return { state: 'invalid' };
    }
    if (next.state === 'unconfirmed') {
        console.error(
            `Key rotation: ${next.reason}. ENCRYPTION_MASTER_KEY_NEXT_FINGERPRINT must match the stored copy ` +
                'of ENCRYPTION_MASTER_KEY_NEXT (npm run master-key -- fingerprint); nothing is wrapped with it until then.'
        );
        return { state: next.reason };
    }

    const report = await rewrapUserKeys(db, getMasterKey(env), next.key);
    for (const failure of report.failed) {
        console.error(`Key rotation: user key of ${failure.userId} not re-wrapped: ${failure.reason}`);
    }
    const done = report.rewrapped + report.alreadyNext === report.total;
    console.log(
        `Key rotation: ${report.total} user keys, ${report.rewrapped} re-wrapped, ${report.alreadyNext} already on the next key, ` +
            `${report.changedMeanwhile} changed meanwhile, ${report.failed.length} failed.` +
            (done ? ' Every user key opens with ENCRYPTION_MASTER_KEY_NEXT.' : '')
    );
    return { state: 'confirmed', done, ...report, failed: report.failed.length };
}
