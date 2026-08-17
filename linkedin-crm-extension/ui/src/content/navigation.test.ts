import { beforeEach, describe, expect, it } from 'vitest';
import { removeInjectedElements } from './anchors';
// The manifest is part of the navigation behaviour: SPA support is the pair
// (match all of LinkedIn) + (gate on the path in the script). Asserting only
// the script half would let the manifest quietly narrow back to /in/*, which
// silently reintroduces the bug for every SPA navigation.
import manifestRaw from '../../../manifest.json?raw';

beforeEach(() => {
    document.body.innerHTML = '';
});

describe('the manifest lets the script live across SPA navigations', () => {
    const manifest = JSON.parse(manifestRaw);
    const matches: string[] = manifest.content_scripts[0].matches;

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
