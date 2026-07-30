import { readFileSync } from 'node:fs';
import { describe, it, expect } from 'vitest';
import { cleanProfileName, COUNTER_PATTERN_SOURCES } from './name.js';

const NBSP = '\u00A0';

describe('cleanProfileName', () => {
    it('leaves an ordinary name alone', () => {
        expect(cleanProfileName('Jan Jansen')).toBe('Jan Jansen');
    });

    it.each([
        ['parenthesised', '(3) Jan Jansen'],
        ['square bracketed', '[3] Jan Jansen'],
        ['braced', '{3} Jan Jansen'],
        ['double digit', '(12) Jan Jansen'],
        ['padded inside the bracket', '( 3 ) Jan Jansen'],
        ['NBSP after the counter', `(3)${NBSP}Jan Jansen`],
        ['NBSP before the counter', `${NBSP}(3) Jan Jansen`],
        ['trailing', 'Jan Jansen (3)'],
        ['inline', 'Jan (3) Jansen'],
        ['both ends', '(3) Jan Jansen (3)'],
    ])('strips a %s counter', (_label, input) => {
        expect(cleanProfileName(input)).toBe('Jan Jansen');
    });

    it.each([
        ['bare leading digit', '3 Jan Jansen'],
        ['digit with a dot', '3. Jan Jansen'],
        ['digit with a middot', `12${NBSP}· Jan Jansen`],
        ['digit with a bullet', '7 • Jan Jansen'],
        ['digit with a colon', '7: Jan Jansen'],
        ['digit with a dash', '7 - Jan Jansen'],
    ])('strips a %s prefix', (_label, input) => {
        expect(cleanProfileName(input)).toBe('Jan Jansen');
    });

    it('collapses whitespace runs and trims', () => {
        expect(cleanProfileName('  Jan   Jansen  ')).toBe('Jan Jansen');
    });

    it('normalises non-breaking spaces inside the name', () => {
        expect(cleanProfileName(`Jan${NBSP}Jansen`)).toBe('Jan Jansen');
    });

    it('returns falsy input unchanged', () => {
        // Callers guard on falsiness to decide whether they found a name at
        // all, so '' must not become something truthy.
        expect(cleanProfileName('')).toBe('');
    });

    it('does not touch digits that are not leading or bracketed', () => {
        expect(cleanProfileName('Jan Jansen 3rd')).toBe('Jan Jansen 3rd');
        expect(cleanProfileName('Jan Jansen III')).toBe('Jan Jansen III');
    });

    it('is idempotent', () => {
        // The extension can re-clean a name it already stored, so a second pass
        // must be a no-op rather than eating another character.
        for (const input of ['(3) Jan Jansen', 'Jan Jansen', '50 Cent', '3 Doors Down']) {
            const once = cleanProfileName(input);
            expect(cleanProfileName(once)).toBe(once);
        }
    });

    it('never throws, whatever the input looks like', () => {
        for (const input of ['(', ')', '((((', '(1', '1)', '()', '( )', '-', '·', '   ', '\u00A0']) {
            expect(() => cleanProfileName(input)).not.toThrow();
        }
    });

    it('the global inline pattern is not left stateful between calls', () => {
        // COUNTER_PATTERNS[3] carries the /g flag and is module-level, so it is
        // shared across calls. String#replace resets lastIndex, but if that
        // pattern is ever used with .test() or .exec() this test fails first.
        const input = 'Jan (3) Jansen';
        expect(cleanProfileName(input)).toBe('Jan Jansen');
        expect(cleanProfileName(input)).toBe('Jan Jansen');
        expect(cleanProfileName(input)).toBe('Jan Jansen');
    });
});

describe('cleanProfileName: known defects, pinned deliberately', () => {
    // These assertions describe what the function does today across all four
    // copies, not what it should do. They exist so that fixing the bug is a
    // visible, reviewed diff in this file rather than a silent change to what
    // gets written to real contacts.

    it.each([
        ['50 Cent', 'Cent'],
        ['3 Doors Down', 'Doors Down'],
        ['21 Savage', 'Savage'],
        ['112', ''],
    ])('eats the leading digits of %j, giving %j', (input, expected) => {
        expect(cleanProfileName(input)).toBe(expected);
    });

    it('treats the | in the separator class as a literal pipe, not alternation', () => {
        // `[\.|·•:\-]` was almost certainly meant to be an alternation. As a
        // character class it happens to also match a literal '|', which is why
        // this input cleans at all.
        expect(cleanProfileName('1 | Jan Jansen')).toBe('Jan Jansen');
    });
});

/**
 * Fidelity check against the implementations this one replaces.
 *
 * `cleanProfileName` is copy-pasted into three places today. Moving it here is
 * only safe if the move is exact, so rather than claiming the copies match,
 * this reads them off disk and compares the patterns directly. No code is
 * duplicated into this file and nothing is executed from those sources - the
 * regex literals are extracted as text.
 *
 * These copies are scheduled for deletion (the extension bundles core, then the
 * backend imports it). When the last one goes, this block fails with a clear
 * message: that is the signal to delete it, not to repair it.
 */
const LEGACY_SOURCES = [
    ['content.js', '../../../linkedin-crm-extension/content.js'],
    ['content-firefox.js', '../../../linkedin-crm-extension/content-firefox.js'],
    ['backend connections route', '../../../linkedin-crm-backend/src/app/api/connections/route.ts'],
] as const;

/**
 * Pulls the four regex literals out of a legacy `cleanProfileName`.
 *
 * Deliberately narrow: it locates the `patterns` array inside the function and
 * takes the lines that are regex literals. If the shape changes enough that
 * this stops working, the extraction throws rather than silently returning
 * fewer patterns and passing a weaker comparison.
 */
function extractLegacyPatternSources(relativePath: string): string[] {
    const source = readFileSync(new URL(relativePath, import.meta.url), 'utf8');

    const functionStart = source.indexOf('function cleanProfileName(');
    if (functionStart === -1) {
        throw new Error(
            `cleanProfileName not found in ${relativePath}. If the copy was removed ` +
                'because the caller now imports @rolodink/core, delete this fidelity ' +
                'check along with it.',
        );
    }

    const arrayStart = source.indexOf('[', source.indexOf('patterns', functionStart));
    const arrayEnd = source.indexOf('];', arrayStart);
    if (arrayStart === -1 || arrayEnd === -1) {
        throw new Error(`Could not locate the patterns array in ${relativePath}`);
    }

    const patterns = source
        .slice(arrayStart + 1, arrayEnd)
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line.startsWith('/') && !line.startsWith('//'))
        // Strip the trailing comma and the surrounding slashes/flags to leave
        // exactly what RegExp#source returns.
        .map((line) => {
            const withoutComma = line.replace(/,$/, '');
            const match = /^\/(.*)\/[a-z]*$/.exec(withoutComma);
            if (!match?.[1]) throw new Error(`Unparseable regex literal in ${relativePath}: ${line}`);
            return match[1];
        });

    if (patterns.length !== 4) {
        throw new Error(
            `Expected 4 patterns in ${relativePath}, found ${patterns.length}. ` +
                'The legacy copy has diverged - reconcile it with name.ts before trusting this move.',
        );
    }

    return patterns;
}

describe('fidelity against the copies this replaces', () => {
    it.each(LEGACY_SOURCES)('%s uses exactly the same patterns, in the same order', (_label, path) => {
        expect(extractLegacyPatternSources(path)).toEqual([...COUNTER_PATTERN_SOURCES]);
    });

    it.each(LEGACY_SOURCES)('%s normalises NBSP and collapses whitespace the same way', (_label, path) => {
        const source = readFileSync(new URL(path, import.meta.url), 'utf8');
        const start = source.indexOf('function cleanProfileName(');
        const body = source.slice(start, start + 1500);

        // The two operations that bracket the pattern loop. Together with the
        // pattern comparison above, this covers every line of the function that
        // affects the result.
        expect(body).toContain(String.raw`replace(/\u00A0/g, ' ')`);
        expect(body).toContain(String.raw`replace(/\s+/g, ' ')`);
        expect(body).toContain('.trim()');
    });

    it.each(LEGACY_SOURCES)('%s substitutes a space, not an empty string', (_label, path) => {
        // Replacing with '' instead of ' ' would join words together, so this
        // is the one detail in the loop worth checking explicitly.
        const source = readFileSync(new URL(path, import.meta.url), 'utf8');
        const start = source.indexOf('function cleanProfileName(');
        expect(source.slice(start, start + 1500)).toContain("replace(pattern, ' ')");
    });
});
