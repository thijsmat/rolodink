import { describe, expect, it } from 'vitest';
import contentSource from './main.js?raw';

/**
 * The class names that stopped existing, guarded against coming back.
 *
 * Behavioural tests cover what the code does against two real captures. They
 * cannot catch a *new* selector written against markup that no longer exists,
 * because a selector that matches nothing simply makes the feature quietly do
 * nothing - which is precisely the failure this whole workstream is about. Four
 * separate rounds of browser testing were spent on variations of it.
 *
 * Source text is the right tool for that: it fails the moment someone reaches
 * for one of these names, with a message saying why they are dead.
 */

const code = contentSource
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/.*$/gm, '');

/**
 * Every one of these returned zero matches on a live profile in August 2026,
 * measured rather than assumed - see the table in PR #47.
 */
const DEAD_SELECTORS = [
    'pv-top-card',
    'artdeco-button',
    'dist-value',
    'entry-point',
    'scaffold-layout__main',
    'scaffold-layout__sticky-content',
    'js-sticky-header',
    'ph5',
];

describe('LinkedIn class names are not matched on', () => {
    // They are per-build hashes now (_5b9e836c dba5af58 ...), so matching on
    // them is matching on LinkedIn's bundler output. anchors.ts matches on
    // meaning instead: where a link goes, what a button does.
    it.each(DEAD_SELECTORS)('does not use %s', (selector) => {
        expect(code).not.toContain(selector);
    });

    // The Message action is an <a href="/messaging/compose/..."> with no
    // aria-label. This selector could never have matched it, class names or no
    // class names, and it survived for months because it failed silently.
    it('does not look for a Message button by aria-label', () => {
        expect(code).not.toMatch(/aria-label\*?=["'][^"']*(Message|Bericht)/);
    });

    // offsetHeight is 0 for every element under jsdom, so a size heuristic
    // cannot be tested here at all. It was used to tell the profile card from
    // the sticky header; document order does that now, and can be verified.
    it('does not measure element height', () => {
        expect(code).not.toContain('offsetHeight');
    });
});

/**
 * Where the note card is inserted, guarded at the call site.
 *
 * anchors.test.ts proves findCardInsertionPoint returns the right node. It
 * cannot prove main.js uses it: swapping the call back for `actionsContainer`
 * left all 62 behavioural tests green while reintroducing the exact layout bug
 * a screenshot had just shown - the card floating over the navigation bar.
 *
 * That gap is the same one that let `entryPointWrapper` ship: the finder was
 * tested, the use of it was not.
 */
describe('the note card goes below the header, not into the action row', () => {
    it('inserts relative to the header', () => {
        expect(code).toMatch(/findCardInsertionPoint\(topCard\)/);
    });

    it('does not insert the card relative to the action row', () => {
        // The action row is a flex container. A card inserted as its sibling
        // becomes a flex item and lays out as one more button.
        expect(code).not.toMatch(/actionsContainer\.(after|before|insertAdjacentElement)\b/);
    });
});

/**
 * SPA navigation handling, guarded at the call site.
 *
 * Same reasoning as the card-insertion guard above: navigation.test.ts proves
 * removeInjectedElements works, and cannot prove main.js calls it when the
 * path changes. Without these, deleting the teardown block leaves every
 * behavioural test green while profile B inherits profile A's button and note
 * card - stale state that saves one person's note onto another's connection.
 */
describe('SPA navigation is handled', () => {
    it('tears down old injections when the path changes', () => {
        expect(code).toMatch(/removeInjectedElements\(document\)/);
        expect(code).toMatch(/activeProfilePath/);
    });

    it('does nothing off profile pages', () => {
        // The observer now runs on the feed - LinkedIn's noisiest page - so the
        // early return on a null path is what keeps it cheap there.
        expect(code).toMatch(/if \(!path\) return;/);
    });
});

/**
 * Injection is document-wide, guarded at the call site.
 *
 * The sticky header and the hero are both action rows for the same profile, so
 * a per-container check let each of them get its own "Add to Rldnk" button.
 * Behavioural tests cannot catch that: each injection is individually correct.
 */
describe('only one button and one card exist at a time', () => {
    it('checks for an existing button across the document', () => {
        expect(code).toMatch(/getElementById\('crm-add-button'\)/);
        // container.querySelector("#crm-add-button") was the per-container
        // check that allowed a second button.
        expect(code).not.toMatch(/container\.querySelector\(["']#crm-add-button/);
    });

    it('moves a misplaced card rather than leaving it behind', () => {
        // Moved, not recreated: the textarea keeps what the user typed.
        expect(code).toMatch(/topCard\.after\(card\)/);
    });
});

describe('injection keeps checking after the page goes quiet', () => {
    // The failure these guard against is invisible in behavioural tests: every
    // injection function can be correct and the feature still does nothing,
    // because nothing calls them at the moment the DOM is finally right. That
    // is what happened - the button landed in the 49px sticky header and stayed
    // there, while a hand-run probe seconds later found the hero without
    // trouble. See scheduler.ts.

    it('drives injection from the scheduler, not from a self-clearing lock', () => {
        expect(code).toContain('createInjectionScheduler');
        // `let isChecking = false` with `if (isChecking) return;` throws away
        // every observer callback that arrives during the lock window, and the
        // last mutations of a render burst are exactly the ones that arrive
        // there.
        expect(code).not.toMatch(/isChecking/);
    });

    it('does not treat the MutationObserver as the only clock', () => {
        // If checkAndInject is called straight from the observer callback then
        // a page that stops mutating stops being checked.
        expect(code).not.toMatch(/new MutationObserver\(\(\) => \{\s*checkAndInject\(\)/);
        expect(code).toMatch(/new MutationObserver\(\(\) => \{\s*scheduler\.request\(\)/);
    });

    it('gives the runtime message a deadline', () => {
        // A promise that never settles blocks the scheduler's next round for
        // good, and an MV3 worker can die between send and reply.
        expect(code).toContain('RUNTIME_MESSAGE_TIMEOUT_MS');
    });
});
