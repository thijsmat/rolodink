const API_BASE_URL = 'https://api.rolodink.app';

// Function to clean notification counts from profile names
function cleanProfileName(name) {
    if (!name) return name;

    console.log('Cleaning profile name:', name);

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

    console.log('Cleaned profile name:', cleaned);
    return cleaned;
}

// Functie om te wachten tot een element op de pagina is geladen
function waitForElement(selector, callback) {
    const interval = setInterval(() => {
        const element = document.querySelector(selector);
        if (element) {
            clearInterval(interval);
            callback(element);
        }
    }, 500);
}

// De selector die bewezen heeft te werken
const stableButtonSelector = "button[aria-label*='Message']";

waitForElement(stableButtonSelector, (foundButton) => {
    // Vind de dichtstbijzijnde container met .closest() - dit is erg stabiel
    const container = foundButton.closest("div[class*='pvs-sticky-header-profile-actions']");

    if (container && !document.getElementById("crm-add-button")) {
        const crmButton = document.createElement("button");
        crmButton.innerText = "Add to CRM";
        crmButton.id = "crm-add-button";
        
        // Styling
        crmButton.style.padding = "0px 12px"; // Aangepast voor de header
        crmButton.style.marginLeft = "8px";
        crmButton.style.height = "32px"; // Aangepast voor de header
        crmButton.style.border = "1px solid #0a66c2";
        crmButton.style.borderRadius = "16px";
        crmButton.style.color = "#0a66c2";
        crmButton.style.fontWeight = "600";
        crmButton.style.cursor = "pointer";
        crmButton.style.backgroundColor = "white";
        crmButton.style.display = "flex";
        crmButton.style.alignItems = "center";

        // Bij laden: controleer of dit profiel al in de CRM staat en update de knop
        (async () => {
            try {
                if (!browser || !browser.storage || !browser.storage.local) {
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
                    const result = await browser.storage.session.get('supabaseAccessToken');
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
                    console.log('Profiel reeds aanwezig, knop uitgeschakeld.');
                }
            } catch (e) {
                // Stil falen om UX niet te verstoren
                console.log('Kon bestaande connectie niet controleren:', e);
            }
        })();

        crmButton.onclick = async () => {
            try {
            console.log('CRM Button clicked - starting profile extraction...');
            
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
            
            console.log('Trying selectors:', selectors);
            
            for (const selector of selectors) {
                const element = document.querySelector(selector);
                console.log(`Selector "${selector}":`, element);
                if (element && element.innerText && element.innerText.trim()) {
                    profileName = element.innerText.trim();
                    console.log('Found profile name from DOM:', profileName);
                    console.log('Element HTML:', element.innerHTML);
                    break;
                }
            }
            
            // If still no name found, try to get it from the page title
            if (!profileName) {
                const title = document.title;
                console.log('Page title:', title);
                if (title && title.includes('|')) {
                    profileName = title.split('|')[0].trim();
                } else if (title) {
                    profileName = title.replace(' | LinkedIn', '').trim();
                }
                console.log('Profile name from title:', profileName);
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
            console.log('Profile URL:', profileUrl);

            // Controleer of de browser API beschikbaar is (context kan ongeldig zijn na reload)
            if (!browser || !browser.storage || !browser.storage.local) {
                alert('Extension reloaded. Please refresh the page and try again.');
                return;
            }

            // Haal het authenticatietoken op uit de storage van de extensie.
            let authToken;
            try {
                const result = await browser.storage.local.get('supabaseAccessToken');
                authToken = result.supabaseAccessToken;
                console.log('Auth token exists:', !!authToken);
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
            console.log('Request body:', requestBody);

            try {
                const response = await fetch(`${API_BASE_URL}/api/connections`, {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${authToken}` 
                    },
                    body: JSON.stringify(requestBody),
                });

                console.log('Response status:', response.status);
                console.log('Response ok:', response.ok);

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
                        console.log('Connectie bestaat al, knop uitgeschakeld.');
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
        
        container.appendChild(crmButton);
    }
});

