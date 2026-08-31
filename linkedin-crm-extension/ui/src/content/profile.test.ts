import { beforeEach, describe, expect, it } from 'vitest';
import {
    NAME_SELECTORS,
    extractRawProfileName,
    findProfileNameInDocument,
    findProfileNameInTitle,
} from './profile';

beforeEach(() => {
    document.body.innerHTML = '';
});

describe('findProfileNameInDocument', () => {
    it.each(NAME_SELECTORS)('finds the name via %s', (selector) => {
        // Build an element that matches this selector and nothing earlier in
        // the list, so each entry is exercised on its own rather than every
        // case being answered by the first one.
        const tag = selector.startsWith('h1') ? 'h1' : 'div';
        const attrs = selector.includes('data-test-id') ? ' data-test-id="profile-name"' : '';
        const classes = selector
            .split('.')
            .slice(1)
            .join(' ');
        const classAttr = classes ? ` class="${classes}"` : '';
        document.body.innerHTML = `<${tag}${attrs}${classAttr}>Tim Jansen</${tag}>`;

        expect(findProfileNameInDocument(document)).toBe('Tim Jansen');
    });

    it('prefers the earlier selector when several match', () => {
        document.body.innerHTML = `
            <div data-test-id="profile-name">Right</div>
            <h1>Wrong</h1>`;
        expect(findProfileNameInDocument(document)).toBe('Right');
    });

    it('trims surrounding whitespace', () => {
        document.body.innerHTML = '<h1>\n   Tim Jansen \n</h1>';
        expect(findProfileNameInDocument(document)).toBe('Tim Jansen');
    });

    it('skips an element that matches but is empty', () => {
        // A header LinkedIn has started but not filled in yet. Returning ''
        // from the first match would stop the search on a page where the name
        // is sitting in the next candidate.
        document.body.innerHTML = `
            <h1 data-test-id="profile-name">   </h1>
            <h1 class="text-heading-xlarge">Tim Jansen</h1>`;
        expect(findProfileNameInDocument(document)).toBe('Tim Jansen');
    });

    it('returns an empty string when nothing matches', () => {
        // Not an error: the header renders progressively, so this happens on
        // the way to a page that will be fine a moment later.
        document.body.innerHTML = '<main><p>feed</p></main>';
        expect(findProfileNameInDocument(document)).toBe('');
    });
});

describe('findProfileNameInTitle', () => {
    it.each([
        ['Tim Jansen | LinkedIn', 'Tim Jansen'],
        ['Tim Jansen | CEO at Bonsai | LinkedIn', 'Tim Jansen'],
        ['Tim Jansen', 'Tim Jansen'],
        ['(3) Tim Jansen | LinkedIn', '(3) Tim Jansen'],
        ['LinkedIn', ''],
        ['', ''],
    ])('reads %j as %j', (title, expected) => {
        expect(findProfileNameInTitle(title)).toBe(expected);
    });

    it('leaves the notification count alone', () => {
        // cleanProfileName in @rolodink/core strips it, and it is tested there
        // against a few hundred generated probes. Doing it twice would mean two
        // implementations to keep in step.
        expect(findProfileNameInTitle('(12) Tim Jansen | LinkedIn')).toBe('(12) Tim Jansen');
    });
});

describe('extractRawProfileName', () => {
    it('prefers the document over the title', () => {
        document.body.innerHTML = '<h1>From the page</h1>';
        expect(extractRawProfileName(document, 'From the title | LinkedIn')).toBe('From the page');
    });

    it('falls back to the title when no selector matches', () => {
        document.body.innerHTML = '<main><p>feed</p></main>';
        expect(extractRawProfileName(document, 'Tim Jansen | LinkedIn')).toBe('Tim Jansen');
    });

    it('returns an empty string when both come up empty', () => {
        expect(extractRawProfileName(document, '')).toBe('');
    });
});
