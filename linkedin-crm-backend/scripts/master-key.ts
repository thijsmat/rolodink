#!/usr/bin/env tsx
/**
 * Helpers for rotating ENCRYPTION_MASTER_KEY. Run from linkedin-crm-backend/;
 * works the same in PowerShell. The runbook is in
 * .claude/skills/rolodink-release/SKILL.md ("De master key roteren").
 *
 *   npm run master-key -- generate
 *       Prints a new random key (base64, 32 bytes). Put it in the password
 *       manager first, before it goes anywhere else.
 *
 *   npm run master-key -- fingerprint
 *       Asks for a key (paste the copy FROM the password manager) and prints
 *       its fingerprint, for ENCRYPTION_MASTER_KEY_NEXT_FINGERPRINT in Vercel.
 *       The key is read from the prompt, not from an argument, so it does not
 *       end up in the shell history. Piping works too:
 *       `Get-Clipboard | npm run master-key -- fingerprint`.
 *
 * The fingerprint is deliberately printed only by `fingerprint`, from the
 * copy that was stored: then a match in Vercel proves that the stored copy
 * and the value in Vercel are the same key.
 */

import { randomBytes } from 'node:crypto';
import { createInterface } from 'node:readline';
import { masterKeyFingerprint } from '../src/lib/envelope';

function readOneLine(prompt: string): Promise<string> {
  return new Promise((resolve, reject) => {
    if (process.stdin.isTTY) process.stderr.write(prompt);
    const rl = createInterface({ input: process.stdin, terminal: false });
    let answered = false;
    rl.once('line', (line) => {
      answered = true;
      rl.close();
      resolve(line);
    });
    rl.once('close', () => {
      if (!answered) reject(new Error('No key given.'));
    });
  });
}

async function main(): Promise<void> {
  const command = process.argv[2];

  if (command === 'generate') {
    console.log(randomBytes(32).toString('base64'));
    console.error('\nSave this key in the password manager now. Then run `npm run master-key -- fingerprint`');
    console.error('and paste the copy from the password manager, not from this terminal.');
    return;
  }

  if (command === 'fingerprint') {
    const value = (await readOneLine('Paste the key from the password manager: ')).trim();
    const key = Buffer.from(value, 'base64');
    if (key.length !== 32 || key.toString('base64') !== value) {
      throw new Error('That is not a base64-encoded 32-byte key. Check the copy in the password manager.');
    }
    console.log(masterKeyFingerprint(key));
    return;
  }

  throw new Error('Usage: npm run master-key -- generate | fingerprint');
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
