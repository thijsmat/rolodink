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
            
            // Final fallback - show error if no name found
            if (!profileName) {
                alert('Kon de profielnaam niet vinden. Probeer de pagina te verversen.');
                return;
            }
            
            const profileUrl = window.location.href;

            // Haal het authenticatietoken op uit de storage van de extensie.
            const { supabaseAccessToken: authToken } = await chrome.storage.local.get('supabaseAccessToken');

            if (!authToken) {
                alert('Je bent niet ingelogd. Log in via de extensie-popup om deze functie te gebruiken.');
                // We stoppen hier als de gebruiker niet is ingelogd.
                return;
            }

            try {
                const response = await fetch(`${API_BASE_URL}/api/connections`, {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${authToken}` 
                    },
                    body: JSON.stringify({ name: profileName, linkedInUrl: profileUrl }),
                });

                if (response.ok) {
                    alert(`${profileName} is succesvol toegevoegd!`);
                    crmButton.innerText = "Toegevoegd ✔️";
                    crmButton.disabled = true;
                } else {
                    const errorData = await response.json();
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
        };
        
        container.appendChild(crmButton);
    }
});