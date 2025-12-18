const DEFAULT_API_BASE_URL = 'https://api.rolodink.app';
let API_BASE_URL = DEFAULT_API_BASE_URL;

async function loadApiBaseUrl() {
    try {
        if (!chrome || !chrome.storage || !chrome.storage.local?.get) {
            return;
        }
        const result = await chrome.storage.local.get('apiBaseUrl');
        const storedValue = typeof result.apiBaseUrl === 'string' ? result.apiBaseUrl.trim() : '';
        if (storedValue) {
            API_BASE_URL = storedValue;
        }
    } catch (error) {
        console.warn('Falling back to default API base URL due to error:', error);
    }
}

// Function to clean notification counts from profile names
function cleanProfileName(name) {
    if (!name) return name;

    // console.log('Cleaning profile name:', name);

    // Normalize whitespace (including Unicode NBSP) first
    let cleaned = name.replace(/\u00A0/g, ' ');

    // Patterns to remove notification-like counters and ornaments
    const patterns = [
        // Leading counters: (1) [2] {3}
        /^[\s\u00A0]*[\(\[\{]\s*\d+\s*[\)\]\}]\s*/,
        // Leading numbers like: 1 John, 12· John, 3. John
        /^[\s\u00A0]*\d+[\s\u00A0]*[\.|·•:\-]*[\s\u00A0]*/,
        // Trailing counters at end: John Doe (1)
        /[\s\u00A0]*[\(\[\{]\s*\d+\s*[\)\]\}]\s*$/,
        // Inline counters: John (1) Doe
        /[\s\u00A0]*[\(\[\{]\s*\d+\s*[\)\]\}][\s\u00A0]*/g,
    ];

    for (const pattern of patterns) {
        cleaned = cleaned.replace(pattern, ' ');
    }

    // Collapse spaces again and trim
    cleaned = cleaned.replace(/\s+/g, ' ').trim();

    // console.log('Cleaned profile name:', cleaned);
    return cleaned;
}

// Function to inject the CRM button into the LinkedIn profile page
function injectCRMButton(anchorButton) {
    if (!anchorButton) return;

    // Determine the best container to place the CRM button
    // Determine the best container to place the CRM button
    // Rolodink Fix: If the button is wrapped in an '.entry-point' div, we must insert AFTER that wrapper,
    // not inside it, to maintain the flex layout of the row.
    const entryPointWrapper = anchorButton.closest('.entry-point');
    const effectiveParent = entryPointWrapper ? entryPointWrapper.parentElement : anchorButton.parentElement;

    const candidateContainers = [
        effectiveParent,
        anchorButton.closest("div[data-test-id='profile-actions']"),
        anchorButton.closest(".pv-top-card__actions"),
        anchorButton.closest(".pv-top-card__inner"),
        document.querySelector("div[data-test-id='profile-actions']"),
        document.querySelector(".pv-top-card__actions"),
    ].filter(Boolean);

    const container = candidateContainers.find((el) => el instanceof HTMLElement);
    if (container && !container.querySelector("#crm-add-button")) {
        const crmButton = document.createElement("button");
        crmButton.innerText = "Add to Rldnk";
        crmButton.id = "crm-add-button";
        crmButton.type = "button";

        // Rolodink: Copy classes from the anchor button to match native LinkedIn styling
        crmButton.className = anchorButton.className;

        // Demote to secondary button style (Hollow Blue) to visually distinguish from the primary action
        if (crmButton.classList.contains('artdeco-button--primary')) {
            crmButton.classList.replace('artdeco-button--primary', 'artdeco-button--secondary');
        }
        // Ensure standard button classes exist if copy failed to provide them
        crmButton.classList.add('artdeco-button', 'artdeco-button--2', 'artdeco-button--secondary');

        // Only apply layout spacing, let classes handle the rest
        crmButton.style.marginLeft = "8px";
        crmButton.style.display = "flex";
        crmButton.style.alignItems = "center";
        crmButton.style.justifyContent = "center";

        // Bij laden: controleer of dit profiel al in de CRM staat en update de knop
        (async () => {
            try {
                if (!chrome || !chrome.storage || !chrome.storage.local) {
                    return;
                }

                const profileUrl = window.location.href;
                const normalizeLinkedInUrl = (inputUrl) => {
                    let normalized = inputUrl.split('?')[0].split('#')[0];
                    if (normalized.endsWith('/')) normalized = normalized.slice(0, -1);
                    return normalized;
                };
                const normalizedUrl = normalizeLinkedInUrl(profileUrl);

                let authToken;
                try {
                    const result = await chrome.storage.local.get('supabaseAccessToken');
                    authToken = result.supabaseAccessToken;
                } catch (_) {
                    return;
                }
                if (!authToken) return; // niet ingelogd → laat knop actief

                const resp = await fetch(`${API_BASE_URL}/api/connections?url=${encodeURIComponent(normalizedUrl)}`, {
                    method: 'GET',
                    headers: { 'Authorization': `Bearer ${authToken}` }
                });

                if (!resp.ok) return; // bij 404/401 etc. niets doen

                const data = await resp.json().catch(() => null);
                const exists = Array.isArray(data) ? data.length > 0 : (data && (data.id || data.linkedInUrl));
                if (exists) {
                    crmButton.innerText = "Already added ✔️";
                    crmButton.disabled = true;
                    // console.log('Profiel reeds aanwezig, knop uitgeschakeld.');
                }
            } catch (e) {
                // Stil falen om UX niet te verstoren
                // console.log('Kon bestaande connectie niet controleren:', e);
            }
        })();

        crmButton.onclick = async () => {
            try {
                // console.log('CRM Button clicked - starting profile extraction...');

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

                // console.log('Trying selectors:', selectors);

                for (const selector of selectors) {
                    const element = document.querySelector(selector);
                    // console.log(`Selector "${selector}":`, element);
                    if (element && element.innerText && element.innerText.trim()) {
                        profileName = element.innerText.trim();
                        // console.log('Found profile name from DOM:', profileName);
                        // console.log('Element text:', element.textContent);
                        break;
                    }
                }

                // If still no name found, try to get it from the page title
                if (!profileName) {
                    const title = document.title;
                    // console.log('Page title:', title);
                    if (title && title.includes('|')) {
                        profileName = title.split('|')[0].trim();
                    } else if (title) {
                        profileName = title.replace(' | LinkedIn', '').trim();
                    }
                    // console.log('Profile name from title:', profileName);
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
                // console.log('Profile URL:', profileUrl);

                // Controleer of de Chrome API beschikbaar is (context kan ongeldig zijn na reload)
                if (!chrome || !chrome.storage || !chrome.storage.local) {
                    alert('Extension reloaded. Please refresh the page and try again.');
                    return;
                }

                // Haal het authenticatietoken op uit de storage van de extensie.
                let authToken;
                try {
                    const result = await chrome.storage.local.get('supabaseAccessToken');
                    authToken = result.supabaseAccessToken;
                    // console.log('Auth token exists:', !!authToken);
                } catch (err) {
                    console.error('Kon token niet ophalen uit storage:', err);
                    const message = err instanceof Error ? err.message : String(err);
                    if (message && message.toLowerCase().includes('invalidated')) {
                        alert('Extension reloaded. Please refresh the page and try again.');
                        return;
                    }
                    alert('Could not retrieve authentication info. Please try again.');
                    return;
                }

                if (!authToken) {
                    alert('You are not logged in. Please log in via the extension popup to use this feature.');
                    // We stoppen hier als de gebruiker niet is ingelogd.
                    return;
                }

                const requestBody = { name: profileName, url: profileUrl };
                // console.log('Request body:', requestBody);

                try {
                    const response = await fetch(`${API_BASE_URL}/api/connections`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${authToken}`
                        },
                        body: JSON.stringify(requestBody),
                    });

                    // console.log('Response status:', response.status);
                    // console.log('Response ok:', response.ok);

                    if (response.ok) {
                        alert(`${profileName} has been successfully added!`);
                        crmButton.innerText = "Added ✔️";
                        crmButton.disabled = true;
                    } else {
                        const errorData = await response.json();
                        console.error('Error response:', errorData);
                        if (response.status === 401) {
                            alert('Session expired. Please log in again via the extension.');
                            // TODO: Open de login-pagina van de extensie.
                        } else if (response.status === 409) {
                            // Bestaat al: markeer als toegevoegd zonder foutmelding
                            crmButton.innerText = "Already added ✔️";
                            crmButton.disabled = true;
                            // Eventueel een zachte notificatie
                            // console.log('Connectie bestaat al, knop uitgeschakeld.');
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

        // Insert the button right after the anchor button (or its wrapper) for consistent UX
        if (entryPointWrapper && container === entryPointWrapper.parentElement) {
            entryPointWrapper.insertAdjacentElement('afterend', crmButton);
        } else if (anchorButton.parentElement === container) {
            anchorButton.insertAdjacentElement('afterend', crmButton);
        } else if (anchorButton.parentElement) {
            anchorButton.parentElement.appendChild(crmButton);
        } else {
            container.appendChild(crmButton);
        }
    }
}

// Function to inject the Context Field (Note)
async function injectContextField() {
    // console.log('Rolodink: Checking for context field injection...');

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
                // Debug: Trace parents to see what we are dealing with
                // console.log('Rolodink Debug: Anchor found:', anchor.tagName, anchor.className);
                let current = anchor.parentElement;
                for (let i = 0; i < 5; i++) {
                    if (!current) break;
                    // console.log(`Rolodink Debug: Ancestor ${i}: Tag=${current.tagName} Class="${current.className}" Height=${current.offsetHeight}`);
                    current = current.parentElement;
                }

                // Traverse up to find the main container (usually a SECTION tag)
                const parentSection = anchor.closest('section');
                if (parentSection) {
                    // console.log(`Rolodink Debug: Found parent section. Height: ${parentSection.offsetHeight}`);
                    if (parentSection.offsetHeight > 100) {
                        // Verify it's not the sticky header
                        if (!parentSection.closest('.scaffold-layout__sticky-content')) {
                            topCard = parentSection;
                            // console.log('Rolodink Debug: Found topCard via Anchor-Proximity fallback.');
                        } else {
                            // console.log('Rolodink Debug: Parent section rejected (Sticky detected)');
                        }
                    } else {
                        // console.log('Rolodink Debug: Parent section rejected (Height too small)');
                    }
                } else {
                    // console.log('Rolodink Debug: No parent section found for anchor.');

                    // Fallback 3b: If no section, maybe it's a DIV with specific class?
                    // Let's try to find a parent with class 'pv-top-card' manually if closest failed
                    // Or just the biggest parent < 5 levels up?
                }
            } else {
                // console.log('Rolodink Debug: No anchor button found.');
            }
        }

        if (!topCard) {
            // Debugging: Log ONLY ONCE per session/page-load to avoid spam if we can't find it
            if (!window.hasLoggedTopCardError) {
                const count = document.querySelectorAll('.pv-top-card').length;
                // console.log('Rolodink Debug: Profile top card not found. Candidates:', count);
                // document.querySelectorAll('.pv-top-card').forEach((c, i) => {
                //    console.log(`Candidate ${i}: Class="${c.className}" Height=${c.offsetHeight} Parent=${c.parentElement?.className}`);
                // });

                // Show visual banner
                if (typeof showDebugBanner === 'function') {
                    // showDebugBanner(`Rolodink Debug: Card Not Found (Seen ${count} .pv-top-card). Trying to recover...`, 'red');
                }

                window.hasLoggedTopCardError = true;
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

        // console.log('Rolodink: Connection status check:', { is1stDegree });

        if (!is1stDegree) {
            // console.log('Rolodink: Not a 1st degree connection.');
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
                const parent = messageButton.parentElement;
                if (parent && parent.children.length > 1) {
                    actionsContainer = parent;
                } else {
                    actionsContainer = parent;
                }
                // console.log('Rolodink: Used fallback parent traversal.');
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
            closeBtn.innerHTML = '&times;';
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
            // console.log('Rolodink Debug: Inserting context field container into DOM...');
            if (actionsContainer && actionsContainer.parentNode) {
                // Insert after the actions container
                actionsContainer.insertAdjacentElement('afterend', container);
                // console.log('Rolodink Debug: Context field inserted.');
            } else {
                // console.error('Rolodink Debug: Cannot insert. actionsContainer parent missing.', actionsContainer);
            }

            // 6. Load Data
            let connectionId = null;
            let debounceTimer = null;

            const loadNote = async () => {
                try {
                    status.innerText = 'Loading...';
                    const result = await chrome.storage.local.get('supabaseAccessToken');
                    const token = result.supabaseAccessToken;
                    if (!token) {
                        status.innerText = 'Not logged in';
                        return;
                    }

                    const profileUrl = window.location.href;
                    const normalizeLinkedInUrl = (inputUrl) => {
                        let normalized = inputUrl.split('?')[0].split('#')[0];
                        if (normalized.endsWith('/')) normalized = normalized.slice(0, -1);
                        return normalized;
                    };
                    const normalizedUrl = normalizeLinkedInUrl(profileUrl);

                    const resp = await fetch(`${API_BASE_URL}/api/connections?url=${encodeURIComponent(normalizedUrl)}`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });

                    if (resp.ok) {
                        const data = await resp.json();
                        const conn = Array.isArray(data) ? data[0] : data;
                        if (conn) {
                            connectionId = conn.id;
                            textarea.value = conn.notes || '';
                            status.innerText = 'Saved';
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
                        const result = await chrome.storage.local.get('supabaseAccessToken');
                        const token = result.supabaseAccessToken;
                        if (!token) {
                            status.innerText = 'Not logged in';
                            return;
                        }

                        if (!connectionId) {
                            // Try to create connection if it doesn't exist
                            // Reuse logic from injectCRMButton or similar?
                            // For now, let's just warn.
                            status.innerText = 'Add to CRM first';
                            return;
                        }

                        const resp = await fetch(`${API_BASE_URL}/api/connections`, {
                            method: 'PATCH',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${token}`
                            },
                            body: JSON.stringify({
                                id: connectionId,
                                notes: textarea.value
                            })
                        });

                        if (resp.ok) {
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

// Stable anchor selectors that cover the variety of LinkedIn CTAs
const primaryButtonSelectors = [
    "button[aria-label*='Message']",
    "button[aria-label*='Bericht']",
    "button[aria-label*='InMail']",
    "button[aria-label*='Contact']",
    "button[aria-label*='Connect']",
    "button[aria-label='Follow']",
    "button[data-control-name='connect']",
    "button[data-control-name='message']",
    ".artdeco-button--primary",
];

function findAnchorButton() {
    for (const selector of primaryButtonSelectors) {
        // Use querySelectorAll to find ALL candidates, not just the first one
        const buttons = document.querySelectorAll(selector);
        for (const button of buttons) {
            // Debug the check
            const isSticky =
                button.closest('.pvs-sticky-header-profile-actions') ||
                button.closest('.pv-profile-sticky-header-v2__actions-container') || // Added based on logs
                button.closest('.scaffold-layout__sticky-content') ||
                button.classList.contains('pvs-sticky-header-profile-actions__action');

            if (isSticky) {
                // console.log('Rolodink: Skipping sticky button:', button);
                continue; // Skip sticky buttons
            }
            return button; // Return the first non-sticky button found
        }
    }
    return null;
}

// MutationObserver to watch for DOM changes (supports SPA navigation)
function observeAndInject() {
    // Throttle observer callbacks to avoid excessive checks
    let isChecking = false;

    const checkAndInject = async () => {
        // Stop if extension context is dead
        if (window.rolodinkExtensionInvalidated) return;

        // Prevent multiple simultaneous checks
        if (isChecking) return;
        isChecking = true;

        try {
            const anchorButton = findAnchorButton();
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

// Initialize the observer when the script loads
loadApiBaseUrl().finally(() => {
    observeAndInject();
});
