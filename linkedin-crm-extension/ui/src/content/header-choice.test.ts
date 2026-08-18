import { beforeEach, describe, expect, it } from 'vitest';
import { findAnchorButton, findProfileHeader, findProfileHeaderCandidates } from './anchors';

/**
 * Choosing between the cards that all look like the profile header.
 *
 * Measured on a live profile (Tim Jansen, 2026-08-18) there were 32 of them.
 * The button and note card landed in the 49px sticky bar that only appears once
 * you scroll, instead of in the 459px hero - reported from a screenshot, not
 * from an error, because nothing was broken enough to log.
 *
 * The heights below are the real ones from that page. jsdom lays nothing out
 * and reports 0 for everything, which is why findProfileHeader takes the
 * measurement as a parameter: the choice is the logic worth testing, and it can
 * only be tested if the measurement can be faked.
 */

const PROFILE_PATH = '/in/tjansen2';

/**
 * Synthetic, and labelled as such - unlike the captures in __fixtures__ this is
 * not real markup. It reproduces the one property that matters: several cards
 * that each link to the profile and carry an action, at the heights measured
 * live.
 */
function renderPage(): Document {
    document.body.innerHTML = `
      <div id="sticky">
        <a href="${PROFILE_PATH}/"><p>Tim Jansen</p></a>
        <div class="row">
          <div data-display-contents="true"><button aria-expanded="false">More</button></div>
          <div data-display-contents="true"><a href="/messaging/compose/?profileUrn=X">Message</a></div>
        </div>
      </div>
      <div id="hero">
        <a href="${PROFILE_PATH}/"><p>Tim Jansen · 1st</p></a>
        <div class="row">
          <div data-display-contents="true"><a href="/messaging/compose/?profileUrn=X">Message</a></div>
          <div data-display-contents="true"><button aria-expanded="false">More</button></div>
        </div>
      </div>
      <div id="post">
        <a href="${PROFILE_PATH}/"><p>Tim Jansen • 1st</p></a>
        <div class="row">
          <div data-display-contents="true"><button aria-expanded="false">Like</button></div>
        </div>
      </div>`;
    return document;
}

/** The heights measured on the live page. */
const HEIGHTS: Record<string, number> = { sticky: 49, hero: 459, post: 67 };

const measure = (element: HTMLElement): number => HEIGHTS[element.id] ?? 0;

beforeEach(() => {
    document.body.innerHTML = '';
});

describe('finding every card that looks like the header', () => {
    it('returns all of them, deduplicated', () => {
        const ids = findProfileHeaderCandidates(renderPage(), PROFILE_PATH).map((c) => c.id);
        expect(ids).toEqual(['sticky', 'hero', 'post']);
    });
});

describe('choosing between them', () => {
    it('picks the hero, not the sticky header that comes first', () => {
        expect(findProfileHeader(renderPage(), PROFILE_PATH, measure)?.id).toBe('hero');
    });

    // The regression in one line: document order picked the sticky bar, which
    // is where the button and card were appearing.
    it('does not pick whichever comes first in the document', () => {
        const doc = renderPage();
        const first = findProfileHeaderCandidates(doc, PROFILE_PATH)[0];
        expect(first.id).toBe('sticky');
        expect(findProfileHeader(doc, PROFILE_PATH, measure)).not.toBe(first);
    });

    it('anchors the button inside the hero', () => {
        const doc = renderPage();
        const anchor = findAnchorButton(doc, PROFILE_PATH, measure);
        expect(doc.getElementById('hero')?.contains(anchor)).toBe(true);
        expect(doc.getElementById('sticky')?.contains(anchor)).toBe(false);
    });

    // Before the hero has rendered, the sticky header is all there is. Falling
    // back to it beats showing nothing; main.js moves the injections once a
    // taller candidate turns up.
    it('falls back to the sticky header when it is the only candidate', () => {
        const doc = renderPage();
        doc.getElementById('hero')?.remove();
        doc.getElementById('post')?.remove();
        expect(findProfileHeader(doc, PROFILE_PATH, measure)?.id).toBe('sticky');
    });

    it('returns null when there is no candidate at all', () => {
        document.body.innerHTML = '<main><p>feed</p></main>';
        expect(findProfileHeader(document, PROFILE_PATH, measure)).toBeNull();
    });

    // Guards the default. If measureRenderedHeight stopped being applied, every
    // candidate would score 0 under jsdom and the first would win by accident -
    // exactly the old behaviour, silently restored.
    it('uses the injected measurement rather than ignoring it', () => {
        const doc = renderPage();
        const inverted = (element: HTMLElement): number => -(HEIGHTS[element.id] ?? 0);
        expect(findProfileHeader(doc, PROFILE_PATH, inverted)?.id).toBe('sticky');
    });
});
