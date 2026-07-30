/**
 * Profile name cleaning.
 *
 * LinkedIn renders unread counters into the text node the extension scrapes for
 * a contact's name. Left alone, a contact gets stored as "(3) Jan Jansen" and
 * that count is frozen into the database forever.
 *
 * Three copies of this function exist today - `linkedin-crm-extension/content.js`,
 * `content-firefox.js` and the backend's `connections/route.ts` - and not one of
 * them is covered by a test. This is the single implementation they will all
 * collapse onto.
 *
 * It is a faithful port, not an improvement: same four patterns, same order,
 * same whitespace handling, and deliberately the same bugs. `name.test.ts`
 * proves the fidelity by reading the three legacy sources off disk and
 * checking that each of their patterns behaves identically to the one below in
 * the same position, so "identical" is verified rather than asserted here.
 *
 * Known defects, preserved on purpose - each is pinned by a test:
 *
 *  - A name that legitimately begins with digits loses them. "50 Cent" becomes
 *    "Cent"; "3 Doors Down" becomes "Doors Down". Pattern 2 strips leading
 *    digits unconditionally, without requiring a counter-like separator after
 *    them.
 *  - Pattern 2's character class `[.|·•:-]` contains a literal `|`. Inside a
 *    character class that is the pipe character, not alternation - almost
 *    certainly a typo for an alternation that was never written.
 *
 * Fixing either changes what gets written to the database for real contacts, so
 * it belongs in its own change with its own review rather than smuggled in
 * under a refactor.
 */

/**
 * The counter-stripping patterns, in the order they are applied.
 *
 * Order is load-bearing: the leading-counter pattern runs before the
 * leading-digit pattern, so "(1) 2 Chainz" loses the counter first and the
 * digit pattern then eats the "2".
 *
 * The legacy copies spell these classes with redundant escapes - `[\(\[\{]`
 * where `[([{]` says the same thing. That spelling is not reproduced here, so
 * the fidelity test in `name.test.ts` compares behaviour rather than text: it
 * runs each legacy pattern and its counterpart here over a shared corpus and
 * requires identical output. Equivalence was also checked separately across
 * ~2100 inputs per pattern before the escapes were dropped.
 *
 * A factory rather than a module-level array, for the same reason all three
 * legacy copies build this list inside the function: the last pattern carries
 * the `g` flag, and a shared `g` regex keeps its `lastIndex` between uses. That
 * is harmless with `String#replace`, which resets it, and a trap for anything
 * that later reaches for `test()` or `exec()` - those would start mid-string on
 * every other call. Hoisting it to module scope to save four allocations was an
 * optimisation that bought nothing and left a hazard behind.
 *
 * Not exported: the fidelity test compares whole-function output, not
 * individual patterns.
 */
function counterPatterns(): RegExp[] {
    return [
        // Leading counters: (1) [2] {3}
        /^[\s\u00A0]*[([{]\s*\d+\s*[)\]}]\s*/,
        // Leading numbers like: 1 John, 12· John, 3. John
        /^[\s\u00A0]*\d+[\s\u00A0]*[.|·•:-]*[\s\u00A0]*/,
        // Trailing counters at end: John Doe (1)
        /[([{]\s*\d+\s*[)\]}]\s*$/,
        // Inline counters: John (1) Doe
        /[([{]\s*\d+\s*[)\]}]/g,
    ];
}

/**
 * Strips LinkedIn notification counters from a scraped profile name.
 *
 * Falsy input is returned unchanged rather than coerced, matching all three
 * legacy implementations: callers rely on a missing name staying falsy so that
 * their own "could not find a name" guard fires.
 */
export function cleanProfileName(name: string): string {
    if (!name) return name;

    // Non-breaking spaces first: LinkedIn emits them between the counter and
    // the name, and every pattern below would otherwise have to handle both.
    let cleaned = name.replaceAll('\u00A0', ' ');

    for (const pattern of counterPatterns()) {
        cleaned = cleaned.replace(pattern, ' ');
    }

    // Each removal above substitutes a space rather than an empty string, so
    // collapsing runs and trimming is what actually produces the final form.
    return cleaned.replace(/\s+/g, ' ').trim();
}
