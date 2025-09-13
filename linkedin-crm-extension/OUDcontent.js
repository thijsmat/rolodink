// Functie om te wachten tot een element op de pagina is geladen
function waitForElement(selector, callback) {
    const element = document.querySelector(selector);
    if (element) {
        callback(element);
    } else {
        setTimeout(() => waitForElement(selector, callback), 500);
    }
}

// Wacht tot de profiel-actieknoppen geladen zijn
waitForElement("div[class*='pvs-profile-actions']", (buttonsContainer) => {
    
    // Voorkom dat de knop meerdere keren wordt toegevoegd
    if (!document.getElementById("crm-add-button")) {
        const crmButton = document.createElement("button");
        crmButton.innerText = "Voeg toe aan CRM";
        crmButton.id = "crm-add-button";
        
        // Simpele styling om op te vallen
        crmButton.style.padding = "8px 12px";
        crmButton.style.marginLeft = "8px";
        crmButton.style.border = "1px solid #0a66c2";
        crmButton.style.borderRadius = "16px";
        crmButton.style.color = "#0a66c2";
        crmButton.style.fontWeight = "600";
        crmButton.style.cursor = "pointer";
        

crmButton.onclick = async () => {
    const profileName = document.querySelector('h1').innerText;
    const profileUrl = window.location.href;

    console.log("Data wordt verstuurd:", { name: profileName, url: profileUrl });

    try {
        const response = await fetch('https://linkedin-crm-nine.vercel.app/api/connections', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                name: profileName,
                linkedInUrl: profileUrl,
                // TODO: Voeg ownerId toe voor de ingelogde gebruiker
            }),
        });

        if (response.ok) {
            alert(`${profileName} is succesvol toegevoegd aan je CRM!`);
            crmButton.innerText = "Toegevoegd ✔️";
            crmButton.disabled = true;
        } else {
            alert('Er is iets misgegaan bij het toevoegen.');
        }
    } catch (error) {
        console.error('Fout bij het versturen naar de API:', error);
        alert('Kan de CRM-server niet bereiken.');
    }
};


        
        buttonsContainer.appendChild(crmButton);
    }
});