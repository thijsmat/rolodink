/**
 * Rolodink content script. Runs in the DOM of every LinkedIn profile page and
 * is bundled by vite.content.config.ts into dist/content.js — the name the
 * manifest declares. Until this file moved here it lived as a plain,
 * import-less script at linkedin-crm-extension/content.js, which forced it to
 * carry its own copies of cleanProfileName, the encryption prefix and the URL
 * normalizer; those now come from @rolodink/core, where CI tests them.
 *
 * Deliberately still JavaScript: this code has never been typechecked or
 * linted, and converting it to strict TypeScript is a real change to review on
 * its own — it lands in PR 6 together with the jsdom tests that make such a
 * conversion safe. This PR only changes where the code lives and how it is
 * packaged.
 *
 * legacyNormalizeLinkedInUrl, not normalizeLinkedInUrl: GET
 * /api/connections?url= is an exact string match and the server does not
 * normalize the parameter. Rows in the database were stored with the
 * host-preserving legacy form (nl.linkedin.com rows exist). Switching to the
 * canonical www-rewriting form would make every non-www row unfindable: the
 * button stops saying "Already added", the note card claims the profile is not
 * in the CRM, and a typed note cannot be saved. Core's url.test.ts pins the
 * difference between the two forms for exactly this reason.
 */
import {
    isEncryptedString,
    cleanProfileName,
    legacyNormalizeLinkedInUrl,
} from '@rolodink/core';
// Extensionless, like the rest of ui. Not './anchors.js': Vite only retries a
// .js specifier as .ts when the importing file is itself TypeScript, and this
// one is not - the build fails with "Could not resolve ./anchors.js".
import {
    currentProfilePath,
    findActionContainer,
    findCardInsertionPoint,
    findInsertionReference,
    findLabelClassNames,
    removeInjectedElements,
    findAnchorButton as findProfileAnchor,
    findProfileHeader as findProfileHeaderElement,
} from './anchors';
import { createInjectionScheduler } from './scheduler';
import { getBrowserApi } from './browser-api';

// The API base URL is no longer resolved here. Every call goes through the
// background worker now, and that is where the base URL belongs - it is the
// side that actually builds the request.
//
// Nothing is lost with it. The block that stood here read an `apiBaseUrl` key
// out of chrome.storage, and a grep over the whole extension says no code has
// ever written that key: it always fell through to the compiled-in default.

/**
 * Het content script draait buiten de extensie-bundle en heeft dus geen toegang
 * tot de Web Crypto helpers of de datasleutel. Beide gaan daarom via de
 * background service worker, die de sleutel al gecached heeft.
 */
/**
 * Hoe lang we op de service worker wachten voordat we het opgeven.
 *
 * MV3-workers gaan na ~30s inactiviteit uit. Normaal wekt sendMessage hem
 * weer, maar sterft hij precies tussen verzenden en antwoorden, dan komt de
 * callback nooit - en een Promise die nooit settelt houdt de aanroeper voor
 * altijd vast. injectContextField wacht op zo'n antwoord, en de scheduler
 * start geen nieuwe ronde zolang de vorige loopt: één hangend bericht zou dus
 * alle verdere injectie stilleggen.
 */
const RUNTIME_MESSAGE_TIMEOUT_MS = 15000;

/**
 * Het extensieplatform waar dit script op draait: browser.* in Firefox,
 * chrome.* in Chrome en Edge. Zie browser-api.ts - daar zit het verschil, en
 * daar is het getest tegen een nagemaakte versie van allebei.
 *
 * Kan null zijn. Dat is geen theorie: dit script blijft draaien nadat de
 * extensie herladen of verwijderd is, en de pagina eromheen is niet van ons.
 */
const platform = getBrowserApi();

function sendRuntimeMessage(message) {
    if (!platform) {
        return Promise.reject(new Error('Extensie-API niet beschikbaar'));
    }
    return new Promise((resolve, reject) => {
        let settled = false;
        const timer = setTimeout(() => {
            if (settled) return;
            settled = true;
            reject(new Error('Geen antwoord van de achtergrondservice'));
        }, RUNTIME_MESSAGE_TIMEOUT_MS);
        const finish = (fn, value) => {
            if (settled) return;
            settled = true;
            clearTimeout(timer);
            fn(value);
        };
        platform.sendMessage(message).then(
            (response) => finish(resolve, response),
            (error) => finish(reject, error),
        );
    });
}

/**
 * Roept de API aan via de background worker in plaats van rechtstreeks.
 *
 * Dit script draait in de wereld van de pagina, dus zijn origin is
 * www.linkedin.com — of nl.linkedin.com, of welke localehost dan ook. De API
 * staat die origins bewust niet toe, dus een directe fetch strandt op de
 * CORS-preflight met "No 'Access-Control-Allow-Origin' header". De worker heeft
 * host_permissions voor api.rolodink.app en valt niet onder pagina-CORS.
 *
 * De worker plakt de Authorization-header er zelf op, uit de sessie die hij al
 * bezit. Dit script hoeft het token dus niet meer te kennen.
 *
 * Geeft { status, ok, data } terug, of gooit als het bericht zelf niet
 * aankwam — een dode service worker of een herladen extensie.
 */
async function apiRequest({ path, method = 'GET', query, body }) {
    const response = await sendRuntimeMessage({ type: 'API_REQUEST', path, method, query, body });
    if (!response?.success) {
        throw new Error(response?.error || 'API request failed');
    }
    return response;
}

/**
 * Zoekt de CRM-connectie voor het profiel dat nu open staat.
 *
 * Geeft het id terug, of null als het profiel er niet in staat. Gooit niet: de
 * aanroepers behandelen "niet gevonden" en "kon niet kijken" allebei als "nog
 * niet toevoegbaar", en een fout hier mag het typen niet onderbreken.
 */
async function findConnectionId() {
    try {
        // Bewust de legacy-vorm (host blijft staan) — zie de kop van dit bestand.
        const normalizedUrl = legacyNormalizeLinkedInUrl(window.location.href);
        const resp = await apiRequest({
            path: '/api/connections',
            query: { url: normalizedUrl },
        });
        if (!resp.ok) return null;
        const conn = Array.isArray(resp.data) ? resp.data[0] : resp.data;
        return conn?.id ?? null;
    } catch (error) {
        console.error('Rolodink: kon de connectie niet opzoeken:', error);
        return null;
    }
}

/** Versleutelt tekst. Gooit een fout als dat niet lukt — nooit stil plaintext opslaan. */
async function encryptNoteText(plaintext) {
    if (!plaintext) return plaintext;
    const response = await sendRuntimeMessage({ type: 'ENCRYPT_TEXT', text: plaintext });
    if (!response?.success || typeof response.ciphertext !== 'string') {
        throw new Error(response?.error || 'Encryption failed');
    }
    return response.ciphertext;
}

/**
 * Ontsleutelt tekst. Waarden zonder prefix zijn legacy plaintext (geschreven door
 * oudere versies van dit bestand) en worden ongewijzigd teruggegeven.
 */
async function decryptNoteText(value) {
    if (!value || !isEncryptedString(value)) return value || '';
    const response = await sendRuntimeMessage({ type: 'DECRYPT_TEXT', ciphertext: value });
    if (!response?.success || typeof response.plaintext !== 'string') {
        throw new Error(response?.error || 'Decryption failed');
    }
    return response.plaintext;
}

// cleanProfileName komt nu uit @rolodink/core; de inline kopie die hier stond
// wordt daar bewaakt door name.test.ts, inclusief de gelijkwaardigheidstest
// tegen content-firefox.js en de backend-route.

// Function to inject the CRM button into the LinkedIn profile page
function injectCRMButton(anchorButton) {
    if (!anchorButton) return;

    // The action row, found without class names. LinkedIn wraps each action in a
    // [data-display-contents] div, so the row is one level above the anchor's
    // own wrapper — inserting into the wrapper would put our button inside
    // another button's slot. See anchors.ts.
    const container = findActionContainer(anchorButton);
    if (!container) return;

    // Document-wide, not per container. The check used to be
    // container.querySelector, which meant a second candidate got its own
    // button: the sticky header and the hero are both action rows for the same
    // profile, so the page ended up with two "Add to Rldnk" buttons the moment
    // both were injected into.
    //
    // A button in the wrong row is moved rather than left alone, because
    // findProfileHeader now picks the tallest candidate and the hero can render
    // after the sticky header - so the first tick may legitimately choose the
    // sticky one and a later tick a better one.
    const existingButton = document.getElementById('crm-add-button');
    if (existingButton) {
        if (container.contains(existingButton)) return;
        existingButton.remove();
    }

    {
        const crmButton = document.createElement("button");
        crmButton.id = "crm-add-button";
        crmButton.type = "button";

        // The label goes in the same nested spans LinkedIn uses, because that is
        // where the typography lives. Copying only the outer className gave a
        // button with the right box and a label rendered as small grey text
        // beside a properly styled Message button - visible in a screenshot, and
        // not something any assertion about the outer element would have caught.
        const labelClasses = findLabelClassNames(anchorButton);
        const labelWrapper = document.createElement("span");
        labelWrapper.className = labelClasses.wrapper;
        const labelText = document.createElement("span");
        labelText.className = labelClasses.text;
        labelWrapper.appendChild(labelText);
        crmButton.appendChild(labelWrapper);

        // Every place that used to assign crmButton.innerText goes through this,
        // so the nesting cannot be lost by a later state change.
        const setButtonLabel = (text) => { labelText.textContent = text; };
        setButtonLabel("Add to Rldnk");

        // Copy the neighbouring action's classes so the button matches whatever
        // LinkedIn currently looks like. This is the one place where not knowing
        // the class names is an advantage: the hashes change every build, and
        // copying them is immune to that. The old code also force-added
        // 'artdeco-button' and demoted 'artdeco-button--primary' to secondary;
        // neither class exists any more, so both are gone.
        crmButton.className = anchorButton.className;

        // Only apply layout spacing, let classes handle the rest
        crmButton.style.marginLeft = "8px";
        crmButton.style.display = "flex";
        crmButton.style.alignItems = "center";
        crmButton.style.justifyContent = "center";

        // Bij laden: controleer of dit profiel al in de CRM staat en update de knop
        (async () => {
            try {
                const profileUrl = window.location.href;
                // Bewust de legacy-vorm (host blijft staan) — zie de kop van dit bestand.
                const normalizedUrl = legacyNormalizeLinkedInUrl(profileUrl);

                // Geen tokencontrole meer hier: de worker weet of er een sessie
                // is en antwoordt anders met 401, wat hieronder gewoon "niets
                // doen" betekent — de knop blijft actief.
                const resp = await apiRequest({
                    path: '/api/connections',
                    query: { url: normalizedUrl },
                });

                if (!resp.ok) return; // bij 404/401 etc. niets doen

                const data = resp.data;
                const exists = Array.isArray(data) ? data.length > 0 : (data && (data.id || data.linkedInUrl));
                if (exists) {
                    setButtonLabel("Already added ✔️");
                    crmButton.disabled = true;
                }
            } catch (e) {
                // Stil falen om UX niet te verstoren
            }
        })();

        crmButton.onclick = async () => {
            try {

                // More robust profile name extraction with multiple fallback selectors
                let profileName = '';
                const selectors = [
                    'h1.text-heading-xlarge',
                    'h1[data-test-id="profile-name"]',
                    'h1.break-words',
                    'h1',
                    '.text-heading-xlarge',
                    '[data-test-id="profile-name"]'
                ];


                for (const selector of selectors) {
                    const element = document.querySelector(selector);
                    if (element && element.innerText && element.innerText.trim()) {
                        profileName = element.innerText.trim();
                        break;
                    }
                }

                // If still no name found, try to get it from the page title
                if (!profileName) {
                    const title = document.title;
                    if (title && title.includes('|')) {
                        profileName = title.split('|')[0].trim();
                    } else if (title) {
                        profileName = title.replace(' | LinkedIn', '').trim();
                    }
                }

                // Clean up notification count from profile name (applies to ALL extraction methods)
                if (profileName) {
                    profileName = cleanProfileName(profileName);
                }

                // Final fallback - show error if no name found
                if (!profileName) {
                    console.error('No profile name found');
                    alert('Could not find profile name. Please refresh the page.');
                    return;
                }

                const profileUrl = window.location.href;

                // Het token wordt niet meer hier opgehaald: de worker haalt het
                // uit zijn eigen sessie en antwoordt 401 als die er niet is.
                // Dat scheelt het hele storage-pad, inclusief de "extension
                // invalidated"-afhandeling eromheen - een dode worker komt nu
                // naar boven als een afgewezen bericht, afgevangen in de catch
                // hieronder.
                const requestBody = { name: profileName, url: profileUrl };

                try {
                    const response = await apiRequest({
                        path: '/api/connections',
                        method: 'POST',
                        body: requestBody,
                    });

                    if (response.ok) {
                        alert(`${profileName} has been successfully added!`);
                        setButtonLabel("Added ✔️");
                        crmButton.disabled = true;
                    } else {
                        const errorData = response.data || {};
                        console.error('Error response:', errorData);
                        if (response.status === 401) {
                            alert('Session expired. Please log in again via the extension.');
                            // TODO: Open de login-pagina van de extensie.
                        } else if (response.status === 409) {
                            // Bestaat al: markeer als toegevoegd zonder foutmelding
                            setButtonLabel("Already added ✔️");
                            crmButton.disabled = true;
                            // Eventueel een zachte notificatie
                        } else {
                            alert(`Something went wrong: ${errorData.error || 'Unknown error'}`);
                        }
                    }
                } catch (error) {
                    console.error('API Fout:', error);
                    alert('Cannot reach the CRM server.');
                }
            } catch (err) {
                console.error('Onherstelbare fout in click handler:', err);
                const message = err instanceof Error ? err.message : String(err);
                if (message && message.toLowerCase().includes('invalidated')) {
                    alert('Extension reloaded. Please refresh the page and try again.');
                } else {
                    alert('Something went wrong. Please refresh the page and try again.');
                }
            }
        };

        // Insert the button right after the anchor's slot, so it lands in the
        // action row beside the other buttons.
        //
        // The branch that used to be here referenced `entryPointWrapper`, a
        // variable whose definition went with the dead `.entry-point` lookup
        // while these lines stayed behind. It threw a ReferenceError on every
        // observer tick, before this insert, so the button never appeared for
        // anyone. eslint now covers this file with no-undef; it did not before.
        //
        // The old fallback was wrong too, in a way that would have survived the
        // ReferenceError being fixed on its own: appending to
        // anchorButton.parentElement puts our button inside another action's
        // [data-display-contents] slot, which is exactly what findActionContainer
        // climbs past. findInsertionReference returns the slot itself, which is a
        // direct child of the container.
        const reference = findInsertionReference(anchorButton);
        if (reference.parentElement === container) {
            // .after(), not insertAdjacentElement('afterend', …): same result,
            // and the ChildNode method is the one that reads as what it does
            // (SonarCloud S7768).
            reference.after(crmButton);
        } else {
            // Reachable if LinkedIn re-parents between the query and the insert.
            // appendChild on the container is the safe answer: worst case the
            // button sits at the end of the row rather than beside Message.
            container.appendChild(crmButton);
        }
    }
}

/**
 * Puts an already-injected note card back where it belongs.
 *
 * Moved rather than recreated, so the textarea keeps whatever the user has
 * typed and its listeners stay attached. Needed because findProfileHeader picks
 * the tallest candidate and the hero can render after the sticky header - the
 * first tick may legitimately choose the sticky one and a later tick a better
 * one.
 *
 * Its own function for SonarCloud S3776: injectContextField was at cognitive
 * complexity 16 against the 15 allowed, and relocating is a separate job from
 * building.
 *
 * Returns true when a card already exists, meaning the caller has nothing left
 * to build.
 */
function relocateExistingCard(topCard) {
    const cards = Array.from(document.querySelectorAll('.rolodink-context-field'));
    if (cards.length === 0) return false;

    const [card, ...duplicates] = cards;
    // Duplicates are invalid but a re-render race can produce them.
    duplicates.forEach((duplicate) => duplicate.remove());
    if (card.previousElementSibling !== topCard) {
        topCard.after(card);
    }
    return true;
}

// Function to inject the Context Field (Note)
async function injectContextField() {

    // 1. Check if already injected OR currently injecting (Race condition fix)
    // Check for ID OR class presence to catch any duplicates
    // Only the lock here. Whether an existing card is in the right place cannot
    // be judged before the header is known, so that decision moved down to
    // where topCard exists.
    if (window.rolodinkIsInjecting) {
        return;
    }

    // Set lock
    window.rolodinkIsInjecting = true;

    try {
        // 2. Check settings
        if (!platform?.hasStorage()) {
            window.rolodinkIsInjecting = false;
            return;
        }
        const result = await platform.storageGet(['contextFieldEnabled']);
        if (result.contextFieldEnabled === false) {
            window.rolodinkIsInjecting = false;
            return;
        }

        // 3. Find the profile header, with the same tested finder the button
        // uses. The chain that stood here tried '.scaffold-layout__main
        // .pv-top-card', then every '.pv-top-card' with offsetHeight > 100, and
        // only then fell through to this - three dead selectors deep. Every one
        // of them matches nothing since the August 2026 redesign, which
        // anchors.test.ts asserts against two real captures.
        //
        // offsetHeight is worth a note: it is always 0 under jsdom, so the
        // sticky-header heuristic could never have been tested even while the
        // classes still existed. findProfileHeader picks the first card in
        // document order instead - an honest answer rather than a heuristic
        // that cannot be verified.
        const profilePath = currentProfilePath(location.pathname);
        const topCard = profilePath ? findProfileHeaderElement(document, profilePath) : null;

        if (!topCard) {
            // Once per page load, but it does now actually say something. The
            // previous version set this flag and logged nothing, so a missing
            // header was indistinguishable from the feature being switched off.
            if (!window.hasLoggedTopCardError) {
                window.hasLoggedTopCardError = true;
                console.warn('Rolodink: profielkaart niet gevonden - de notitiekaart wordt niet geplaatst');
            }
            window.rolodinkIsInjecting = false;
            return;
        }

        if (relocateExistingCard(topCard)) {
            window.rolodinkIsInjecting = false;
            return;
        }

        // The 1st-degree gate that stood here is gone. The reason recorded here
        // was wrong: LinkedIn does still render the connection degree, in the
        // hero card ("Tim Jansen · 1st", measured 2026-08-18). Every probe
        // behind the old claim had only seen the sticky header, because this
        // code was looking at the sticky header.
        // It read '.dist-value', which is dead, and then scanned
        // span[aria-hidden="true"] for "1st"/"1e" inside whatever
        // findProfileHeader returned - and that was the sticky header, which
        // does not carry the degree. So the gate could never pass, and an
        // always-false gate means the note card never appears for anyone.
        //
        // It stays dropped, but on its own merits rather than on the claim it
        // was dropped for. The "Add to Rldnk" button has never had a degree
        // requirement, so removing it makes the two injections consistent, and
        // the real gate is further down anyway: without a connection in the CRM
        // the card says "Add to CRM first" and cannot save. Now that the hero is
        // the header, reinstating a degree check would be possible - that is a
        // product decision, not a repair.

        // 4. Find the action row, with the same helpers the button uses.
        //
        // What stood here looked for button[aria-label*="Message"], which could
        // never match: the Message action is an <a> with no aria-label. Then it
        // tried .pv-top-card__actions, .pv-top-card__buttons and .ph5, all dead
        // since the redesign, before falling back to messageButton.parentElement
        // - the [data-display-contents] slot that findActionContainer exists to
        // climb past.
        const anchor = findAnchorButton();
        const actionsContainer = anchor ? findActionContainer(anchor) : null;

        if (actionsContainer) {
            // FIX: Create container explicitly before using it
            const container = document.createElement('div');
            container.id = 'rolodink-context-field'; // Add ID for duplicate checking
            container.classList.add('rolodink-context-field');
            container.style.marginBottom = '12px';
            container.style.padding = '12px';
            container.style.backgroundColor = '#fff';
            container.style.border = '1px solid #e0e0e0'; // LinkedIn subtle border
            container.style.borderRadius = '8px';
            container.style.display = 'flex';
            container.style.flexDirection = 'column';
            container.style.position = 'relative';
            container.style.fontFamily = '-apple-system, system-ui, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", "Fira Sans", Ubuntu, Oxygen, "Oxygen Sans", Cantarell, "Droid Sans", "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Lucida Grande", Helvetica, Arial, sans-serif';

            // Header with Title and Close Button
            const header = document.createElement('div');
            header.style.display = 'flex';
            header.style.justifyContent = 'space-between';
            header.style.alignItems = 'center';
            header.style.marginBottom = '8px';

            const title = document.createElement('span');
            title.textContent = 'Rolodink Note';
            title.style.fontWeight = '600';
            title.style.color = '#0a66c2'; // LinkedIn Blue
            title.style.fontSize = '14px';
            header.appendChild(title);

            const closeBtn = document.createElement('button');
            closeBtn.textContent = '×';
            closeBtn.title = 'Hide Context Field';
            closeBtn.style.background = 'none';
            closeBtn.style.border = 'none';
            closeBtn.style.fontSize = '18px';
            closeBtn.style.lineHeight = '1';
            closeBtn.style.cursor = 'pointer';
            closeBtn.style.color = 'rgba(0,0,0,0.6)';
            closeBtn.onclick = async () => {
                if (confirm('Hide this field? You can re-enable it in the extension settings.')) {
                    container.remove();
                    await platform.storageSet({ contextFieldEnabled: false });
                }
            };
            header.appendChild(closeBtn);
            container.appendChild(header);

            // Textarea
            const textarea = document.createElement('textarea');
            textarea.placeholder = 'Add a private note...';
            textarea.style.width = '100%';
            textarea.style.minHeight = '60px';
            textarea.style.padding = '8px';
            textarea.style.border = '1px solid #d9d9d9';
            textarea.style.borderRadius = '4px';
            textarea.style.resize = 'vertical';
            textarea.style.fontSize = '14px';
            textarea.style.fontFamily = 'inherit';
            textarea.style.boxSizing = 'border-box'; // Ensure padding doesn't overflow
            container.appendChild(textarea);

            // Status/Save Indicator
            const status = document.createElement('div');
            status.style.fontSize = '12px';
            status.style.color = 'gray';
            status.style.marginTop = '4px';
            status.style.textAlign = 'right';
            status.style.height = '16px'; // Prevent layout jump
            container.appendChild(status);

            // Insert the card below the whole profile header.
            //
            // It used to go after the *action row*, which made it a sibling of
            // the buttons inside that row. The row is a flex container, so the
            // card became a flex item and rendered as a panel floating beside
            // the buttons, overlapping the navigation bar. That read like a CSS
            // problem and was a DOM-structure one.
            const cardAnchor = findCardInsertionPoint(topCard);
            if (cardAnchor) {
                cardAnchor.after(container);
            } else {
                console.warn('Rolodink: profielkaart heeft geen ouder - de notitiekaart kan niet geplaatst worden');
            }

            // 6. Load Data
            let connectionId = null;
            let debounceTimer = null;

            const loadNote = async () => {
                try {
                    status.innerText = 'Loading...';

                    const profileUrl = window.location.href;
                    // Bewust de legacy-vorm (host blijft staan) — zie de kop van dit bestand.
                    const normalizedUrl = legacyNormalizeLinkedInUrl(profileUrl);

                    const resp = await apiRequest({
                        path: '/api/connections',
                        query: { url: normalizedUrl },
                    });

                    if (resp.status === 401) {
                        status.innerText = 'Not logged in';
                        return;
                    }

                    if (resp.ok) {
                        const data = resp.data;
                        const conn = Array.isArray(data) ? data[0] : data;
                        if (conn) {
                            connectionId = conn.id;
                            try {
                                textarea.value = await decryptNoteText(conn.notes);
                                status.innerText = 'Saved';
                            } catch (decryptError) {
                                // Kan niet ontsleutelen: toon niets in plaats van de ciphertext,
                                // en blokkeer opslaan zodat we de bestaande notitie niet overschrijven.
                                console.error('Error decrypting note:', decryptError);
                                textarea.value = '';
                                textarea.disabled = true;
                                textarea.placeholder = 'Unable to decrypt this note. Open the Rolodink popup to sign in again.';
                                status.innerText = 'Locked';
                            }
                        } else {
                            // Connection doesn't exist yet in CRM
                            status.innerText = 'Not in Rldnk yet';
                            // Optional: Auto-create connection? Or just wait for user to add?
                            // For now, we only allow notes if in CRM, or we could auto-add.
                            // Let's allow typing and auto-add on save if possible, but that's complex.
                            // Simpler: If not in CRM, show "Add to CRM to take notes" or similar.
                            // But user wants it "always".
                            // Let's try to auto-create or just handle it gracefully.
                            // If we don't have an ID, we can't PATCH.
                            // So we might need to POST first if they type.
                        }
                    } else {
                        status.innerText = 'Error loading';
                    }
                } catch (e) {
                    console.error('Error loading note:', e);
                    status.innerText = 'Error';
                }
            };

            await loadNote();

            // 7. Save Logic
            textarea.addEventListener('input', () => {
                status.innerText = 'Typing...';
                clearTimeout(debounceTimer);
                debounceTimer = setTimeout(async () => {
                    status.innerText = 'Saving...';
                    try {
                        // connectionId komt uit loadNote, dat één keer draait bij
                        // het plaatsen van de kaart. Stond het profiel toen nog
                        // niet in de CRM, dan bleef dit voor altijd null - ook
                        // nadat de gebruiker op "Add to Rldnk" had geklikt en het
                        // profiel er wél in stond. De kaart weigerde dan met "Add
                        // to CRM first" en de getypte notitie was weg.
                        //
                        // Daarom hier opnieuw ophalen in plaats van vertrouwen op
                        // wat we bij het laden zagen. Dat haalt de volgorde-eis
                        // tussen knop en kaart helemaal weg.
                        if (!connectionId) {
                            connectionId = await findConnectionId();
                        }

                        if (!connectionId) {
                            status.innerText = 'Add to Rldnk first';
                            return;
                        }

                        // Versleutel vóór verzenden. Mislukt dat, dan slaan we niets op —
                        // plaintext wegschrijven zou de popup-notitie onleesbaar maken.
                        let notesPayload;
                        try {
                            notesPayload = await encryptNoteText(textarea.value);
                        } catch (encryptError) {
                            console.error('Error encrypting note:', encryptError);
                            status.innerText = 'Save failed';
                            return;
                        }

                        const resp = await apiRequest({
                            path: '/api/connections',
                            method: 'PATCH',
                            body: { id: connectionId, notes: notesPayload },
                        });

                        if (resp.status === 401) {
                            status.innerText = 'Not logged in';
                        } else if (resp.ok) {
                            status.innerText = 'Saved';
                        } else {
                            status.innerText = 'Save failed';
                        }
                    } catch (e) {
                        console.error('Error saving note:', e);
                        status.innerText = 'Error';
                    }
                }, 1000); // 1 second debounce
            });
        }

        // Reset injection flag (success)
        window.rolodinkIsInjecting = false;

    } catch (err) {
        console.error('Rolodink: Injection error:', err);
        window.rolodinkIsInjecting = false;
    }
}

// The selector list that used to live here is gone. It matched LinkedIn's class
// names and English/Dutch button labels, and after the August 2026 redesign every
// entry returned zero matches: .pv-top-card, .artdeco-button--primary and the
// rest no longer exist, and the Message action became an <a> rather than a
// <button>. See anchors.ts, which matches on meaning instead, and its tests,
// which run against a real capture of the new markup.
function findAnchorButton() {
    const profilePath = currentProfilePath(location.pathname);
    if (!profilePath) return null;
    return findProfileAnchor(document, profilePath);
}

// MutationObserver to watch for DOM changes (supports SPA navigation)
function observeAndInject() {
    let loggedMissingAnchor = false;

    // The profile the current injections belong to. The manifest matches all of
    // LinkedIn now, so this script lives across SPA navigations: the user
    // arrives on the feed, clicks through to a profile, and on to the next -
    // all without a document load. Injection state that used to die with the
    // page has to be torn down by hand when the path changes, or profile B
    // inherits profile A's button ("Already added" about somebody else) and
    // note card (somebody else's note, and a connectionId that saves to it).
    let activeProfilePath = currentProfilePath(location.pathname);

    // Tears down the previous profile's UI and state when the path changes.
    // Its own function (SonarCloud S3776): navigation handling is a separate
    // responsibility from injection, and inlining it pushed checkAndInject
    // over the complexity threshold.
    const handleNavigation = (path) => {
        if (path === activeProfilePath) return;
        const removed = removeInjectedElements(document);
        // The per-page flags belong to the old profile too. Without this, a
        // warning logged on profile A suppresses the same warning on profile
        // B, and a stuck injection lock from a mid-navigation teardown would
        // block injection forever.
        window.rolodinkIsInjecting = false;
        window.hasLoggedTopCardError = false;
        loggedMissingAnchor = false;
        activeProfilePath = path;
        // Terug naar het snelle ritme: een nieuw profiel verdient dezelfde
        // aandacht als het eerste, en LinkedIn bouwt het opnieuw op.
        scheduler.restart();
        if (removed > 0) {
            console.log(`Rolodink: navigatie naar ${path ?? 'een niet-profielpagina'} - oude injecties opgeruimd`);
        }
    };

    // Serialisatie en herhaling liggen bij de scheduler, niet hier: die
    // garandeert dat rondes elkaar niet overlappen én dat er altijd nog een
    // ronde komt. Wat hier stond - `if (isChecking) return;` met een lock die
    // 500ms later viel - deed alleen het eerste. Zie scheduler.ts.
    const checkAndInject = async () => {
        // Stop if extension context is dead
        if (window.rolodinkExtensionInvalidated) return;

        try {
            const path = currentProfilePath(location.pathname);
            handleNavigation(path);

            // Feed, search, company pages: nothing to do here. The early
            // return keeps the observer cheap on LinkedIn's noisiest pages.
            if (!path) return;

            const anchorButton = findAnchorButton();
            // Logged once, not per observer tick: the MutationObserver fires
            // continuously on LinkedIn. Without this, "no anchor button found"
            // and "script never ran" were indistinguishable from the console.
            if (!anchorButton && !loggedMissingAnchor) {
                loggedMissingAnchor = true;
                console.warn('Rolodink: geen ankerknop gevonden op deze pagina - de "Add to Rldnk"-knop wordt niet geplaatst');
            }
            injectCRMButton(anchorButton);
            await injectContextField();

            // Visual Debug: Success (only show once if we actually did something or found the card)
            if (document.getElementById('rolodink-context-field')) {
                // showDebugBanner('Rolodink: Field Injected Successfully', 'green');
            }

        } catch (err) {
            if (err.message && err.message.includes('Extension context invalidated')) {
                window.rolodinkExtensionInvalidated = true;
                showDebugBanner('Rolodink: Extension invalidated. PLEASE RELOAD PAGE.', 'red');
                observer.disconnect();
                scheduler.stop();
                return;
            }
            console.error('Rolodink: Global injection error:', err);
            // showDebugBanner(`Rolodink Error: ${err.message}`, 'red');
        }
    };

    // De klok van de injectie. Bewust niet alleen de MutationObserver: die
    // zwijgt zodra LinkedIn klaar is met renderen, en juist dan staat de hero
    // er eindelijk. Zie scheduler.ts voor wat dat kostte.
    const scheduler = createInjectionScheduler({ run: checkAndInject });

    // Helper for visual debugging
    function showDebugBanner(message, color = 'red') {
        // Only show debug banner if we haven't shown this specific message successfully yet
        // or if it's an error. 
        // Logic: specific errors update the banner. Success updates it once.
        let banner = document.getElementById('rolodink-debug-banner');
        if (!banner) {
            banner = document.createElement('div');
            banner.id = 'rolodink-debug-banner';
            banner.style.position = 'fixed';
            banner.style.top = '0';
            banner.style.left = '0';
            banner.style.width = '100%';
            banner.style.padding = '5px 10px';
            banner.style.zIndex = '999999';
            banner.style.color = 'white';
            banner.style.fontFamily = 'monospace';
            banner.style.fontSize = '12px';
            banner.style.textAlign = 'center';
            banner.style.pointerEvents = 'none'; // click through
            document.body.appendChild(banner);
        }

        // Don't overwrite a red error with a green success if error persists? 
        // Ideally just show latest state.
        banner.style.backgroundColor = color === 'green' ? 'rgba(0, 128, 0, 0.8)' : 'rgba(255, 0, 0, 0.8)';
        banner.textContent = message;

        // Auto hide after 5s if green
        if (color === 'green') {
            setTimeout(() => { if (banner) banner.style.display = 'none'; }, 5000);
        } else {
            banner.style.display = 'block';
        }
    }

    // Create MutationObserver to watch for DOM changes
    const observer = new MutationObserver(() => {
        scheduler.request();
    });

    // Start observing the document body for changes
    if (document.body) {
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
        // Initial check in case the button is already present
        scheduler.request();
    } else {
        // Wait for body to be available
        const bodyObserver = new MutationObserver(() => {
            if (document.body) {
                observer.observe(document.body, {
                    childList: true,
                    subtree: true
                });
                scheduler.request();
                bodyObserver.disconnect();
            }
        });
        bodyObserver.observe(document.documentElement, {
            childList: true
        });
    }
}

// Initialize the observer when the script loads.
//
// The startup line is deliberate: it is what tells a content script that never
// ran apart from one that ran and found nothing.
//
// The manifest matches all of linkedin.com, not just /in/*. It used to match
// only profile documents, which meant a profile reached through LinkedIn's own
// SPA navigation - the feed, a search result, a "people also viewed" card -
// never loaded this script at all: no document load, no injection, no error.
// Onboarding sends every new user to the feed, so the default path for a fresh
// install was precisely the one that could never work. The observer now runs
// everywhere and checkAndInject gates on currentProfilePath, which returns
// null off-profile.
console.log(`Rolodink: content script actief op ${location.href}`);
observeAndInject();
