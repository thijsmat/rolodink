#!/usr/bin/env tsx
/**
 * Read-only audit of the encrypted Connection fields.
 *
 * Background: the inline note card in content.js wrote notes in plaintext while
 * the popup encrypted them. Editing an encrypted note in that card produced
 * "rolodink-enc:<ciphertext><plaintext>" — the prefix still says "encrypted",
 * but decryption fails and the note is unreadable.
 *
 * This script counts how often that happened. It writes nothing.
 *
 * Usage:
 *   npm run audit:notes
 *
 * Requires DATABASE_URL and ENCRYPTION_MASTER_KEY (both already needed by the
 * backend); load them however you normally do, e.g. `vercel env pull .env.local`
 * followed by `set -a && . .env.local && set +a`.
 */

import { createDecipheriv } from 'crypto';
import { PrismaClient } from '@prisma/client';
import { ENVELOPE_VERSION, getMasterKey, unwrapDataKey } from '../src/lib/envelope';

const prisma = new PrismaClient();

const ENCRYPTION_PREFIX = 'rolodink-enc:';
/** Same list as SENSITIVE_FIELDS in the extension (useConnectionLogic.ts). */
const SENSITIVE_FIELDS = ['notes', 'meetingPlace', 'userCompanyAtTheTime', 'email', 'phone'] as const;

const IV_BYTES = 12;
const GCM_TAG_BYTES = 16;

interface CorruptRow {
  connectionId: string;
  name: string;
  linkedInUrl: string;
  field: string;
  updatedAt: Date;
  length: number;
  reason: string;
}

/**
 * Decrypts a field value written by the client.
 *
 * The client stores base64(iv[12] || ciphertext), where WebCrypto has already
 * appended the 16-byte GCM tag to the ciphertext. Node wants that tag supplied
 * separately, so it is split back off here.
 */
function decryptField(value: string, dataKey: Buffer): string {
  const raw = Buffer.from(value.slice(ENCRYPTION_PREFIX.length), 'base64');
  if (raw.length < IV_BYTES + GCM_TAG_BYTES) {
    throw new Error('Payload too short to contain an IV and an auth tag');
  }
  const iv = raw.subarray(0, IV_BYTES);
  const authTag = raw.subarray(raw.length - GCM_TAG_BYTES);
  const ciphertext = raw.subarray(IV_BYTES, raw.length - GCM_TAG_BYTES);
  const decipher = createDecipheriv('aes-256-gcm', dataKey, iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8');
}

async function main(): Promise<void> {
  const masterKey = getMasterKey();

  const userKeys = await prisma.userKey.findMany();
  console.log(`Found ${userKeys.length} user key(s).\n`);

  const totals = { empty: 0, plaintext: 0, ok: 0, corrupt: 0 };
  const corruptRows: CorruptRow[] = [];
  const skippedUsers: Array<{ userId: string; reason: string }> = [];

  for (const userKey of userKeys) {
    if (!userKey.encrypted_key || userKey.salt !== ENVELOPE_VERSION) {
      skippedUsers.push({ userId: userKey.user_id, reason: 'unexpected key format' });
      continue;
    }

    let dataKey: Buffer;
    try {
      dataKey = unwrapDataKey(userKey.encrypted_key, masterKey);
    } catch (error) {
      // Almost always: this row belongs to a different ENCRYPTION_MASTER_KEY.
      const reason = error instanceof Error ? error.message : String(error);
      skippedUsers.push({ userId: userKey.user_id, reason: `unwrap failed (${reason})` });
      continue;
    }

    const connections = await prisma.connection.findMany({
      where: { ownerId: userKey.user_id },
    });

    for (const connection of connections) {
      for (const field of SENSITIVE_FIELDS) {
        const value = connection[field];

        if (!value) {
          totals.empty++;
        } else if (!value.startsWith(ENCRYPTION_PREFIX)) {
          // Legacy plaintext: readable, and re-encrypted on the next edit. Nothing lost.
          totals.plaintext++;
        } else {
          try {
            decryptField(value, dataKey);
            totals.ok++;
          } catch (error) {
            totals.corrupt++;
            corruptRows.push({
              connectionId: connection.id,
              name: connection.name,
              linkedInUrl: connection.linkedInUrl,
              field,
              updatedAt: connection.updatedAt,
              length: value.length,
              reason: error instanceof Error ? error.message : String(error),
            });
          }
        }
      }
    }
  }

  console.log('Field values by state');
  console.log(`  empty                : ${totals.empty}`);
  console.log(`  legacy plaintext     : ${totals.plaintext}   (readable, nothing lost)`);
  console.log(`  encrypted, decrypts  : ${totals.ok}`);
  console.log(`  encrypted, CORRUPT   : ${totals.corrupt}   <-- unreadable\n`);

  if (skippedUsers.length > 0) {
    console.log(`Skipped ${skippedUsers.length} user key(s):`);
    for (const skipped of skippedUsers) {
      console.log(`  ${skipped.userId}: ${skipped.reason}`);
    }
    console.log('');
  }

  if (corruptRows.length === 0) {
    console.log('No corrupted values found.');
    return;
  }

  console.log('Corrupted values:');
  for (const row of corruptRows) {
    console.log(
      `  [${row.field}] ${row.name} — ${row.linkedInUrl}\n` +
      `      connection ${row.connectionId}, updated ${row.updatedAt.toISOString()}, ${row.length} chars\n` +
      `      ${row.reason}`
    );
  }
  console.log(
    '\nThese values cannot be recovered: plaintext was appended to ciphertext, ' +
    'so the original text is gone. Clearing the field in the popup restores a ' +
    'usable state for that connection.'
  );
}

main()
  .catch((error) => {
    console.error('Audit failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
