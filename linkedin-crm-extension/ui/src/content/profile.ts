/**
 * Reading the profile's name off the page.
 *
 * Lifted out of the "Add to Rldnk" click handler so the note card can use it
 * too: typing a note on a profile that is not in the CRM yet now adds it,
 * which needs a name the same way the button does. Two copies of a selector
 * chain against a site that rewrites its markup is how the August 2026
 * breakage happened in the first place.
 *
 * Being a module also makes it testable, which the inline version never was.
 * That matters here more than most places: this is a list of LinkedIn
 * selectors, and a selector that matches nothing does not raise anything - it
 * just quietly returns an empty name, and the feature declines to work.
 *
 * The name is returned raw. Cleaning it (stripping the "(3)" notification
 * count and friends) is cleanProfileName's job in @rolodink/core, where it is
 * tested against a few hundred generated probes. Keeping the split means this
 * module needs no imports beyond the DOM.
 */

/**
 * Where the name might be, best first.
 *
 * `h1` is deliberately in the middle rather than last: LinkedIn's own class
 * names are per-build hashes and go stale, but a profile page has exactly one
 * h1 and it is the person's name. The two `data-test-id` entries are the most
 * specific and the most likely to survive a restyle, so they lead.
 */
export const NAME_SELECTORS = [
    'h1[data-test-id="profile-name"]',
    '[data-test-id="profile-name"]',
    'h1.text-heading-xlarge',
    'h1.break-words',
    'h1',
    '.text-heading-xlarge',
] as const;

const textOf = (element: Element | null): string => {
    if (!(element instanceof HTMLElement)) return '';
    // textContent, not innerText: innerText is layout-dependent and returns ''
    // under jsdom, which would make every test here pass for the wrong reason.
    return (element.textContent ?? '').trim();
};

/** The name from the page body, or '' when no selector matches. */
export function findProfileNameInDocument(root: ParentNode): string {
    for (const selector of NAME_SELECTORS) {
        const found = textOf(root.querySelector(selector));
        if (found) return found;
    }
    return '';
}

/**
 * The name from the document title, the fallback for when every selector
 * misses. LinkedIn titles read "Tim Jansen | LinkedIn", sometimes with a
 * headline appended after a second separator - so only the first segment is
 * the name.
 */
export function findProfileNameInTitle(title: string): string {
    if (!title) return '';
    const [first] = title.split('|');
    return (first ?? '').replace(/\s*\|?\s*LinkedIn\s*$/i, '').trim();
}

/**
 * The profile's name, still uncleaned, or '' when the page yields nothing.
 *
 * An empty string is a real outcome and the caller must handle it: LinkedIn
 * renders the header progressively, so this can be called before the name
 * exists.
 */
export function extractRawProfileName(root: ParentNode, title: string): string {
    return findProfileNameInDocument(root) || findProfileNameInTitle(title);
}
