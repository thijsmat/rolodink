#!/usr/bin/env tsx
/**
 * One-off: encrypts the sensitive Connection fields that clients before 1.3.0
 * stored as plaintext. The rules it enforces are in scripts/lib/legacy-fields.ts.
 *
 * Usage (from linkedin-crm-backend/, with the production env loaded the same
 * way as for `npm run audit:notes`):
 *
 *   npm run encrypt:legacy -- --dry-run
 *       Checks the master key, audits the encrypted values and counts what it
 *       would encrypt. Writes nothing.
 *
 *   npm run encrypt:legacy -- --only-owner=<uuid> --confirm=<project ref>
 *       The canary: one owner only. Check that owner's notes in the popup and
 *       the note card, then run it again and expect 0 changes.
 *
 *   npm run encrypt:legacy -- --confirm=<project ref>
 *       Everyone else.
 *
 *   npm run encrypt:legacy -- --restore=<pre-image file> --confirm=<project ref>
 *       Puts the original plaintext back, for every value nobody has changed
 *       since. Only possible while the pre-image file still exists.
 *
 * --confirm must repeat the project ref the script prints, so a run against
 * the wrong database cannot happen by accident.
 *
 * Before the first write the script saves every original value (the
 * pre-images) to a file in the OS temp directory, readable only by you, and
 * prints its path. That file holds plaintext notes: delete it once the
 * migration has been verified, and delete .env.local too.
 *
 * The log never contains field values, only connection ids and field names.
 */

import { readFileSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { Prisma, PrismaClient } from '@prisma/client';
import { getMasterKey } from '../src/lib/envelope';
import {
  type LegacyDb,
  type PlannedChange,
  MigrationAbortedError,
  isSensitiveField,
  migrate,
  projectRefFromDatabaseUrl,
  restore,
} from './lib/legacy-fields';

const prisma = new PrismaClient();

const db: LegacyDb = {
  userKey: prisma.userKey,
  listUserKeys: () => prisma.userKey.findMany({ select: { user_id: true, encrypted_key: true, salt: true } }),
  listConnections: (ownerId) =>
    prisma.connection.findMany({
      where: ownerId ? { ownerId } : undefined,
      select: {
        id: true,
        ownerId: true,
        notes: true,
        meetingPlace: true,
        userCompanyAtTheTime: true,
        email: true,
        phone: true,
      },
      orderBy: { id: 'asc' },
    }),
  compareAndSet: (id, field, expected, next) => {
    // A column name cannot be a bind parameter. It only ever comes from the
    // fixed SENSITIVE_FIELDS list; this check keeps it that way.
    if (!isSensitiveField(field)) throw new Error(`Refusing to write unknown column ${String(field)}`);
    const column = Prisma.raw(`"${field}"`);
    return prisma.$executeRaw`UPDATE "public"."Connection" SET ${column} = ${next} WHERE "id" = ${id} AND ${column} = ${expected}`;
  },
};

interface Args {
  dryRun: boolean;
  confirm?: string;
  onlyOwner?: string;
  restoreFile?: string;
}

function parseArgs(argv: string[]): Args {
  const args: Args = { dryRun: false };
  for (const arg of argv) {
    const eq = arg.indexOf('=');
    const name = eq === -1 ? arg : arg.slice(0, eq);
    const value = eq === -1 ? undefined : arg.slice(eq + 1);
    if (name === '--dry-run') args.dryRun = true;
    else if (name === '--confirm' && value) args.confirm = value;
    else if (name === '--only-owner' && value) args.onlyOwner = value;
    else if (name === '--restore' && value) args.restoreFile = value;
    else throw new MigrationAbortedError(`Unknown argument: ${arg}`);
  }
  if (args.dryRun && args.restoreFile) {
    throw new MigrationAbortedError('--restore always writes; it has no dry run.');
  }
  return args;
}

interface PreImageFile {
  projectRef: string;
  createdAt: string;
  entries: PlannedChange[];
}

function savePreImages(projectRef: string, plan: PlannedChange[]): string {
  const file: PreImageFile = { projectRef, createdAt: new Date().toISOString(), entries: plan };
  const contents = JSON.stringify(file, null, 2);
  const path = join(tmpdir(), `rolodink-legacy-preimages-${Date.now()}.json`);
  // wx: never overwrite an earlier run's pre-images. 0600: only the current user can read it.
  writeFileSync(path, contents, { encoding: 'utf8', mode: 0o600, flag: 'wx' });
  if (readFileSync(path, 'utf8') !== contents) {
    throw new MigrationAbortedError(`Pre-images at ${path} do not read back correctly. Not writing anything.`);
  }
  return path;
}

function readPreImages(path: string, projectRef: string): PlannedChange[] {
  const file = JSON.parse(readFileSync(path, 'utf8')) as PreImageFile;
  if (file.projectRef !== projectRef) {
    throw new MigrationAbortedError(
      `${path} was written for project ${file.projectRef}, but DATABASE_URL points at ${projectRef}.`
    );
  }
  return file.entries;
}

function countBy<T>(items: T[], key: (item: T) => string): string {
  const counts = new Map<string, number>();
  for (const item of items) counts.set(key(item), (counts.get(key(item)) ?? 0) + 1);
  return [...counts].map(([name, count]) => `${name} ${count}`).join(', ') || 'none';
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const masterKey = getMasterKey();

  const projectRef = projectRefFromDatabaseUrl(process.env.DATABASE_URL);
  if (!projectRef) {
    throw new MigrationAbortedError('Cannot read a Supabase project ref from DATABASE_URL.');
  }
  console.log(`Database project: ${projectRef}`);

  const writes = !args.dryRun;
  if (writes && args.confirm !== projectRef) {
    throw new MigrationAbortedError(
      `This run writes to ${projectRef}. Run again with --confirm=${projectRef} if that is the right database.`
    );
  }

  if (args.restoreFile) {
    const entries = readPreImages(args.restoreFile, projectRef);
    const results = await restore(db, entries, masterKey);
    console.log(`Restore: ${countBy(results, (r) => r.status)}`);
    for (const result of results.filter((r) => r.status !== 'restored')) {
      console.log(`  ${result.connectionId} ${result.field}: ${result.status}`);
    }
    if (results.some((r) => r.status !== 'restored')) process.exitCode = 1;
    return;
  }

  let preImagePath: string | undefined;
  const report = await migrate(db, {
    masterKey,
    onlyOwner: args.onlyOwner,
    dryRun: args.dryRun,
    savePreImages: (plan) => {
      preImagePath = savePreImages(projectRef, plan);
      console.log(`Pre-images (plaintext!) saved to ${preImagePath}`);
    },
  });

  const owners = new Set(report.plan.map((c) => c.ownerId)).size;
  console.log('Master key unwraps every stored user key; no corrupt encrypted values.');
  console.log(
    `Plaintext values: ${report.plan.length} (${countBy(report.plan, (c) => c.field)}) ` +
      `across ${owners} owner(s), ${report.ownersWithoutKey.length} of whom get a new key.`
  );

  if (args.dryRun) {
    console.log('Dry run: nothing written.');
    return;
  }
  if (report.plan.length === 0) {
    console.log('Nothing to encrypt.');
    return;
  }

  console.log(`Result: ${countBy(report.results, (r) => r.status)}`);
  for (const result of report.results.filter((r) => r.status !== 'encrypted')) {
    console.log(`  ${result.connectionId} ${result.field}: ${result.status}`);
  }
  const verify = report.verify;
  if (verify) {
    console.log(
      `Verify: ${verify.readable} decrypt to the original, ${verify.changedSince} changed since, ` +
        `${verify.unreadable.length} unreadable.`
    );
    for (const value of verify.unreadable) console.log(`  UNREADABLE ${value.connectionId} ${value.field}`);
  }

  const clean =
    report.results.every((r) => r.status === 'encrypted') && (verify?.unreadable.length ?? 0) === 0;
  if (!clean) process.exitCode = 1;

  console.log('\nNext:');
  console.log('  - Run the same command again: it should find 0 plaintext values.');
  console.log(`  - Keep ${preImagePath} for 48 hours for --restore, then delete it.`);
  console.log('  - Delete .env.local now; it holds the master key.');
}

main()
  .catch((error) => {
    console.error(error instanceof MigrationAbortedError ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
