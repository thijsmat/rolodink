// Read-only audit of the encrypted Connection fields.
//
// Achtergrond: het inline notitiekaartje in content.js schreef notities lange
// tijd onversleuteld weg, terwijl de popup ze versleutelde. Wie een versleutelde
// notitie in het kaartje bewerkte, kreeg "rolodink-enc:<ciphertext><plaintext>"
// in de database: de prefix zegt "versleuteld", maar ontsleutelen faalt en de
// notitie is niet meer te lezen.
//
// Dit script telt hoe vaak dat is gebeurd. Het schrijft niets.
//
// Run with: node scripts/audit-encrypted-notes.js
// Vereist DATABASE_URL en ENCRYPTION_MASTER_KEY in .env.local.

const { PrismaClient } = require('@prisma/client');
const { createDecipheriv } = require('crypto');

// dotenv staat niet in de dependencies van dit package, dus laad .env.local
// alleen als het toevallig beschikbaar is. Zijn de variabelen al gezet (inline
// of via `vercel env pull`), dan is dit sowieso niet nodig.
try {
  require('dotenv').config({ path: '.env.local' });
} catch {
  // dotenv niet geïnstalleerd — verder met de bestaande omgevingsvariabelen.
}

const prisma = new PrismaClient();

const ENVELOPE_VERSION = 'envelope-v1';
const ENCRYPTION_PREFIX = 'rolodink-enc:';
// Zelfde lijst als SENSITIVE_FIELDS in de extensie (useConnectionLogic.ts).
const SENSITIVE_FIELDS = ['notes', 'meetingPlace', 'userCompanyAtTheTime', 'email', 'phone'];

function getMasterKey() {
  const masterKeyB64 = process.env.ENCRYPTION_MASTER_KEY;
  if (!masterKeyB64) {
    throw new Error('ENCRYPTION_MASTER_KEY not configured in .env.local');
  }
  const masterKey = Buffer.from(masterKeyB64, 'base64');
  if (masterKey.length !== 32) {
    throw new Error('ENCRYPTION_MASTER_KEY must be a base64-encoded 32-byte key');
  }
  return masterKey;
}

// Identiek aan unwrapDataKey in src/app/api/user/key/route.ts.
function unwrapDataKey(wrapped, masterKey) {
  const blob = Buffer.from(wrapped, 'base64');
  if (blob.length < 28) {
    throw new Error('Invalid wrapped key length');
  }
  const iv = blob.subarray(0, 12);
  const authTag = blob.subarray(12, 28);
  const ciphertext = blob.subarray(28);
  const decipher = createDecipheriv('aes-256-gcm', masterKey, iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
}

/**
 * Ontsleutelt een veldwaarde. De extensie schrijft base64(iv[12] || ciphertext),
 * waarbij WebCrypto de 16-byte GCM-tag achter de ciphertext plakt. Node wil die
 * tag apart, dus we splitsen hem er hier weer af.
 */
function decryptField(value, dataKey) {
  const raw = Buffer.from(value.slice(ENCRYPTION_PREFIX.length), 'base64');
  if (raw.length < 12 + 16) {
    throw new Error('Payload too short to contain IV and auth tag');
  }
  const iv = raw.subarray(0, 12);
  const authTag = raw.subarray(raw.length - 16);
  const ciphertext = raw.subarray(12, raw.length - 16);
  const decipher = createDecipheriv('aes-256-gcm', dataKey, iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8');
}

async function main() {
  const masterKey = getMasterKey();

  const userKeys = await prisma.userKey.findMany();
  console.log(`Found ${userKeys.length} user key(s).\n`);

  const totals = { empty: 0, plaintext: 0, ok: 0, corrupt: 0 };
  const corruptRows = [];
  const skippedUsers = [];

  for (const userKey of userKeys) {
    if (!userKey.encrypted_key || userKey.salt !== ENVELOPE_VERSION) {
      skippedUsers.push({ userId: userKey.user_id, reason: 'unexpected key format' });
      continue;
    }

    let dataKey;
    try {
      dataKey = unwrapDataKey(userKey.encrypted_key, masterKey);
    } catch (error) {
      // Bijna altijd: deze rij hoort bij een andere ENCRYPTION_MASTER_KEY.
      skippedUsers.push({ userId: userKey.user_id, reason: `unwrap failed (${error.message})` });
      continue;
    }

    const connections = await prisma.connection.findMany({
      where: { ownerId: userKey.user_id },
      select: {
        id: true,
        name: true,
        linkedInUrl: true,
        updatedAt: true,
        ...Object.fromEntries(SENSITIVE_FIELDS.map((field) => [field, true])),
      },
    });

    for (const connection of connections) {
      for (const field of SENSITIVE_FIELDS) {
        const value = connection[field];

        if (!value) {
          totals.empty++;
        } else if (!value.startsWith(ENCRYPTION_PREFIX)) {
          // Legacy plaintext: leesbaar, wordt bij de eerstvolgende bewerking
          // vanzelf versleuteld. Geen dataverlies.
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
              reason: error.message,
            });
          }
        }
      }
    }
  }

  console.log('Field values by state');
  console.log(`  empty                : ${totals.empty}`);
  console.log(`  legacy plaintext     : ${totals.plaintext}   (readable, no data lost)`);
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
    'so the original note is gone. Clearing the field in the popup restores a ' +
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
