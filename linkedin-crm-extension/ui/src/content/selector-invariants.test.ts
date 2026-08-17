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
