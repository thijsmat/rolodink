const API_BASE_URL = 'https://linkedin-crm-backend-matthijs-goes-projects.vercel.app';

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
        crmButton.innerText = "Voeg toe aan CRM";
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
                    console.log('Found profile name:', profileName);
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
            
            // Final fallback - show error if no name found
            if (!profileName) {
                console.error('No profile name found');
                alert('Kon de profielnaam niet vinden. Probeer de pagina te verversen.');
                return;
            }
            
            const profileUrl = window.location.href;
            console.log('Profile URL:', profileUrl);

            // Controleer of de Chrome API beschikbaar is (context kan ongeldig zijn na reload)
            if (!chrome || !chrome.storage || !chrome.storage.local) {
                alert('De extensie is herladen. Ververs de pagina en probeer opnieuw.');
                return;
            }

            // Haal het authenticatietoken op uit de storage van de extensie.
            let authToken;
            try {
                const result = await chrome.storage.local.get('supabaseAccessToken');
                authToken = result.supabaseAccessToken;
                console.log('Auth token exists:', !!authToken);
            } catch (err) {
                console.error('Kon token niet ophalen uit storage:', err);
                const message = err instanceof Error ? err.message : String(err);
                if (message && message.toLowerCase().includes('invalidated')) {
                    alert('De extensie is herladen. Ververs de pagina en probeer opnieuw.');
                    return;
                }
                alert('Kon authenticatie-informatie niet ophalen. Probeer het opnieuw.');
                return;
            }

            if (!authToken) {
                alert('Je bent niet ingelogd. Log in via de extensie-popup om deze functie te gebruiken.');
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
                    alert(`${profileName} is succesvol toegevoegd!`);
                    crmButton.innerText = "Toegevoegd ✔️";
                    crmButton.disabled = true;
                } else {
                    const errorData = await response.json();
                    console.error('Error response:', errorData);
                    if (response.status === 401) {
                        alert('Sessie verlopen. Log opnieuw in via de extensie.');
                        // TODO: Open de login-pagina van de extensie.
                    } else {
                        alert(`Er ging iets mis: ${errorData.error || 'Onbekende fout'}`);
                    }
                }
            } catch (error) {
                console.error('API Fout:', error);
                alert('Kan de CRM-server niet bereiken.');
            }
            } catch (err) {
                console.error('Onherstelbare fout in click handler:', err);
                const message = err instanceof Error ? err.message : String(err);
                if (message && message.toLowerCase().includes('invalidated')) {
                    alert('De extensie is herladen. Ververs de pagina en probeer opnieuw.');
                } else {
                    alert('Er is iets misgegaan. Ververs de pagina en probeer opnieuw.');
                }
            }
        };
        
        container.appendChild(crmButton);
    }
});