#!/usr/bin/env node
/**
 * PreToolUse guard for Edit/Write/MultiEdit. Blocks the edits this repository
 * forbids in prose but nothing used to enforce:
 *
 *  - .env files (not .env.example): they hold production secrets, among them
 *    ENCRYPTION_MASTER_KEY during a migration.
 *  - package-lock.json: regenerate it with npm, never by hand.
 *  - linkedin-crm-extension/extension-keys.json: the Chrome store identity.
 *  - The fixed vector in linkedin-crm-backend/src/lib/envelope.test.ts. It
 *    proves that every wrapped key already in user_keys still unwraps; if a
 *    change fails it, the change is wrong, not the vector.
 *
 * Exit code 2 blocks the tool call and shows stderr to Claude. Edits through
 * Bash (sed, heredocs) are not covered.
 */

import { readFileSync } from 'node:fs';
import { basename, relative, resolve } from 'node:path';

const VECTOR_FILE = 'linkedin-crm-backend/src/lib/envelope.test.ts';

function block(reason) {
  process.stderr.write(`Blocked by .claude/hooks/guard-edits.mjs: ${reason}\n`);
  process.exit(2);
}

/** The quoted values of the VECTOR_* constants, as they stand in the file now. */
function vectorValues(path) {
  let source;
  try {
    source = readFileSync(path, 'utf8');
  } catch {
    return [];
  }
  const values = [];
  const pattern = /const VECTOR_\w+\s*=[^']*'([^']+)'/g;
  for (const match of source.matchAll(pattern)) values.push(match[1]);
  return values;
}

let input;
try {
  input = JSON.parse(readFileSync(0, 'utf8'));
} catch {
  process.exit(0);
}

const toolInput = input.tool_input ?? {};
const filePath = toolInput.file_path;
if (typeof filePath !== 'string') process.exit(0);

const projectDir = process.env.CLAUDE_PROJECT_DIR || input.cwd || process.cwd();
const absolute = resolve(projectDir, filePath);
const rel = relative(projectDir, absolute).split('\\').join('/');
const name = basename(absolute);

if (/^\.env(\..+)?$/.test(name) && !name.endsWith('.example')) {
  block(`${rel} holds secrets and is not edited by Claude. Ask the user to change it.`);
}
if (name === 'package-lock.json') {
  block(`${rel} is generated. Change package.json and run npm install --package-lock-only in that directory instead.`);
}
if (rel === 'linkedin-crm-extension/extension-keys.json') {
  block(`${rel} pins the Chrome extension ID; changing it breaks the store listing and the OAuth redirect.`);
}

if (rel === VECTOR_FILE) {
  const values = vectorValues(absolute);
  const edits =
    input.tool_name === 'Write'
      ? null
      : input.tool_name === 'MultiEdit'
        ? toolInput.edits ?? []
        : [{ old_string: toolInput.old_string ?? '', new_string: toolInput.new_string ?? '' }];
  for (const value of values) {
    const removed =
      edits === null
        ? typeof toolInput.content === 'string' && !toolInput.content.includes(value)
        : edits.some((e) => String(e.old_string).includes(value) && !String(e.new_string).includes(value));
    if (removed) {
      block(
        'this edit changes the fixed vector in envelope.test.ts. It proves that keys already stored in ' +
          'user_keys still unwrap. If a change fails that test, fix the change; never update the vector.'
      );
    }
  }
}

process.exit(0);
