/**
 * Finding the profile header and the button to hang "Add to Rldnk" next to.
 *
 * This exists because the previous approach stopped working entirely, silently,
 * for every user. It matched on LinkedIn's class names — `.pv-top-card`,
 * `.artdeco-button--primary`, `.dist-value`, `.entry-point` — and as of the
 * August 2026 redesign every one of those returns zero matches. Class names are
 * now per-build hashes (`_5b9e836c dba5af58 ca4a9293 …`), so matching on them is
 * matching on LinkedIn's bundler output. That will keep breaking.
 *
 * A second, more embarrassing failure hid behind the first: the Message action
 * is no longer a `<button>` at all. It is
 *
 *     <a href="/messaging/compose/?profileUrn=…"><span>Message</span></a>
 *
 * with no aria-label. `button[aria-label*='Message']` could never have matched
 * it, class names or no class names.
 *
 * So this module matches on meaning instead:
 *
 *  - the header is the card containing a link to the profile you are *currently
 *    looking at*, which distinguishes it from every "people also viewed" card
 *    linking somewhere else;
 *  - the action to sit beside is identified by where it goes (a messaging
 *    compose URL) or by what it does (an aria-expanded overflow menu), never by
 *    its label. Both are locale-independent, which the old "Message"/"Bericht"
 *    list was not.
 *
 * The fixtures in __fixtures__ are real captures. See the README there.
 */

/**
 * Actions to anchor beside, best first.
 *
 * Deliberately no text matching. The previous list carried "Message", "Bericht",
 * "InMail", "Contact", "Connect" and "Follow", which meant it also matched the
 * "Follow <someone else>" buttons in the sidebar — and missed anyone browsing
 * LinkedIn in a language nobody had thought of.
 */
const ACTION_SELECTORS = [
    // A compose link points at this person's inbox. Locale-independent and
    // about as semantically stable as LinkedIn gets.
    'a[href*="/messaging/compose/"]',
    // The overflow menu. Present even on profiles with no Message button, e.g.
    // people you are not connected to.
    'button[aria-expanded]',
] as const;

/** How far to climb from the profile link before giving up. */
const MAX_CLIMB = 6;

/**
 * The path of the profile being viewed, without a trailing slash:
 * "/in/paul-christian-gevaerts-aba21143".
 *
 * Returns null off a profile page, which is the caller's signal to do nothing —
 * the manifest restricts injection to /in/*, but LinkedIn's own router can move
 * the URL under a content script that is already running.
 */
export function currentProfilePath(pathname: string): string | null {
    const match = /^\/in\/[^/?#]+/.exec(pathname);
    return match ? match[0] : null;
}

function linkTargetsProfile(element: Element, profilePath: string): boolean {
    const href = element.getAttribute('href');
    if (!href) return false;
    let pathname: string;
    try {
        // Base only matters for relative hrefs; absolute ones ignore it.
        pathname = new URL(href, 'https://www.linkedin.com').pathname;
    } catch {
        return false;
    }
    return withoutTrailingSlashes(pathname) === profilePath;
}

/**
 * An index walk rather than /\/+$/, which backtracks super-linearly on a long
 * run of slashes (SonarCloud S8786). This runs over every anchor on the page on
 * every MutationObserver tick, so linear matters more here than it did in
 * core's api.ts, where the same substitution was made for the same reason.
 *
 * Compared exactly rather than by prefix on purpose: `/in/foo/recent-activity/`
 * also starts with the profile path, sits on the same page, and is not the
 * header. Climbing from it would find a different container.
 */
function withoutTrailingSlashes(value: string): string {
    let end = value.length;
    while (end > 0 && value.codePointAt(end - 1) === 47 /* '/' */) {
        end--;
    }
    return value.slice(0, end);
}

function containsAction(element: Element): boolean {
    return ACTION_SELECTORS.some((selector) => element.querySelector(selector) !== null);
}

/**
 * The card for the profile currently being viewed: it links to this profile and
 * carries at least one action.
 *
 * Both conditions are needed. The link alone also matches the avatar in the
 * sticky header and any "you appeared in searches" teaser; the action alone
 * matches half the page.
 *
 * Known limit: on a page rendering both the header and a sticky duplicate, this
 * returns whichever comes first in the document. There is no class name left to
 * tell them apart and no layout to measure outside a real browser, so document
 * order is the honest answer rather than a guess dressed up as a heuristic.
 */
export function findProfileHeader(root: ParentNode, profilePath: string): HTMLElement | null {
    const links = Array.from(root.querySelectorAll('a[href]'));
    for (const link of links) {
        if (!linkTargetsProfile(link, profilePath)) continue;
        let node = link.parentElement;
        for (let depth = 0; node && depth < MAX_CLIMB; depth++, node = node.parentElement) {
            if (containsAction(node)) return node;
        }
    }
    return null;
}

/**
 * The element to insert the Rolodink button after, or null when the header
 * cannot be found — which the caller should log rather than swallow. A silent
 * null here is exactly how this breakage went unnoticed for so long.
 */
export function findAnchorButton(root: ParentNode, profilePath: string): HTMLElement | null {
    const header = findProfileHeader(root, profilePath);
    if (!header) return null;
    for (const selector of ACTION_SELECTORS) {
        const candidate = header.querySelector(selector);
        if (candidate instanceof HTMLElement) return candidate;
    }
    return null;
}

/**
 * The row that holds the profile's action buttons, so a new one lands beside
 * them rather than inside one of them.
 *
 * LinkedIn wraps each action in a `[data-display-contents]` div — a marker for
 * `display: contents`, so the wrapper has no box of its own and the buttons lay
 * out as if they were direct children. Inserting into that wrapper would put our
 * button inside another button's slot; the row is one level further up.
 */
export function findActionContainer(anchor: HTMLElement): HTMLElement | null {
    const slot = anchor.closest('[data-display-contents]');
    const container = slot?.parentElement ?? anchor.parentElement;
    return container instanceof HTMLElement ? container : null;
}

/**
 * The node to insert our button after: the anchor's `[data-display-contents]`
 * slot when it has one, otherwise the anchor itself.
 *
 * This is the other half of findActionContainer, and it has to agree with it.
 * The container is the slot's *parent*, so the anchor is a grandchild of it —
 * meaning `container.insertBefore(button, anchor)` throws NotFoundError and
 * `anchor.parentElement.appendChild(button)` quietly puts our button inside
 * another action's slot, where `display: contents` makes it inherit that
 * action's layout box.
 *
 * Returning the slot fixes both: it is a direct child of the container, so
 * inserting after it lands the button in the row, beside the other actions.
 *
 * The caller must still check that the result's parent really is the container
 * before inserting after it — see main.js. A null parent is possible on a node
 * LinkedIn has detached between the query and the insert.
 */
export function findInsertionReference(anchor: HTMLElement): HTMLElement {
    const slot = anchor.closest('[data-display-contents]');
    return slot instanceof HTMLElement ? slot : anchor;
}

/**
 * Class names to reuse for a button label, taken from a neighbouring action.
 *
 * Copying the anchor's own className onto a bare `<button>` is not enough, which
 * a screenshot made obvious: the new button had the right box but its label
 * rendered as small grey text next to a properly styled Message button. The
 * typography lives on nested spans, not on the outer element:
 *
 *     <a class="OUTER">
 *       <span class="WRAPPER">        <- padding, alignment, icon slot
 *         <svg/>
 *         <span class="TEXT">Message</span>   <- font, size, colour
 *       </span>
 *     </a>
 *
 * Both are per-build hashes, so they are read off the live neighbour rather than
 * written down anywhere. Returns empty strings when the anchor has no such
 * structure - the overflow menu has a wrapper but no text span, because its
 * content is an icon - and an empty className is harmless.
 */
export function findLabelClassNames(anchor: HTMLElement): { wrapper: string; text: string } {
    const wrapper = anchor.querySelector(':scope > span');
    if (!(wrapper instanceof HTMLElement)) return { wrapper: '', text: '' };

    const text = Array.from(wrapper.querySelectorAll(':scope > span')).find(
        (span) => (span.textContent ?? '').trim().length > 0
    );

    return {
        wrapper: wrapper.className,
        text: text instanceof HTMLElement ? text.className : '',
    };
}

/**
 * Where a block-level card belongs: after the whole profile header, not after
 * the action row.
 *
 * The note card used to be inserted with `actionsContainer.after(card)`, which
 * made it a sibling of the action buttons *inside* the row. The row is a flex
 * container, so the card became a flex item and rendered as a floating panel
 * beside the buttons, overlapping the navigation bar. It looked like a CSS bug
 * and was a DOM-structure bug.
 *
 * A card belongs below the header as a whole. Returns null when the header has
 * no parent to insert into, which the caller should report rather than swallow.
 */
export function findCardInsertionPoint(header: HTMLElement): HTMLElement | null {
    return header.parentElement ? header : null;
}

/**
 * Tears down everything this extension injected into the page.
 *
 * Needed since the manifest widened from /in/* to all of LinkedIn. The content
 * script used to be born and die with a profile document; under SPA navigation
 * it now lives across page changes, so moving from profile A to profile B - or
 * to the feed - leaves A's button and note card behind with A's state inside
 * them: a button claiming "Already added" about somebody else, a card holding
 * somebody else's note. Removing them lets the next observer tick re-inject
 * fresh for whatever the URL now shows.
 *
 * Returns how many elements were removed, so the caller can log a teardown
 * without logging the (constant) quiet case.
 */
const INJECTED_ELEMENT_IDS = ['crm-add-button', 'rolodink-context-field'] as const;

export function removeInjectedElements(root: ParentNode): number {
    let removed = 0;
    for (const id of INJECTED_ELEMENT_IDS) {
        // querySelectorAll rather than getElementById: duplicate ids are
        // invalid HTML but a re-render race can still produce them, and a
        // teardown that leaves one behind defeats its purpose.
        for (const element of Array.from(root.querySelectorAll(`#${id}`))) {
            element.remove();
            removed++;
        }
    }
    return removed;
}
