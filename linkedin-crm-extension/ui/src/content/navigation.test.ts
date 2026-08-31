import { beforeEach, describe, expect, it } from 'vitest';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { removeInjectedElements } from './anchors';
// The manifest is part of the navigation behaviour: SPA support is the pair
// (match all of LinkedIn) + (gate on the path in the script). Asserting only
// the script half would let the manifest quietly narrow back to /in/*, which
// silently reintroduces the bug for every SPA navigation.
import manifestRaw from '../../../manifest.json?raw';
// Both manifests, because all three targets now ship the same bundle. Firefox
// was deliberately left at /in/* while it ran its own content-firefox.js,
// which had no path gating; that fork is gone, so the narrowing has no reason
// to survive either - and an untested second manifest is exactly where it
// would survive unnoticed.
import firefoxManifestRaw from '../../../manifest-firefox.json?raw';

beforeEach(() => {
    document.body.innerHTML = '';
});

const MANIFESTS = [
    ['manifest.json', manifestRaw],
    ['manifest-firefox.json', firefoxManifestRaw],
] as const;

describe.each(MANIFESTS)('%s lets the script live across SPA navigations', (_name, raw) => {
    const matches: string[] = JSON.parse(raw).content_scripts[0].matches;

    it('injects on every LinkedIn page, not only profile documents', () => {
        expect(matches).toContain('https://*.linkedin.com/*');
        // A profile reached from the feed is SPA navigation: no document load,
        // so a /in/* match never fires and the script simply does not exist on
        // that page. Onboarding sends every new user to the feed, making this
        // the default path for a fresh install.
        for (const match of matches) {
            expect(match).not.toContain('/in/');
        }
    });

    it('still targets only linkedin.com', () => {
        for (const match of matches) {
            expect(match).toMatch(/^https:\/\/(\*\.)?linkedin\.com\//);
        }
    });
});

describe('there are exactly two manifests', () => {
    // There were three. ui/public/manifest.json sat at version 1.1.1 with the
    // old /in/* matches, and Vite copies public/ wholesale into dist/, so it
    // landed as dist/manifest.json on every build. copy-assets.cjs happened to
    // overwrite it a step later, which is the only reason nothing shipped
    // wrong - a trap held shut by step ordering.
    //
    // It did escape once: the AMO source archive builds without the extension
    // root, so copy-assets finds no manifest to copy, and a reviewer following
    // the build instructions ended up looking at 1.1.1 while the submitted
    // package said 1.3.5.
    it('does not keep a stale copy in ui/public', () => {
        const publicDir = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'public');
        expect(existsSync(join(publicDir, 'manifest.json'))).toBe(false);
    });
});

describe('the two manifests agree on where the script runs', () => {
    it('matches the same hosts', () => {
        const [[, chromeRaw], [, firefoxRaw]] = MANIFESTS;
        expect(JSON.parse(firefoxRaw).content_scripts[0].matches)
            .toEqual(JSON.parse(chromeRaw).content_scripts[0].matches);
    });

    it('differs only where the platforms genuinely differ', () => {
        // Firefox reported this one out loud: "Warning processing
        // privacy_policy_url: An unexpected property was found in the
        // WebExtension manifest." It is a store-listing field, not a manifest
        // key - in neither browser - and it sat in manifest-firefox.json only.
        //
        // The general shape of that mistake is a key added to one manifest and
        // not the other, which nothing catches: the packages build, both
        // stores accept them, and the two browsers quietly behave differently.
        // So the allowed differences are named, and anything else fails here.
        const ALLOWED_DIFFERENCES = new Set([
            // Firefox needs the gecko id to identify the add-on on AMO.
            'browser_specific_settings',
            // Chrome MV3 wants service_worker; Firefox MV3 wants scripts.
            'background',
            // Different default_icon path per store.
            'action',
            // Firefox additionally exposes icons/*, which its action icon needs.
            'web_accessible_resources',
        ]);

        const [[, chromeRaw], [, firefoxRaw]] = MANIFESTS;
        const chrome = JSON.parse(chromeRaw);
        const firefox = JSON.parse(firefoxRaw);

        const differing = [...new Set([...Object.keys(chrome), ...Object.keys(firefox)])]
            .filter((key) => JSON.stringify(chrome[key]) !== JSON.stringify(firefox[key]))
            .filter((key) => !ALLOWED_DIFFERENCES.has(key));

        expect(differing).toEqual([]);
    });

    it('declares the same version', () => {
        // build.js resolves the version from whichever manifest it packages,
        // and release.yml checks both against the tag. A drift here means one
        // store gets a package numbered differently from the others.
        const [[, chromeRaw], [, firefoxRaw]] = MANIFESTS;
        expect(JSON.parse(firefoxRaw).version).toBe(JSON.parse(chromeRaw).version);
    });
});

describe('removeInjectedElements', () => {
    it('removes the button and the note card, and nothing else', () => {
        document.body.innerHTML = `
      <div id="keep-me"><p>LinkedIn content</p></div>
      <button id="crm-add-button">Already added ✔️</button>
      <div id="rolodink-context-field"><textarea>someone else's note</textarea></div>`;

        expect(removeInjectedElements(document)).toBe(2);
        expect(document.getElementById('crm-add-button')).toBeNull();
        expect(document.getElementById('rolodink-context-field')).toBeNull();
        expect(document.getElementById('keep-me')).not.toBeNull();
    });

    it('returns 0 on a page with nothing injected', () => {
        document.body.innerHTML = '<main><p>feed</p></main>';
        expect(removeInjectedElements(document)).toBe(0);
    });

    // Duplicate ids are invalid HTML, but a re-render race can produce them,
    // and a teardown that leaves one behind defeats its purpose.
    it('removes duplicates too', () => {
        document.body.innerHTML = `
      <button id="crm-add-button">a</button>
      <button id="crm-add-button">b</button>`;
        expect(removeInjectedElements(document)).toBe(2);
        expect(document.querySelectorAll('#crm-add-button')).toHaveLength(0);
    });
});
