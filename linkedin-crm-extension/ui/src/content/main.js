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
import { extractRawProfileName } from './profile';
import { createNoteCard, createStatusLine, readNote, textForUnseenNote } from './note-card';
import { createInFlightSharing } from './shared-lookup';

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
 * altijd vast. Een scheduler-ronde wacht daar niet meer op (het laden van de
 * notitie loopt los, zie attachNoteBehaviour), maar het laden zelf, een save
 * en een Retry wel: zonder deadline bleef de kaart voor altijd op
 * "Loading..." of "Saving..." staan, en card.flush liet elke volgende save
 * achter de hangende wachten.
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

/**
 * Of de extensie achter dit script er nog is (isAlive in browser-api.ts).
 *
 * Na een update of herlaad laten Chrome en Edge dit script in elke open tab
 * doordraaien, losgekoppeld: elk bericht faalt dan. Elke ronde vraagt dit eerst
 * en ruimt anders alles op (teardownOrphan). In Firefox loopt dit pad niet op
 * dezelfde manier; daar blijft dit true zolang het script draait.
 */
const isPlatformAlive = () => Boolean(platform?.isAlive());

// Engels, zoals de rest van de kaart en de knop.
const ORPHANED_CARD_MESSAGE = 'Extension updated – copy your note and reload the page';
const ORPHANED_ALERT = 'Rolodink was updated. Please reload the page and try again.';

/**
 * Per notitiekaart die nog leeft: de functie die haar read-only zet en haar
 * luisteraars weghaalt. teardownOrphan roept ze allemaal aan; een kaart die
 * door navigatie verdwijnt, haalt zichzelf eruit.
 */
const retireCardHandlers = new Set();

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
 * Lopende GET's op /api/connections?url=, per genormaliseerde url.
 *
 * De knop en de notitiekaart vragen op elk profiel in dezelfde ronde exact
 * hetzelfde; wie als tweede komt, hangt aan het verzoek van de eerste. Alleen
 * zolang het loopt: een afgerond antwoord wordt nooit bewaard, dus geen 401,
 * 429 of 5xx die een Retry terugkrijgt en geen notitie of ciphertext in het
 * geheugen. Zie shared-lookup.ts.
 */
const sharedLookup = createInFlightSharing();

/**
 * Of dit profiel in de CRM staat, voor de knop en voor het laden van de kaart.
 *
 * Niet voor het opslaan: findConnectionId hieronder doet altijd een verse
 * GET, want een antwoord dat liep vóór er getypt werd, kan ouder zijn dan een
 * connectie die intussen ergens anders is aangemaakt.
 */
function lookupConnection(profileUrl) {
    // Bewust de legacy-vorm (host blijft staan) — zie de kop van dit bestand.
    const normalizedUrl = legacyNormalizeLinkedInUrl(profileUrl);
    return sharedLookup(normalizedUrl, () => apiRequest({
        path: '/api/connections',
        query: { url: normalizedUrl },
    }));
}

/**
 * Zoekt de CRM-connectie voor het profiel van de kaart (profileUrl).
 *
 * Geen standaardwaarde meer uit window.location: een save loopt na de
 * debounce, en kan dan na een SPA-navigatie afgaan. De aanroeper geeft altijd
 * de url van de kaart mee.
 *
 * Geeft het id terug, of null als het profiel er niet in staat. Gooit niet: de
 * aanroepers behandelen "niet gevonden" en "kon niet kijken" allebei als "nog
 * niet toevoegbaar", en een fout hier mag het typen niet onderbreken.
 */
async function findConnectionId(profileUrl) {
    try {
        // Bewust de legacy-vorm (host blijft staan) — zie de kop van dit bestand.
        const normalizedUrl = legacyNormalizeLinkedInUrl(profileUrl);
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

/**
 * Zet de knop op "toegevoegd", waar hij ook staat.
 *
 * Via het DOM en niet via de closure in injectCRMButton: de knop en de
 * notitiekaart worden door verschillende functies gebouwd, en sinds het
 * notitieveld zelf een connectie kan aanmaken moet de knop dat kunnen volgen.
 */
function markButtonAsAdded(profilePath) {
    // Alleen als we nog op het profiel staan waar de aanmaak voor was.
    if (currentProfilePath(location.pathname) !== profilePath) return;
    const button = document.getElementById('crm-add-button');
    if (!button) return;
    const label = button.querySelector(':scope > span > span');
    if (label) label.textContent = 'Already added ✔️';
    button.disabled = true;
}

/**
 * Voegt het profiel dat nu open staat toe aan de CRM en geeft het id terug.
 *
 * Bestaat omdat typen in het notitieveld een vraag om op te slaan is. Wie een
 * notitie intikt op een profiel dat nog niet in de CRM staat, wil die notitie
 * bewaren - eerst een knop moeten zoeken is een stap die niemand wilde. De
 * code had er al een aantekening over staan ("Optional: Auto-create
 * connection?") die nooit iets geworden is.
 *
 * Geeft null terug als het niet lukt; de aanroeper vertelt de gebruiker wat er
 * aan de hand is. Gooit niet: een mislukte aanmaak mag het typen niet
 * onderbreken.
 *
 * Url en naam komen van de aanroeper en worden niet hier van de pagina gelezen:
 * een opslag die pas na een SPA-navigatie afgaat, zou anders het nieuwe
 * profiel aanmaken en de notitie van het oude eraan hangen.
 */
async function createConnectionForProfile(profileUrl, name) {
    try {
        if (!name) {
            console.warn('Rolodink: geen profielnaam gevonden - de connectie wordt niet aangemaakt');
            return null;
        }

        const resp = await apiRequest({
            path: '/api/connections',
            method: 'POST',
            body: { name, url: profileUrl },
        });

        // 409 betekent dat hij er al in staat - in een ander tabblad, of door
        // een klik op de knop tussen het opzoeken en het aanmaken door. Dat is
        // geen fout, alleen een reden om het id alsnog op te halen.
        if (resp.status === 409) return await findConnectionId(profileUrl);
        if (!resp.ok) {
            console.error('Rolodink: kon de connectie niet aanmaken:', resp.status, resp.data);
            return null;
        }
        return resp.data?.id ?? await findConnectionId(profileUrl);
    } catch (error) {
        console.error('Rolodink: kon de connectie niet aanmaken:', error);
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
    //
    // Moved, not rebuilt: a rebuilt button asks the API again whether the
    // profile is in the CRM, and forgets the answer it already shows.
    const existingButton = document.getElementById('crm-add-button');
    if (existingButton) {
        if (container.contains(existingButton)) return;
        styleButtonLike(existingButton, anchorButton);
        placeButton(existingButton, anchorButton, container);
        return;
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
        const labelWrapper = document.createElement("span");
        const labelText = document.createElement("span");
        labelWrapper.appendChild(labelText);
        crmButton.appendChild(labelWrapper);

        // Every place that used to assign crmButton.innerText goes through this,
        // so the nesting cannot be lost by a later state change.
        const setButtonLabel = (text) => { labelText.textContent = text; };
        setButtonLabel("Add to Rldnk");

        styleButtonLike(crmButton, anchorButton);

        // Only apply layout spacing, let classes handle the rest
        crmButton.style.marginLeft = "8px";
        crmButton.style.display = "flex";
        crmButton.style.alignItems = "center";
        crmButton.style.justifyContent = "center";

        // Bij laden: controleer of dit profiel al in de CRM staat en update de knop
        void (async () => {
            try {
                // Geen tokencontrole meer hier: de worker weet of er een sessie
                // is en antwoordt anders met 401, wat hieronder gewoon "niets
                // doen" betekent — de knop blijft actief.
                //
                // Gedeeld met het laden van de notitiekaart, die in dezelfde
                // ronde hetzelfde vraagt: één GET per profielbezoek.
                const resp = await lookupConnection(window.location.href);

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

        // Een eigen functie (SonarCloud S3776): de klik zat met al zijn
        // takken binnen injectCRMButton en tilde die boven de grens.
        crmButton.onclick = () => {
            void addProfileFromButton(crmButton, setButtonLabel);
        };

        placeButton(crmButton, anchorButton, container);
    }
}

/**
 * De klik op "Add to Rldnk": het profiel dat nu open staat aan de CRM toevoegen.
 *
 * Eerst de vraag of de extensie er nog is. Na een update draait dit script in
 * Chrome en Edge losgekoppeld door, en dan faalt elk bericht met "Extension
 * context invalidated". Dat kwam hier binnen als een gewone fout van
 * apiRequest en werd gemeld als "Cannot reach the CRM server" - wie dat las,
 * ging de server of de verbinding na, niet de pagina herladen. De knop wordt
 * dan weggehaald; die mutatie laat de volgende ronde de rest opruimen
 * (teardownOrphan in observeAndInject).
 */
async function addProfileFromButton(crmButton, setButtonLabel) {
    if (!isPlatformAlive()) {
        alert(ORPHANED_ALERT);
        crmButton.remove();
        return;
    }
    try {
        // De selectorketen die hier stond woont nu in profile.ts, waar
        // hij getest is en waar de notitiekaart hem ook kan gebruiken.
        // Twee kopieën van een selectorlijst tegen een site die zijn
        // markup herschrijft is precies hoe augustus 2026 misging.
        const rawName = extractRawProfileName(document, document.title);
        const profileName = rawName ? cleanProfileName(rawName) : '';

        // Final fallback - show error if no name found
        if (!profileName) {
            console.error('No profile name found');
            alert('Could not find profile name. Please refresh the page.');
            return;
        }

        // Het token wordt niet meer hier opgehaald: de worker haalt het
        // uit zijn eigen sessie en antwoordt 401 als die er niet is.
        const requestBody = { name: profileName, url: window.location.href };

        let response;
        try {
            response = await apiRequest({
                path: '/api/connections',
                method: 'POST',
                body: requestBody,
            });
        } catch (error) {
            console.error('API Fout:', error);
            // Pas hier gevraagd: de extensie kan tijdens het bericht zijn
            // bijgewerkt.
            alert(isPlatformAlive() ? 'Cannot reach the CRM server.' : ORPHANED_ALERT);
            return;
        }
        applyAddResponse(response, profileName, (label) => {
            setButtonLabel(label);
            crmButton.disabled = true;
        });
    } catch (err) {
        console.error('Onherstelbare fout in click handler:', err);
        const message = err instanceof Error ? err.message : String(err);
        alert(message.toLowerCase().includes('invalidated')
            ? ORPHANED_ALERT
            : 'Something went wrong. Please refresh the page and try again.');
    }
}

/** Wat de knop doet met het antwoord op zijn POST. */
function applyAddResponse(response, profileName, markAdded) {
    if (response.ok) {
        alert(`${profileName} has been successfully added!`);
        markAdded("Added ✔️");
        return;
    }
    const errorData = response.data || {};
    console.error('Error response:', errorData);
    if (response.status === 401) {
        alert('Session expired. Please log in again via the extension.');
    } else if (response.status === 409) {
        // Bestaat al: markeer als toegevoegd zonder foutmelding
        markAdded("Already added ✔️");
    } else {
        alert(`Something went wrong: ${errorData.error || 'Unknown error'}`);
    }
}

/**
 * Gives our button the neighbouring action's look, on the outer element and on
 * the nested label spans.
 *
 * Copying the classes means the button matches whatever LinkedIn currently
 * looks like. This is the one place where not knowing the class names is an
 * advantage: the hashes change every build, and copying them is immune to that.
 * The old code also force-added 'artdeco-button' and demoted
 * 'artdeco-button--primary' to secondary; neither class exists any more, so
 * both are gone.
 *
 * The label goes in the same nested spans LinkedIn uses, because that is where
 * the typography lives. Copying only the outer className gave a button with the
 * right box and a label rendered as small grey text beside a properly styled
 * Message button.
 *
 * Run again when the button moves between rows: the sticky header and the hero
 * do not necessarily share classes.
 */
function styleButtonLike(button, anchorButton) {
    button.className = anchorButton.className;
    const labelClasses = findLabelClassNames(anchorButton);
    const labelWrapper = button.querySelector(':scope > span');
    const labelText = labelWrapper?.querySelector(':scope > span');
    if (labelWrapper) labelWrapper.className = labelClasses.wrapper;
    if (labelText) labelText.className = labelClasses.text;
}

/**
 * Puts the button right after the anchor's slot, so it lands in the action row
 * beside the other buttons. Used for a new button and for moving an existing
 * one; moving keeps its state ("Already added") and its click handler.
 *
 * The branch that used to be here referenced `entryPointWrapper`, a variable
 * whose definition went with the dead `.entry-point` lookup while these lines
 * stayed behind. It threw a ReferenceError on every observer tick, before this
 * insert, so the button never appeared for anyone. eslint now covers this file
 * with no-undef; it did not before.
 *
 * The old fallback was wrong too, in a way that would have survived the
 * ReferenceError being fixed on its own: appending to
 * anchorButton.parentElement puts our button inside another action's
 * [data-display-contents] slot, which is exactly what findActionContainer
 * climbs past. findInsertionReference returns the slot itself, which is a
 * direct child of the container.
 */
function placeButton(button, anchorButton, container) {
    const reference = findInsertionReference(anchorButton);
    if (reference.parentElement === container) {
        // .after(), not insertAdjacentElement('afterend', …): same result,
        // and the ChildNode method is the one that reads as what it does
        // (SonarCloud S7768).
        reference.after(button);
    } else {
        // Reachable if LinkedIn re-parents between the query and the insert.
        // appendChild on the container is the safe answer: worst case the
        // button sits at the end of the row rather than beside Message.
        container.appendChild(button);
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

/**
 * Brengt de notitiekaart tot leven: laadt de bestaande notitie en slaat wat er
 * getypt wordt op.
 *
 * Een eigen functie (SonarCloud S3776): het bouwen van de kaart in
 * injectContextField en het gedrag van de kaart zijn twee verantwoordelijkheden,
 * en samen kwam injectContextField ruim boven de toegestane complexiteit.
 *
 * Bewust niet async, en het laden wordt gestart zonder erop te wachten. Deze
 * functie draait binnen een scheduler-ronde, en de scheduler start geen nieuwe
 * ronde zolang de vorige loopt. Wachtte deze ronde op het laden (een GET en
 * een ontsleuteling, elk tot 15 s), dan lag alle injectie zolang stil: geen
 * navigatie-opruiming, dus de kaart van profiel A bleef op profiel B staan, en
 * geen verhuizing van de sticky header naar de hero. Of het antwoord nog
 * ergens heen mag, beslist stillOwned na elke await.
 */
function attachNoteBehaviour(container, textarea, status, retryButton) {
    // 6. Load Data
    let connectionId = null;
    let debounceTimer = null;

    // Het profiel waar deze kaart bij hoort, vastgelegd nu. Opslaan gebeurt
    // later (debounce, flush) en kan na een SPA-navigatie afgaan; dan
    // mogen url en naam niet meer van de pagina gelezen worden, want die
    // is dan van iemand anders.
    const cardPath = currentProfilePath(location.pathname);
    const cardUrl = window.location.href;
    // Of deze kaart nog op de pagina staat én de pagina nog van haar profiel
    // is. Het laden loopt los van de ronde die de kaart plaatste, en tussen
    // een navigatie en de ronde die de kaart weghaalt zit een moment waarop
    // de kaart er nog staat terwijl de url al van iemand anders is.
    // Eén Text-node die blijft staan; alleen zijn data verandert. innerText
    // zetten vervangt de kinderen van het element - een childList-mutatie, en
    // daarop start de body-observer een volledige ronde. Met "Typing..." bij
    // elke toetsaanslag was dat ~40 rondes per 20 s typen in plaats van 4.
    // Zie createStatusLine in note-card.ts.
    const statusLine = createStatusLine(status);
    const setStatus = (text) => statusLine.set(text);

    const stillOwned = () => container.isConnected && currentProfilePath(location.pathname) === cardPath;
    const rawCardName = extractRawProfileName(document, document.title);
    let cardName = rawCardName ? cleanProfileName(rawCardName) : '';
    const resolveCardName = () => {
        // Nog leeg bij het plaatsen (naam rendert soms later): alleen
        // aanvullen zolang we nog op hetzelfde profiel staan.
        if (!cardName && currentProfilePath(location.pathname) === cardPath) {
            const raw = extractRawProfileName(document, document.title);
            cardName = raw ? cleanProfileName(raw) : '';
        }
        return cardName;
    };

    // Wanneer de textarea opengaat, wanneer "Retry" verschijnt en of de kaart
    // mag opslaan, beslist note-card.ts; daar is het getest. Alleen een load
    // die de serverstand echt kent opent het veld: de notitie is binnen en
    // ontsleuteld, of een ok-antwoord zegt dat het profiel er niet in staat.
    // Wat hier stond opende het ook na een 429, een 5xx, een 401 of een
    // time-out - leeg, terwijl er een notitie op de server kon staan, en de
    // eerste save verving die dan door alleen het nieuw getypte.
    //
    // De notitie van deze kaart lezen, voor card.load en voor saveNote.
    // cardUrl en niet window.location.href: ook een Retry of een save na een
    // SPA-navigatie hoort bij het profiel van deze kaart.
    // Bewust de legacy-vorm (host blijft staan) — zie de kop van dit bestand.
    const readCardNote = () => readNote(
        () => apiRequest({
            path: '/api/connections',
            query: { url: legacyNormalizeLinkedInUrl(cardUrl) },
        }),
        decryptNoteText,
    );
    // Het laden deelt een lopende GET met de knop, die in dezelfde ronde
    // hetzelfde vraagt (lookupConnection). readCardNote hierboven blijft vers:
    // saveNote leest daarmee een connectie die deze kaart nooit toonde, en dat
    // antwoord moet van ná het typen zijn.
    const loadCardNote = () => readNote(() => lookupConnection(cardUrl), decryptNoteText);
    const card = createNoteCard({
        textarea,
        status: statusLine,
        retry: retryButton,
        isAttached: stillOwned,
        load: async () => {
            const note = await loadCardNote();
            // Een antwoord voor een kaart die niet meer van dit profiel is,
            // hoort bij geen enkele kaart: note-card.ts past het dan ook niet
            // toe, en het id mag hier evenmin blijven hangen.
            if (!stillOwned()) return note;
            if (note.state === 'loaded') connectionId = note.connectionId;
            return note;
        },
        // Pas bij aanroep opgezocht: saveNote staat hieronder.
        save: () => saveNote(),
    });

    // 7. Save Logic
    // Geeft true alleen als de notitie op de server staat; bij false houdt
    // card.flush de kaart dirty, zodat de volgende flush het opnieuw probeert.
    const saveNote = async () => {
        // Tweede slot, los van de dichte textarea: een kaart die niet geladen
        // is weet niet wat er op de server staat, en een PATCH zou die
        // notitie vervangen door alleen wat hier getypt is.
        if (!card.isLoaded()) return false;
        setStatus('Saving...');
        try {
            // connectionId komt uit card.load, bij het plaatsen van
            // de kaart of bij een Retry. Stond het profiel toen nog
            // niet in de CRM, dan bleef dit voor altijd null - ook
            // nadat de gebruiker op "Add to Rldnk" had geklikt en het
            // profiel er wél in stond. De kaart weigerde dan met "Add
            // to CRM first" en de getypte notitie was weg.
            //
            // Daarom hier opnieuw ophalen in plaats van vertrouwen op
            // wat we bij het laden zagen. Dat haalt de volgorde-eis
            // tussen knop en kaart helemaal weg.
            //
            // unseen: is het id hier nog null, dan komt het straks niet uit
            // card.load en heeft deze kaart de notitie van die connectie
            // nooit getoond. Zie de controle vóór het versleutelen.
            const unseen = !connectionId;
            if (!connectionId) {
                connectionId = await findConnectionId(cardUrl);
            }

            // Staat het profiel er nog niet in, dan voegen we het
            // toe in plaats van de gebruiker terug te sturen naar
            // een knop. Typen is de vraag om op te slaan.
            if (!connectionId) {
                setStatus('Adding to Rldnk...');
                connectionId = await createConnectionForProfile(cardUrl, resolveCardName());
                if (connectionId) markButtonAsAdded(cardPath);
            }

            if (!connectionId) {
                // Alleen nog bereikbaar als het aanmaken zelf
                // mislukte - geen naam op de pagina, of de API
                // onbereikbaar. createConnectionForProfile
                // logt waarom.
                setStatus('Add to Rldnk first');
                return false;
            }

            // "Not in Rldnk yet" gold bij het laden, niet voorgoed: de popup
            // maakt de connectie mét notitie aan, een tweede tabblad ook, en
            // een 409 hierboven betekent precies dat. Alleen het getypte
            // PATCHen zou die notitie vervangen. Dus eerst lezen en beide
            // bewaren (textForUnseenNote, getest in note-card.test.ts). Lukt
            // dat lezen niet, dan niets versturen en het id vergeten: de
            // volgende save zoekt en leest opnieuw.
            if (unseen) {
                const current = await readCardNote();
                const text = textForUnseenNote(current, connectionId, textarea.value);
                if (text === null) {
                    connectionId = null;
                    setStatus('Save failed');
                    return false;
                }
                if (text !== textarea.value) textarea.value = text;
            }

            // Versleutel vóór verzenden. Mislukt dat, dan slaan we niets op —
            // plaintext wegschrijven zou de popup-notitie onleesbaar maken.
            let notesPayload;
            try {
                notesPayload = await encryptNoteText(textarea.value);
            } catch (encryptError) {
                console.error('Error encrypting note:', encryptError);
                setStatus('Save failed');
                return false;
            }

            const resp = await apiRequest({
                path: '/api/connections',
                method: 'PATCH',
                body: { id: connectionId, notes: notesPayload },
            });

            if (resp.ok) {
                setStatus('Saved');
                return true;
            }
            setStatus(resp.status === 401 ? 'Not logged in' : 'Save failed');
            return false;
        } catch (e) {
            console.error('Error saving note:', e);
            setStatus('Error');
            return false;
        }
    };

    // Saves lopen achter elkaar (card.flush): versleutelen en PATCH zijn
    // async, en twee tegelijk lopende saves konden in de verkeerde volgorde
    // landen. Elke save leest textarea.value pas als hij aan de beurt is,
    // dus de laatst getypte tekst wint altijd. Een mislukte save laat de
    // kaart dirty: de volgende input of pagehide/visibilitychange probeert
    // het opnieuw. Bewust geen eigen timer - de rate limiter telt per IP.
    // Niet meer na de laatste flush van een weggehaalde kaart (hieronder):
    // daarna luistert er niets meer.
    const flushSave = () => {
        clearTimeout(debounceTimer);
        // Wordt nooit rejected: card.flush vangt een mislukte save zelf af.
        void card.flush();
    };

    textarea.addEventListener('input', () => {
        card.markDirty();
        setStatus('Typing...');
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(flushSave, 1000); // 1 second debounce
    });

    // Wie binnen de seconde debounce het tabblad sluit of wegnavigeert,
    // verloor de notitie. Best effort: het bericht naar de worker gaat nog
    // wel de deur uit, ook als het antwoord niet meer aankomt.
    const flushOnHide = () => {
        if (document.visibilityState === 'hidden') flushSave();
    };
    document.addEventListener('visibilitychange', flushOnHide);
    globalThis.addEventListener('pagehide', flushSave);
    // De kaart wordt bij navigatie weggehaald; de luisteraars horen dan
    // mee te gaan, anders stapelen ze zich op per bezocht profiel.
    const removalObserver = new MutationObserver(() => {
        if (container.isConnected) return;
        flushSave();
        detach();
    });
    const detach = () => {
        removalObserver.disconnect();
        document.removeEventListener('visibilitychange', flushOnHide);
        globalThis.removeEventListener('pagehide', flushSave);
        retireCardHandlers.delete(retire);
    };
    // De extensie is weg (teardownOrphan): de kaart blijft staan met wat er
    // getypt is, read-only om te kopiëren. Geen flush - er is niemand meer
    // om naar te versturen.
    const retire = () => {
        clearTimeout(debounceTimer);
        detach();
        card.retire(ORPHANED_CARD_MESSAGE);
    };
    retireCardHandlers.add(retire);
    removalObserver.observe(document.body, { childList: true, subtree: true });

    // Pas als alles hierboven aan de kaart hangt, en zonder await: zie de
    // kop van deze functie. card.load vangt zijn eigen fouten af; de catch is
    // er voor wat daar ooit nog doorheen glipt, zodat er geen onafgehandelde
    // afwijzing ontstaat.
    card.load().catch((error) => {
        console.error('Rolodink: laden van de notitie mislukt:', error);
    });
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

            // Status/Save Indicator, with a Retry button beside it for a load
            // that failed (note-card.ts shows and hides it). A sibling, not a
            // child: the status holds exactly one Text node (createStatusLine).
            const footer = document.createElement('div');
            footer.style.display = 'flex';
            footer.style.justifyContent = 'flex-end';
            footer.style.alignItems = 'center';
            footer.style.gap = '8px';
            footer.style.marginTop = '4px';
            footer.style.height = '16px'; // Prevent layout jump

            const status = document.createElement('div');
            status.style.fontSize = '12px';
            status.style.color = 'gray';
            status.style.textAlign = 'right';
            footer.appendChild(status);

            const retryButton = document.createElement('button');
            retryButton.type = 'button';
            retryButton.textContent = 'Retry';
            retryButton.style.background = 'none';
            retryButton.style.border = 'none';
            retryButton.style.padding = '0';
            retryButton.style.fontSize = '12px';
            retryButton.style.lineHeight = '16px';
            retryButton.style.fontFamily = 'inherit';
            retryButton.style.color = '#0a66c2'; // LinkedIn Blue, like the title
            retryButton.style.textDecoration = 'underline';
            retryButton.style.cursor = 'pointer';
            footer.appendChild(retryButton);
            container.appendChild(footer);

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

            // Niet awaiten: het laden van de notitie loopt los van deze ronde.
            attachNoteBehaviour(container, textarea, status, retryButton);
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

    // De heartbeat loopt alleen op een profiel in een zichtbaar tabblad. Op de
    // feed of in zoekresultaten keert elke tick meteen terug, en in een
    // verborgen tabblad ziet niemand wat hij zou herstellen: daar is hij
    // alleen een timer die de pagina elke paar seconden wekt. De
    // MutationObserver blijft verzoeken doen, dus een navigatie naar een
    // profiel wordt nog steeds opgemerkt en zet hem weer aan.
    const syncHeartbeat = (path) => {
        if (path && document.visibilityState !== 'hidden') {
            scheduler.resume();
        } else {
            scheduler.pause();
        }
    };

    // Serialisatie en herhaling liggen bij de scheduler, niet hier: die
    // garandeert dat rondes elkaar niet overlappen én dat er altijd nog een
    // ronde komt. Wat hier stond - `if (isChecking) return;` met een lock die
    // 500ms later viel - deed alleen het eerste. Zie scheduler.ts.
    const checkAndInject = async () => {
        // Vóór handleNavigation en al het andere: een script dat zijn
        // extensie overleefd heeft, kan niets meer opslaan of opvragen.
        if (!isPlatformAlive()) {
            teardownOrphan();
            return;
        }

        try {
            const path = currentProfilePath(location.pathname);
            handleNavigation(path);
            syncHeartbeat(path);

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
        } catch (err) {
            if (err?.message?.includes('Extension context invalidated')) {
                teardownOrphan();
                return;
            }
            console.error('Rolodink: Global injection error:', err);
        }
    };

    // Een script dat zijn extensie overleefd heeft (update of herlaad in
    // Chrome/Edge) ruimt zich op in plaats van fout na fout te geven: geen
    // observers en geen scheduler meer, de knop weg - een klik zou alleen
    // falen - en de notitiekaart blijft staan, read-only, met wat er getypt
    // was en de vraag de pagina te herladen. Bewust geen debugbanner.
    let orphaned = false;
    const teardownOrphan = () => {
        if (orphaned) return;
        orphaned = true;
        observer.disconnect();
        scheduler.stop();
        document.removeEventListener('visibilitychange', onVisibilityChange);
        document.getElementById('crm-add-button')?.remove();
        for (const retire of [...retireCardHandlers]) retire();
        console.warn('Rolodink: de extensie is bijgewerkt of herladen - dit script stopt; herlaad de pagina');
    };

    // De klok van de injectie. Bewust niet alleen de MutationObserver: die
    // zwijgt zodra LinkedIn klaar is met renderen, en juist dan staat de hero
    // er eindelijk. Zie scheduler.ts voor wat dat kostte.
    const scheduler = createInjectionScheduler({ run: checkAndInject });

    const onVisibilityChange = () => {
        if (!isPlatformAlive()) {
            teardownOrphan();
            return;
        }
        syncHeartbeat(currentProfilePath(location.pathname));
    };
    document.addEventListener('visibilitychange', onVisibilityChange);

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
