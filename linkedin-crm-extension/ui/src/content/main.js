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
    findInsertionReference,
    findAnchorButton as findProfileAnchor,
    findProfileHeader as findProfileHeaderElement,
} from './anchors';

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
function sendRuntimeMessage(message) {
    return new Promise((resolve, reject) => {
        try {
            chrome.runtime.sendMessage(message, (response) => {
                const runtimeError = chrome.runtime.lastError;
                if (runtimeError) {
                    reject(new Error(runtimeError.message));
                    return;
                }
                resolve(response);
            });
        } catch (error) {
            reject(error);
        }
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
    if (container && !container.querySelector("#crm-add-button")) {
        const crmButton = document.createElement("button");
        crmButton.innerText = "Add to Rldnk";
        crmButton.id = "crm-add-button";
        crmButton.type = "button";

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
                    crmButton.innerText = "Already added ✔️";
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
                        crmButton.innerText = "Added ✔️";
                        crmButton.disabled = true;
                    } else {
                        const errorData = response.data || {};
                        console.error('Error response:', errorData);
                        if (response.status === 401) {
                            alert('Session expired. Please log in again via the extension.');
                            // TODO: Open de login-pagina van de extensie.
                        } else if (response.status === 409) {
                            // Bestaat al: markeer als toegevoegd zonder foutmelding
                            crmButton.innerText = "Already added ✔️";
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

// Function to inject the Context Field (Note)
async function injectContextField() {

    // 1. Check if already injected OR currently injecting (Race condition fix)
    // Check for ID OR class presence to catch any duplicates
    if (document.getElementById('rolodink-context-field') ||
        document.querySelectorAll('.rolodink-context-field').length > 0 ||
        window.rolodinkIsInjecting) {
        return;
    }

    // Set lock
    window.rolodinkIsInjecting = true;

    try {
        // 2. Check settings
        if (!chrome || !chrome.storage || !chrome.storage.local) {
            window.rolodinkIsInjecting = false;
            return;
        }
        const result = await chrome.storage.local.get(['contextFieldEnabled']);
        if (result.contextFieldEnabled === false) {
            window.rolodinkIsInjecting = false;
            return;
        }

        // 3. Check connection status (Must be 1st degree connection)
        // 3. Find the correct Profile Top Card (Main Card vs Sticky Header)
        // STRATEGY:
        // 1. Prefer card inside .scaffold-layout__main (main content column)
        // 2. Filter out small cards (sticky headers are usually < 150px height)

        let topCard = document.querySelector('.scaffold-layout__main .pv-top-card');

        // Fallback: If specific structure not found, look for any big top card
        if (!topCard) {
            const candidates = document.querySelectorAll('.pv-top-card');
            for (const candidate of candidates) {
                // Ignore obvious sticky containers
                if (candidate.closest('.scaffold-layout__sticky-content') ||
                    candidate.classList.contains('js-sticky-header') ||
                    candidate.classList.contains('pv-top-card--sticky')) {
                    continue;
                }

                // Height check: Sticky headers are thin. Profile cards are tall (>200px usually).
                // We use a conservative 100px threshold.
                if (candidate.offsetHeight > 100) {
                    topCard = candidate;
                    break;
                }
            }
        }

        // Strategy 3: Anchor-based Proximity Search (Critical Fallback if class names changed)
        if (!topCard) {
            const anchor = findAnchorButton();
            if (anchor) {
                // Traverse up to find the main container (usually a SECTION tag)
                const parentSection = anchor.closest('section');
                if (parentSection) {
                    if (parentSection.offsetHeight > 100) {
                        // Verify it's not the sticky header
                        if (!parentSection.closest('.scaffold-layout__sticky-content')) {
                            topCard = parentSection;
                        }
                    }
                }
                // Fallback 3b (nooit gebouwd): geen section gevonden -> geen kaart.
            }
        }

        // Last resort: the profile header located without class names. The
        // .pv-top-card lookups above are all dead as of the August 2026
        // redesign; this is the same finder the button uses, and it is tested.
        if (!topCard) {
            const profilePath = currentProfilePath(location.pathname);
            if (profilePath) {
                topCard = findProfileHeaderElement(document, profilePath);
            }
        }

        if (!topCard) {
            // Once per page load, but it does now actually say something. The
            // previous version set this flag and logged nothing, so a missing
            // top card was indistinguishable from the feature being switched off.
            if (!window.hasLoggedTopCardError) {
                window.hasLoggedTopCardError = true;
                console.warn('Rolodink: profielkaart niet gevonden - de notitiekaart wordt niet geplaatst');
            }
            window.rolodinkIsInjecting = false;
            return;
        }

        // 3. Connectie status check (Robuust voor meerdere talen)
        let is1stDegree = false;

        // Check standard distance badge
        const distValue = topCard.querySelector('.dist-value') || topCard.querySelector('span.dist-value');
        if (distValue) {
            const text = distValue.innerText.toLowerCase();
            // Check op "1st" (Engels), "1e" (Nederlands), of gewoon het cijfer "1" gevolgd door iets
            if (text.includes('1st') || text.includes('1e') || /1\s*(st|e|er)/.test(text)) {
                is1stDegree = true;
            }
        }

        // Fallback: Check aria-hidden badges if dist-value failed
        if (!is1stDegree) {
            const potentialBadges = topCard.querySelectorAll('span[aria-hidden="true"]');
            for (const badge of potentialBadges) {
                const text = badge.innerText.toLowerCase();
                if (text.includes('1st') || text.includes('1e')) {
                    is1stDegree = true;
                    break;
                }
            }
        }


        if (!is1stDegree) {
            window.rolodinkIsInjecting = false;
            return;
        }

        // 4. Find Injection Point
        // STRICTLY target the message button inside .pv-top-card to avoid sticky headers
        const messageButton = topCard.querySelector('button[aria-label*="Message"]') || topCard.querySelector('button[aria-label*="Bericht"]');

        let actionsContainer = null;

        if (messageButton) {
            // Traverse up to find the main action row WITHIN the top card
            actionsContainer = messageButton.closest('.pv-top-card__actions') ||
                messageButton.closest('.pv-top-card__buttons') ||
                messageButton.closest('.ph5'); // Fallback

            // FAILSAFE: Fallback traversal
            if (!actionsContainer) {
                actionsContainer = messageButton.parentElement;
            }
        } else {
            // Fallback to direct selectors inside top card
            actionsContainer =
                topCard.querySelector('.pv-top-card__actions') ||
                topCard.querySelector('.pv-top-card__buttons');
        }

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
                    await chrome.storage.local.set({ contextFieldEnabled: false });
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

            // Insert into DOM
            // Insert into DOM
            if (actionsContainer && actionsContainer.parentNode) {
                // Insert after the actions container
                actionsContainer.insertAdjacentElement('afterend', container);
            } else {
                // console.error('Rolodink Debug: Cannot insert. actionsContainer parent missing.', actionsContainer);
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
                            status.innerText = 'Profile not in CRM';
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
                        if (!connectionId) {
                            // Try to create connection if it doesn't exist
                            // Reuse logic from injectCRMButton or similar?
                            // For now, let's just warn.
                            status.innerText = 'Add to CRM first';
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
    // Throttle observer callbacks to avoid excessive checks
    let isChecking = false;
    let loggedMissingAnchor = false;

    const checkAndInject = async () => {
        // Stop if extension context is dead
        if (window.rolodinkExtensionInvalidated) return;

        // Prevent multiple simultaneous checks
        if (isChecking) return;
        isChecking = true;

        try {
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
                if (typeof observer !== 'undefined') observer.disconnect();
                return;
            }
            console.error('Rolodink: Global injection error:', err);
            // showDebugBanner(`Rolodink Error: ${err.message}`, 'red');
        } finally {
            setTimeout(() => {
                isChecking = false;
            }, 500);
        }
    };

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
        checkAndInject();
    });

    // Start observing the document body for changes
    if (document.body) {
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
        // Initial check in case the button is already present
        checkAndInject();
    } else {
        // Wait for body to be available
        const bodyObserver = new MutationObserver(() => {
            if (document.body) {
                observer.observe(document.body, {
                    childList: true,
                    subtree: true
                });
                checkAndInject();
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
// The startup line is deliberate. Until it existed there was no way to tell a
// content script that never ran from one that ran and found nothing - the
// manifest only injects on a document whose URL matches, so arriving at a
// profile through LinkedIn's own SPA navigation silently skips injection. Both
// cases looked identical from the console: no button, no error.
console.log(`Rolodink: content script actief op ${location.href}`);
observeAndInject();
