import { beforeEach, describe, expect, it } from 'vitest';
import {
    currentProfilePath,
    findActionContainer,
    findAnchorButton,
    findInsertionReference,
    findProfileHeader,
} from './anchors';

// Real markup, captured 2026-08-11 from a live profile. See __fixtures__/README.md.
//
// Loaded with Vite's `?raw` rather than fs: under the jsdom environment
// import.meta.url is the jsdom document URL, not a file:// one, so
// fileURLToPath rejects it. `?raw` is resolved at transform time and does not
// care what the runtime environment thinks the base URL is.
import HEADER_FIXTURE from './__fixtures__/profile-header-2026-08-11.html?raw';

const PROFILE_PATH = '/in/paul-christian-gevaerts-aba21143';

/**
 * A "people also viewed" card: same shape as the header, but pointing at
 * somebody else. Every selector the old code used matched these too, which is
 * how the search kept landing in the sidebar.
 */
const OTHER_PERSON_CARD = `
<div data-testid="sidebar">
  <div class="_9f62251f ad664917">
    <a href="/in/someone-else-12345/"><div aria-label="Someone Else"><p>Someone Else</p></div></a>
    <div class="_9f62251f ad664917">
      <div data-display-contents="true">
        <button type="button" aria-label="Follow Someone Else">Follow</button>
      </div>
      <div data-display-contents="true">
        <a href="/messaging/compose/?profileUrn=urn%3Ali%3Afsd_profile%3AOTHER"><span>Message</span></a>
      </div>
    </div>
  </div>
</div>`;

function render(html: string): Document {
    document.body.innerHTML = html;
    return document;
}

beforeEach(() => {
    document.body.innerHTML = '';
});

describe('currentProfilePath', () => {
    it('extracts the profile path', () => {
        expect(currentProfilePath('/in/paul-christian-gevaerts-aba21143/')).toBe(PROFILE_PATH);
    });

    it('ignores sub-pages, query strings and fragments', () => {
        for (const input of [
            '/in/paul-christian-gevaerts-aba21143/details/experience/',
            '/in/paul-christian-gevaerts-aba21143?originalSubdomain=nl',
            '/in/paul-christian-gevaerts-aba21143#skills',
        ]) {
            expect(currentProfilePath(input)).toBe(PROFILE_PATH);
        }
    });

    it('returns null off a profile page', () => {
        for (const input of ['/feed/', '/company/rolodink/', '/', '/in/']) {
            expect(currentProfilePath(input)).toBeNull();
        }
    });
});

describe('findAnchorButton against the real August 2026 markup', () => {
    // The core regression. Every selector the previous implementation used
    // returns zero matches on this fixture, and the Message action is an <a>
    // rather than a <button>, so `button[aria-label*='Message']` never had a
    // chance either.
    it('finds the messaging link', () => {
        const doc = render(HEADER_FIXTURE);
        const anchor = findAnchorButton(doc, PROFILE_PATH);

        expect(anchor).not.toBeNull();
        expect(anchor?.tagName).toBe('A');
        expect(anchor?.getAttribute('href')).toContain('/messaging/compose/');
    });

    it('documents that every selector the old code used is dead here', () => {
        const doc = render(HEADER_FIXTURE);
        for (const dead of [
            '.pv-top-card',
            '.pv-top-card__actions',
            '.artdeco-button--primary',
            '.dist-value',
            '.entry-point',
            "button[aria-label*='Message']",
            "button[aria-label*='Bericht']",
        ]) {
            expect(doc.querySelectorAll(dead)).toHaveLength(0);
        }
    });

    it('finds the action row rather than the wrapper around a single button', () => {
        const doc = render(HEADER_FIXTURE);
        const anchor = findAnchorButton(doc, PROFILE_PATH);
        const container = findActionContainer(anchor as HTMLElement);

        expect(container).not.toBeNull();
        // The row holds both actions; the [data-display-contents] wrapper the
        // link sits in holds only the link. Injecting into the wrapper would put
        // our button inside another button's slot.
        expect(container?.querySelectorAll('[data-display-contents]')).toHaveLength(2);
        expect(container?.querySelector('button[aria-expanded]')).not.toBeNull();
    });
});

describe('not matching other people', () => {
    it('ignores a card that links to a different profile', () => {
        const doc = render(OTHER_PERSON_CARD);
        expect(findProfileHeader(doc, PROFILE_PATH)).toBeNull();
        expect(findAnchorButton(doc, PROFILE_PATH)).toBeNull();
    });

    it('picks this profile out of a page full of other people', () => {
        const doc = render(OTHER_PERSON_CARD + HEADER_FIXTURE + OTHER_PERSON_CARD);
        const anchor = findAnchorButton(doc, PROFILE_PATH);

        expect(anchor).not.toBeNull();
        // The sidebar cards carry their own compose links; the one we return
        // must be the current profile's.
        expect(anchor?.getAttribute('href')).toContain('ACoAAAkbpe4');
        expect(anchor?.getAttribute('href')).not.toContain('OTHER');
    });

    it('returns an element inside the profile header, not inside the sidebar', () => {
        const doc = render(OTHER_PERSON_CARD + HEADER_FIXTURE);
        const anchor = findAnchorButton(doc, PROFILE_PATH);
        const sidebar = doc.querySelector('[data-testid="sidebar"]');

        expect(anchor).not.toBeNull();
        expect(sidebar).not.toBeNull();
        expect(sidebar?.contains(anchor)).toBe(false);
    });
});

describe('giving up loudly rather than silently', () => {
    it('returns null when the profile link is present but carries no actions', () => {
        const doc = render(`<div><a href="${PROFILE_PATH}/"><p>Paul</p></a></div>`);
        expect(findProfileHeader(doc, PROFILE_PATH)).toBeNull();
        expect(findAnchorButton(doc, PROFILE_PATH)).toBeNull();
    });

    it('returns null on a page with no profile link at all', () => {
        const doc = render('<main><button aria-expanded="false">More</button></main>');
        expect(findAnchorButton(doc, PROFILE_PATH)).toBeNull();
    });

    it('tolerates a malformed href without throwing', () => {
        const doc = render('<div><a href="http://[malformed">x</a></div>');
        expect(() => findAnchorButton(doc, PROFILE_PATH)).not.toThrow();
    });
});

describe('the overflow menu as fallback', () => {
    // Profiles you are not connected to have no Message button. The header is
    // still findable, and the overflow menu is still there to sit beside.
    it('falls back to the aria-expanded button when there is no compose link', () => {
        const doc = render(`
      <div class="hashed">
        <a href="${PROFILE_PATH}/"><div aria-label="Paul"><p>Paul</p></div></a>
        <div class="hashed">
          <div data-display-contents="true">
            <button type="button" aria-label="More" aria-expanded="false"></button>
          </div>
        </div>
      </div>`);

        const anchor = findAnchorButton(doc, PROFILE_PATH);
        expect(anchor?.tagName).toBe('BUTTON');
        expect(anchor?.getAttribute('aria-expanded')).toBe('false');
    });
});

/**
 * Where the button actually lands.
 *
 * These exist because of a bug that shipped: the insertion block referenced
 * `entryPointWrapper`, left behind when the dead `.entry-point` lookup that
 * defined it was removed. It threw a ReferenceError on every observer tick,
 * before the insert, so no user ever saw the button — while the anchor-finding
 * tests right above this all passed. Finding the right element and putting
 * something next to it are two claims, and only one of them was tested.
 *
 * The second half is subtler and would have survived fixing the ReferenceError
 * on its own: the old fallback appended to `anchor.parentElement`, which is the
 * [data-display-contents] slot — the very wrapper findActionContainer climbs
 * past. `display: contents` means that slot has no box, so a button inside it
 * inherits the neighbouring action's layout instead of sitting beside it.
 */
describe('findInsertionReference', () => {
    it('returns the display-contents slot, not the anchor', () => {
        const doc = render(HEADER_FIXTURE);
        const anchor = findAnchorButton(doc, PROFILE_PATH);
        expect(anchor).not.toBeNull();

        const reference = findInsertionReference(anchor!);
        expect(reference).not.toBe(anchor);
        expect(reference.hasAttribute('data-display-contents')).toBe(true);
    });

    // The invariant the two functions have to share. If this breaks,
    // insertAdjacentElement puts the button somewhere nobody intended.
    it('is a direct child of the container findActionContainer returns', () => {
        const doc = render(HEADER_FIXTURE);
        const anchor = findAnchorButton(doc, PROFILE_PATH);
        const container = findActionContainer(anchor!);

        expect(findInsertionReference(anchor!).parentElement).toBe(container);
    });

    // Without a slot there is nothing to climb to, and the anchor is already a
    // direct child of the container. Same invariant, other branch.
    it('falls back to the anchor when there is no slot', () => {
        const doc = render(`
      <div class="hashed">
        <a href="${PROFILE_PATH}/"><p>Paul</p></a>
        <div class="hashed">
          <a href="/messaging/compose/?profileUrn=urn%3Ali%3Afsd_profile%3AABC"><span>Message</span></a>
        </div>
      </div>`);

        const anchor = findAnchorButton(doc, PROFILE_PATH);
        const reference = findInsertionReference(anchor!);

        expect(reference).toBe(anchor);
        expect(reference.parentElement).toBe(findActionContainer(anchor!));
    });

    // The end result, asserted on the DOM rather than on the helper: the button
    // is a sibling of the other actions, and is not swallowed by one of them.
    it('places the button in the action row, beside the other actions', () => {
        const doc = render(HEADER_FIXTURE);
        const anchor = findAnchorButton(doc, PROFILE_PATH);
        const container = findActionContainer(anchor!);
        const reference = findInsertionReference(anchor!);

        const button = doc.createElement('button');
        button.id = 'crm-add-button';
        reference.after(button);

        expect(button.parentElement).toBe(container);
        expect(anchor!.contains(button)).toBe(false);

        // Not swallowed by one of the row's action slots - the failure mode the
        // old appendChild fallback produced.
        //
        // Asserted against the row's own slots rather than with
        // closest('[data-display-contents]'), which was the first version of
        // this line and was simply wrong: the whole header card sits inside a
        // display-contents wrapper of its own, so closest() always finds an
        // ancestor and the assertion could never pass. What matters is the
        // sibling slots, not the ancestor.
        const actionSlots = Array.from(
            container!.querySelectorAll(':scope > [data-display-contents]')
        );
        expect(actionSlots.length).toBeGreaterThan(0);
        expect(actionSlots.some((slot) => slot.contains(button))).toBe(false);
    });
});
