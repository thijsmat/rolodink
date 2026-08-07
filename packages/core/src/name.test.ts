import { readFileSync } from 'node:fs';
import { describe, it, expect } from 'vitest';
import { cleanProfileName } from './name.js';

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
        // The inline pattern carries the /g flag. It is rebuilt per call now,
        // but this guards the invariant rather than the implementation: if it
        // ever becomes shared again, the second call here returns a different
        // result and this fails.
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
 * `cleanProfileName` is copy-pasted into the remaining legacy sources below. Moving it here is
 * only safe if the move is exact, so rather than claiming the copies match,
 * this reads them off disk and checks them.
 *
 * The comparison is end-to-end, and deliberately so. Two earlier versions of
 * this check were narrower and both were wrong:
 *
 *  - Comparing the regex *text* fails on spelling. The legacy copies write
 *    their character classes with redundant escapes (`[\(\[\{]` for `[([{]`),
 *    which is a difference that does not exist in behaviour.
 *  - Comparing each pattern's behaviour *individually* over-constrains. Two of
 *    the patterns here dropped a redundant leading `\s*` to remove super-linear
 *    backtracking; per-pattern they now differ from the legacy ones, while the
 *    function's output is unchanged, because every substitution inserts a space
 *    and the final collapse-and-trim absorbs it.
 *
 * What callers depend on is the output of `cleanProfileName`, so that is what
 * is compared: the legacy patterns are extracted, run through the legacy
 * algorithm, and the result must equal ours for every probe. The algorithm is
 * reconstructed rather than assumed - the structural assertions below pin the
 * three operations that surround the pattern loop in each legacy copy.
 *
 * Nothing from those sources is executed as code; only the regex literals are
 * rebuilt.
 *
 * These copies are scheduled for deletion (the extension bundles core, then the
 * backend imports it). When the last one goes, this block fails with a clear
 * message: that is the signal to delete it, not to repair it.
 */
// content.js is gone from this list: the bundled content script imports
// cleanProfileName from this package (PR 4), so there is no copy left to
// compare against. The remaining two disappear with the Firefox unification
// and the backend import; when the last one goes, delete this block.
const LEGACY_SOURCES = [
    ['content-firefox.js', '../../../linkedin-crm-extension/content-firefox.js'],
    ['backend connections route', '../../../linkedin-crm-backend/src/app/api/connections/route.ts'],
] as const;

/**
 * Inputs the two implementations are compared over.
 *
 * Built by combining every character the four patterns mention, so a class that
 * gained or lost a member shows up as a difference rather than slipping past a
 * hand-picked list.
 */
const PROBES: string[] = (() => {
    const atoms = ['(', ')', '[', ']', '{', '}', '(3)', '[12]', '{7}', '( 3 )', '.', '|', '·', '•', ':', '-',
        '0', '5', '12', ' ', NBSP, '  ', '\t', 'Jan', 'Jansen', ''];
    const probes = new Set<string>();
    for (const a of atoms) {
        for (const b of atoms) {
            for (const middle of ['', ' ', 'Jan', '(1)']) probes.add(a + middle + b);
        }
    }
    for (const realistic of [
        '(3) Jan Jansen',
        'Jan Jansen (3)',
        'Jan (3) Jansen',
        '(3) Jan Jansen (3)',
        `${NBSP}(3)${NBSP}Jan${NBSP}Jansen${NBSP}`,
        '50 Cent',
        '3 Doors Down',
        '112',
        '1 | Jan Jansen',
        'Jan Jansen 3rd',
        '(1)(2)(3)',
        'Jan (1) (2) Doe',
        '(12) Jan (3) Jansen (4)',
        'Jan   Jansen',
        '   ',
        '',
    ]) probes.add(realistic);
    return [...probes];
})();

/**
 * The legacy algorithm, driven by patterns lifted from a legacy file.
 *
 * The three operations around the loop - NBSP normalisation, substituting a
 * space rather than an empty string, and the closing collapse-and-trim - are
 * each asserted to exist in every legacy source further down, so this is a
 * reconstruction of those files rather than a guess at them.
 */
function legacyCleanProfileName(patterns: RegExp[], name: string): string {
    if (!name) return name;
    let cleaned = name.replace(/\u00A0/g, ' ');
    for (const pattern of patterns) cleaned = cleaned.replace(pattern, ' ');
    return cleaned.replace(/\s+/g, ' ').trim();
}

/**
 * Pulls the four regex literals out of a legacy `cleanProfileName`.
 *
 * Deliberately narrow: it locates the `patterns` array inside the function and
 * takes the lines that are regex literals. If the shape changes enough that
 * this stops working, the extraction throws rather than silently returning
 * fewer patterns and passing a weaker comparison.
 */
/**
 * The text of a legacy `cleanProfileName`, from its `function` keyword onwards.
 *
 * The window is generous rather than exact: every check below looks for a
 * substring, so overshooting into the next function is harmless while
 * undershooting would quietly weaken the assertion.
 */
function readLegacyFunction(relativePath: string): string {
    const source = readFileSync(new URL(relativePath, import.meta.url), 'utf8');
    const start = source.indexOf('function cleanProfileName(');

    if (start === -1) {
        throw new Error(
            `cleanProfileName not found in ${relativePath}. If the copy was removed ` +
                'because the caller now imports @rolodink/core, delete this fidelity ' +
                'check along with it.',
        );
    }

    return source.slice(start, start + 1500);
}

function extractLegacyPatterns(relativePath: string): RegExp[] {
    const source = readLegacyFunction(relativePath);

    const arrayStart = source.indexOf('[', source.indexOf('patterns'));
    const arrayEnd = source.indexOf('];', arrayStart);
    if (arrayStart === -1 || arrayEnd === -1) {
        throw new Error(`Could not locate the patterns array in ${relativePath}`);
    }

    const patterns = source
        .slice(arrayStart + 1, arrayEnd)
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line.startsWith('/') && !line.startsWith('//'))
        // Split the literal into source and flags and rebuild it, so the
        // comparison below runs the legacy pattern itself rather than a
        // paraphrase of it.
        .map((line) => {
            const withoutComma = line.replace(/,$/, '');
            const match = /^\/(.*)\/([a-z]*)$/.exec(withoutComma);
            if (!match?.[1]) throw new Error(`Unparseable regex literal in ${relativePath}: ${line}`);
            return new RegExp(match[1], match[2]);
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
    it.each(LEGACY_SOURCES)('%s still declares four patterns', (_label, path) => {
        // The reconstruction below depends on the shape; if a copy grows or
        // loses a pattern, the extraction is no longer modelling it.
        expect(extractLegacyPatterns(path)).toHaveLength(4);
    });

    it.each(LEGACY_SOURCES)('%s produces identical output for every probe', (_label, path) => {
        const legacyPatterns = extractLegacyPatterns(path);

        for (const probe of PROBES) {
            expect(legacyCleanProfileName(legacyPatterns, probe)).toBe(cleanProfileName(probe));
        }
    });

    it.each(LEGACY_SOURCES)('%s normalises NBSP and collapses whitespace the same way', (_label, path) => {
        const body = readLegacyFunction(path);

        // The operations bracketing the pattern loop. These are what make the
        // reconstruction in legacyCleanProfileName faithful rather than assumed.
        expect(body).toContain(String.raw`replace(/\u00A0/g, ' ')`);
        expect(body).toContain(String.raw`replace(/\s+/g, ' ')`);
        expect(body).toContain('.trim()');
    });

    it.each(LEGACY_SOURCES)('%s substitutes a space, not an empty string', (_label, path) => {
        // Replacing with '' instead of ' ' would join words together, so this
        // is the one detail in the loop worth checking explicitly.
        expect(readLegacyFunction(path)).toContain("replace(pattern, ' ')");
    });
});
