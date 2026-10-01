import { describe, expect, it } from 'vitest';
import contentSource from './main.js?raw';
import noteCardSource from './note-card.ts?raw';

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

// Bundled into the same content.js, so the platform rules hold for it too.
const noteCardCode = noteCardSource
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

    it('does not hold a round open while the note loads', () => {
        // checkAndInject used to await injectContextField, which awaited
        // attachNoteBehaviour, which awaited card.load(): a GET and a decrypt,
        // up to 15 s each. The scheduler starts no round while one runs, so
        // for that long nothing cleaned up after a navigation - profile A's
        // card stayed on profile B - and the card did not move from the
        // sticky header to the hero. The load now runs beside the round.
        expect(code).not.toMatch(/async function attachNoteBehaviour/);
        expect(code).not.toMatch(/await attachNoteBehaviour\(/);
        expect(code).not.toMatch(/await card\.load\(\)/);
        expect(code).toMatch(/card\.load\(\)\.catch\(/);
        // And an answer that arrives later is checked against the card's own
        // profile before anything is kept from it.
        expect(code).toMatch(/const note = await loadCardNote\(\);\s*(\/\/.*\s*)*if \(!stillOwned\(\)\) return note;/);
    });

    it('does not fall back to the live url when looking up the connection', () => {
        // A save can run after an SPA navigation; window.location then belongs
        // to the next profile.
        expect(code).toMatch(/async function findConnectionId\(profileUrl\)/);
    });

    it('gives the runtime message a deadline', () => {
        // A promise that never settles blocks the scheduler's next round for
        // good, and an MV3 worker can die between send and reply.
        expect(code).toContain('RUNTIME_MESSAGE_TIMEOUT_MS');
    });
});

describe('one bundle runs on all three browsers', () => {
    // Firefox shipped a separate content-firefox.js until this landed - 353
    // lines against 900, with no injectContextField, so its users never had the
    // inline note card. Nothing announced that: the fork simply existed, and
    // every fix written here stopped at Chrome and Edge.
    //
    // What kept the fork alive was one real difference, and reintroducing a
    // bare chrome.* call is how it comes back. In Firefox `chrome.storage.local
    // .get()` called without a callback does not return a promise, so an
    // `await` on it resolves to undefined and the settings read silently yields
    // nothing - a fault that looks like a preference problem, on a browser
    // nobody here can open.

    it('talks to the platform through the adapter, not through chrome.* directly', () => {
        expect(code).toContain('getBrowserApi');
        // Matches chrome.runtime / chrome.storage / chrome.tabs and friends,
        // but not the word inside an identifier.
        expect(code).not.toMatch(/\bchrome\.\w/);
    });

    it('keeps note-card.ts off the platform and the network as well', () => {
        // main.js supplies its I/O; a direct call here would skip the adapter
        // and the worker both.
        expect(noteCardCode).not.toMatch(/\b(chrome|browser)\.\w/);
        expect(noteCardCode).not.toMatch(/\bfetch\(/);
    });

    it('does not assume the platform is there', () => {
        // The content script outlives its extension: a reload or an uninstall
        // leaves it running in a page that was never ours.
        expect(code).toMatch(/if\s*\(!platform/);
    });
});

describe('typing a note is a request to save it', () => {
    it('creates the connection instead of sending the user to a button', () => {
        // The save path used to stop at "Add to CRM first" when the profile
        // was not in the CRM yet, discarding what had just been typed. The
        // code carried a note about it - "Optional: Auto-create connection?" -
        // that never became anything.
        expect(code).toContain('createConnectionForProfile');
    });

    it('keeps one profile-name selector list, in profile.ts', () => {
        // There were two: one in the button's click handler and, had this been
        // done inline, one in the card. Two lists of LinkedIn selectors drift,
        // and a stale one does not raise anything - it returns an empty name
        // and the feature quietly declines to work, which is how the August
        // 2026 breakage stayed invisible.
        expect(code).toContain('extractRawProfileName');
        expect(code).not.toContain('text-heading-xlarge');
        expect(code).not.toContain('data-test-id="profile-name"');
    });
});

describe('a delayed save belongs to the profile it was typed on', () => {
    it('does not read the page for url or name once a save is in flight', () => {
        // The debounce fires a second after typing. If the user has navigated
        // on by then, window.location and document.title describe the next
        // profile, and creating "the current profile" would attach the
        // previous profile's note to somebody else.
        const create = code.slice(code.indexOf('async function createConnectionForProfile'));
        const body = create.slice(0, create.indexOf('\n}\n'));
        expect(body).not.toContain('window.location');
        expect(body).not.toContain('document.title');
        expect(code).toContain('findConnectionId(cardUrl)');
        expect(code).toContain('createConnectionForProfile(cardUrl, resolveCardName(), notes)');
    });

    it('leaves opening the textarea to the tested note card', () => {
        // What stood here pinned `if (status.innerText !== 'Locked')
        // textarea.disabled = false;` - a finally block that opened the field
        // after a 429, a 5xx, a 401 and a timeout too. The field was then empty
        // while a note existed on the server, and the first save PATCHed what
        // had been typed over it. Which loads may open the field is decided in
        // note-card.ts, tested in note-card.test.ts; main.js must not open it
        // on its own.
        expect(code).toContain('createNoteCard(');
        expect(code).toContain('card.load().catch(');
        expect(code).not.toMatch(/textarea\.disabled\s*=\s*false/);
        expect(code).not.toMatch(/status\.innerText\s*!==?\s*'Locked'/);
        // And it loads through readNote, which is what tells a 429 from "not in
        // the CRM": a lenient inline load here brings the bug back with every
        // test in note-card.test.ts still green.
        expect(code).toContain('readNote(');
        expect(code).toContain('isAttached: stillOwned');
        expect(code).toMatch(
            /const stillOwned = \(\) => container\.isConnected && currentProfilePath\(location\.pathname\) === cardPath;/,
        );
        // The Retry that note-card.ts shows has to be on the card to be clicked.
        expect(code).toContain('footer.appendChild(retryButton)');
    });

    it("loads the card's own profile, also on a retry", () => {
        // A Retry can run after an SPA navigation; the live location then
        // belongs to the next profile.
        expect(code).toContain('profileLookupUrl(cardUrl)');
    });

    it('routes every profile URL it sends through profileLookupUrl', () => {
        // Two spellings of one profile URL were two rows: POST stored what the
        // address bar said, /details/… and nl.linkedin.com included.
        expect(code).not.toContain('legacyNormalizeLinkedInUrl');
        expect(code).toContain('url: profileLookupUrl(profileUrl)');
        expect(code).toContain('url: profileLookupUrl(window.location.href)');
        expect(code).not.toMatch(/url:\s*(window\.location\.href|profileUrl|cardUrl)\b/);
    });

    it('checks that the card loaded before a save sends anything', () => {
        // Defence in depth behind the closed textarea: a card that does not know
        // what the server holds must not PATCH over it.
        const start = code.indexOf('const saveNote = async');
        expect(start).toBeGreaterThan(-1);
        const save = code.slice(start);
        const gate = save.indexOf('if (!card.isLoaded()) return false;');
        expect(gate).toBeGreaterThan(-1);
        for (const call of ['findConnectionId(', 'createConnectionForProfile(', 'encryptNoteText(', 'apiRequest(']) {
            expect(save.indexOf(call)).toBeGreaterThan(gate);
        }
    });

    it('reads a connection the card did not load before saving over its note', () => {
        // "Not in Rldnk yet" holds when the card loads, not for good: the popup
        // can create the connection with a note after that, and so can a second
        // tab. A save that then PATCHed what had been typed here replaced that
        // note. textForUnseenNote decides what may be sent (see
        // note-card.test.ts); this pins that the save asks it after finding the
        // id and before the PATCH, and keeps no id it could not check, so the
        // next save reads again instead of PATCHing straight over.
        //
        // Changed on purpose with the single POST (see 'a new profile is saved
        // in one POST' below): this used to pin GET -> POST -> read -> encrypt
        // -> PATCH. The GET in front is gone because a 409 on the POST says
        // the same thing, and the 409 leads here.
        //
        // "Did not load" is read off connectionId, so the load has to set it:
        // without this line every first save would read the note it already
        // showed and put it in the field twice.
        expect(code).toContain("if (note.state === 'loaded') connectionId = note.connectionId;");
        const start = code.indexOf('const adoptExisting = async');
        expect(start).toBeGreaterThan(-1);
        const adopt = code.slice(start, code.indexOf('\n    };\n', start));
        const find = adopt.indexOf('findConnectionId(cardUrl)');
        const read = adopt.indexOf('const current = await readCardNote();');
        const check = adopt.indexOf('textForUnseenNote(current, id, textarea.value)');
        const keep = adopt.indexOf('connectionId = id;');
        const patch = adopt.indexOf('return patchNote();');
        expect(find).toBeGreaterThan(-1);
        expect(read).toBeGreaterThan(find);
        expect(check).toBeGreaterThan(read);
        // The kept text goes into the field, which is what patchNote encrypts.
        expect(adopt.slice(check, patch)).toContain('textarea.value = text;');
        // Only a checked id is kept; a null answer returns before it.
        expect(adopt.slice(check, keep)).toMatch(/if \(text === null\) \{[^}]*return false;/);
        expect(patch).toBeGreaterThan(keep);
        // And nothing in the unseen path PATCHes without coming through here.
        const unseen = code.slice(code.indexOf('const saveUnseen = async'), start);
        expect(unseen).not.toContain('patchNote(');
        expect(unseen).not.toContain("method: 'PATCH'");
    });

    it('keeps a failed save dirty by saving through the card', () => {
        // flushSave used to clear its own `dirty` before the save ran, so a
        // failed save was never tried again.
        expect(code).toContain('card.markDirty()');
        expect(code).toContain('card.flush()');
        expect(code).not.toMatch(/\bdirty\s*=/);
        // That only works while saveNote answers true exactly when the note is
        // on the server: after an ok PATCH, and nowhere else.
        const save = code.slice(code.indexOf('const saveNote = async'), code.indexOf('const flushSave'));
        expect(save.match(/return true;/g)).toHaveLength(1);
        expect(save).toMatch(/const confirmSaved = \(text\) => \{\s*lastSavedText = text;\s*setStatus\('Saved'\);\s*return true;/);
        // ...and confirmSaved is reached only after an ok PATCH, a created
        // POST, or with the text that is already on the server.
        expect(save.match(/confirmSaved\(/g)).toHaveLength(3);
        expect(save).toContain('if (resp.ok) return confirmSaved(text);');
        expect(save).toMatch(/if \(created\.outcome === 'created'\) \{[^}]*return confirmSaved\(typed\);/);
        expect(save).toContain('if (textarea.value === lastSavedText) return confirmSaved(lastSavedText);');
    });

    it('flushes a pending save when the page is hidden or unloaded', () => {
        expect(code).toContain("addEventListener('pagehide', flushSave)");
        expect(code).toContain("addEventListener('visibilitychange', flushOnHide)");
    });
});

describe('the status line does not start injection rounds', () => {
    // Every keystroke set status.innerText = 'Typing...'. That replaces the
    // element's children - a childList mutation - and the body observer
    // answers each one with a full round: some forty rounds for twenty
    // seconds of typing, where the heartbeat alone gives four. The status now
    // changes the data of one Text node that stays (createStatusLine,
    // tested in note-card.test.ts); characterData is not what the body
    // observer watches, and that observer stays as it is (see above).
    const STATUS_WRITE = /\bstatus\.(innerText|textContent|innerHTML)\s*=(?!=)/;

    it('main.js writes the status only through setStatus', () => {
        expect(code).not.toMatch(STATUS_WRITE);
        expect(code).toContain('createStatusLine(status)');
        expect(code).toContain('const setStatus = (text) => statusLine.set(text);');
    });

    it('note-card.ts writes it only through the status line too', () => {
        expect(noteCardCode).not.toMatch(STATUS_WRITE);
        expect(noteCardCode).toContain('node.data = text');
    });
});

describe('a content script that outlived its extension cleans up after itself', () => {
    // After an update Chrome and Edge leave the old script running in every
    // open tab. It used to go on ticking, a click on the button said "Cannot
    // reach the CRM server", and the branch for "Extension context
    // invalidated" was never reached because the errors were swallowed on the
    // way. isAlive (browser-api.test.ts) is the check; these pin its use.
    const check = code.slice(code.indexOf('const checkAndInject = async'));

    it('asks before every round, before handling navigation', () => {
        const alive = check.indexOf('if (!isPlatformAlive()) {');
        expect(alive).toBeGreaterThan(-1);
        expect(check.indexOf('teardownOrphan();')).toBeGreaterThan(alive);
        expect(check.indexOf('handleNavigation(path)')).toBeGreaterThan(alive);
        expect(code).toContain('const isPlatformAlive = () => Boolean(platform?.isAlive());');
    });

    it('stops the observer and the scheduler, removes the button and retires the card', () => {
        const start = code.indexOf('const teardownOrphan = () => {');
        expect(start).toBeGreaterThan(-1);
        const body = code.slice(start, code.indexOf('\n    };\n', start));
        for (const step of [
            'observer.disconnect()',
            'scheduler.stop()',
            "getElementById('crm-add-button')?.remove()",
            'retireCardHandlers',
        ]) {
            expect(body).toContain(step);
        }
        // The card stays, read-only, with what was typed: card.retire in
        // note-card.test.ts. In English, like the rest of the card.
        expect(code).toContain("card.retire(ORPHANED_CARD_MESSAGE)");
        expect(code).toContain("'Extension updated – copy your note and reload the page'");
    });

    it('shows no debug banner', () => {
        expect(code).not.toContain('showDebugBanner');
        expect(code).not.toContain('rolodink-debug-banner');
    });

    it('does not blame the server for a click on an orphaned page', () => {
        const click = code.slice(code.indexOf('async function addProfileFromButton'));
        const alive = click.indexOf('if (!isPlatformAlive())');
        expect(alive).toBeGreaterThan(-1);
        expect(click.indexOf('apiRequest(')).toBeGreaterThan(alive);
        expect(code).toContain("alert(isPlatformAlive() ? 'Cannot reach the CRM server.' : ORPHANED_ALERT);");
    });
});

describe('a new profile is saved in one POST', () => {
    // The first save on a profile that was not in the CRM used to send four
    // messages: GET, POST without notes, ENCRYPT, PATCH - while POST
    // /api/connections accepts notes. Now: encrypt, then one POST with the
    // note. A 409 means it exists after all; then a fresh GET and the
    // existing path, so a note made elsewhere is read before anything is
    // written (pinned above, under adoptExisting).
    const start = code.indexOf('const saveUnseen = async');
    const unseen = code.slice(start, code.indexOf('\n    };\n', start));

    it('encrypts first and sends the note with the POST', () => {
        const encrypt = unseen.indexOf('encryptOrFail(typed)');
        const post = unseen.indexOf('createConnectionForProfile(');
        expect(encrypt).toBeGreaterThan(-1);
        expect(post).toBeGreaterThan(encrypt);
        // No lookup in front of the POST.
        expect(unseen.slice(0, post)).not.toContain('findConnectionId(');
        const create = code.slice(code.indexOf('async function createConnectionForProfile'));
        const body = create.slice(0, create.indexOf('\n}\n'));
        expect(body).toContain('body: { name, url: profileLookupUrl(profileUrl), notes }');
        // A 409 is handed back, not resolved here with a bare id: the caller
        // must read the note before it may PATCH.
        expect(body).toContain("if (resp.status === 409) return { outcome: 'exists' };");
        expect(body).not.toContain('findConnectionId(');
    });

    it('goes through adoptExisting on a 409', () => {
        expect(unseen).toMatch(/return adoptExisting\(created\.outcome === 'exists'/);
    });

    it('skips a save whose text is already on the server, and flushes on blur', () => {
        expect(code).toContain('let lastSavedText = null;');
        expect(code).toContain("if (note.state === 'loaded') lastSavedText = note.text;");
        expect(code).toContain("if (note.state === 'absent') lastSavedText = '';");
        expect(code).toContain("textarea.addEventListener('blur', flushSave)");
        // The skip comes after the loaded gate: an unloaded card answers false.
        const save = code.slice(code.indexOf('const saveNote = async'));
        expect(save.indexOf('textarea.value === lastSavedText')).toBeGreaterThan(
            save.indexOf('if (!card.isLoaded()) return false;'),
        );
    });
});

describe('one GET per profile visit', () => {
    // shared-lookup.test.ts proves the helper sends one request for two
    // callers. These pin that main.js routes both callers through it, and
    // that the save path does not.
    it('shares the lookup between the button and the card load', () => {
        expect(code).toContain('createInFlightSharing()');
        expect(code).toContain('await lookupConnection(window.location.href)');
        expect(code).toContain('readNote(() => lookupConnection(cardUrl), decryptNoteText)');
    });

    it('keeps the save path on a fresh GET', () => {
        const find = code.slice(code.indexOf('async function findConnectionId'));
        const body = find.slice(0, find.indexOf('\n}\n'));
        expect(body).not.toContain('lookupConnection');
        expect(body).toContain('apiRequest(');
    });

    it('moves a misplaced button instead of rebuilding it', () => {
        // A rebuilt button asks the API again for an answer it already shows.
        expect(code).not.toMatch(/existingButton\.remove\(\)/);
        expect(code).toContain('placeButton(existingButton, anchorButton, container)');
        expect(code).toContain('styleButtonLike(existingButton, anchorButton)');
    });
});
