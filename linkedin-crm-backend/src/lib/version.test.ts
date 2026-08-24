import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { LATEST_EXTENSION_VERSION } from './version';

/**
 * The guard that the comment in the old code could not be.
 *
 * /api/version drives the update notice inside the extension. When its idea of
 * "latest" drifts below the shipped version, the notice stops firing and
 * nobody hears about a release; when it drifts above, everyone is told to
 * update to something that does not exist yet. Both have happened.
 *
 * Resolved from this file rather than from cwd, so it does not matter whether
 * vitest runs from the backend directory or the repository root. It does
 * assume the backend sits inside the monorepo checkout, which is how every
 * workflow runs it - a standalone copy of just this package would fail here,
 * and that is the right kind of loud.
 */
const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');

const readManifestVersion = (name: string): string => {
    const path = join(repoRoot, 'linkedin-crm-extension', name);
    return JSON.parse(readFileSync(path, 'utf8')).version;
};

describe('LATEST_EXTENSION_VERSION', () => {
    it('is a three-part version', () => {
        expect(LATEST_EXTENSION_VERSION).toMatch(/^\d+\.\d+\.\d+$/);
    });

    it.each(['manifest.json', 'manifest-firefox.json'])(
        'matches %s',
        (manifest) => {
            // bump-version.sh writes all three. A failure here means a release
            // was cut without it, and the update notice is about to misreport.
            expect(LATEST_EXTENSION_VERSION).toBe(readManifestVersion(manifest));
        },
    );
});
