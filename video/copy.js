'use strict';

/*
 * Alle teksten van de uitlegvideo, per taal. main.js kiest de taal met ?lang=en
 * (standaard nl); render.mjs geeft die door met --lang. index.html verwijst met
 * data-copy="pad" naar een tekst; met data-html is de tekst HTML.
 *
 * Twee dingen hangen aan de animatie:
 * - de tweede regel van de hook heeft een o: daar vliegt de camera doorheen;
 * - de zoekterm heeft vier letters, één per aanslag (QUERY_TIMES in main.js), en staat
 *   in de notitie van Sanne tussen <mark class="hl">…</mark>.
 * De UI-teksten van de extensie (Add to Rldnk, Typing..., de popup) komen uit de extensie zelf.
 */
window.COPY = {
  nl: {
    title: 'Rolodink — uitlegvideo',
    file: 'rolodink-uitleg',
    hook: ['Wie was dat', 'ook alweer?'],
    tagline: ['Jouw notities,', 'direct op LinkedIn.'],
    steps: [
      ['Open een', 'profiel.', 'Klik op <span class="kbd">Add to Rldnk</span>'],
      ['Schrijf een', 'notitie.', 'Privé, alleen voor jou.'],
      ['Vind alles', 'terug.', 'Zoek op naam, bedrijf of detail.'],
    ],
    profile: {
      degree: '· 1e',
      headline: 'Head of Talent bij Nordlicht',
      meta: 'Utrecht, Nederland · 500+ connecties · <span class="link">Contactgegevens</span>',
      message: 'Bericht',
      more: 'Meer',
      about: 'Info',
    },
    sticker: 'Versleuteld opgeslagen',
    popup: {
      pills: ['Toon alle connecties', 'Instellingen', 'Help'],
      search: 'Zoek in connecties... (Ctrl+F)',
      result: '1 resultaat voor “zeil”',
    },
    outro: ['Van connectie', 'naar relatie.'],
    cta: 'Gratis voor Chrome, Edge & Firefox',
    // rollen op de visitekaartjes van de openingsscène, in de volgorde van CHIPS in main.js
    roles: ['UX Lead', 'Founder', 'Investeerder', 'Recruiter', 'Sales', 'CFO', 'Engineer', 'Consultant', 'Marketing', 'Head of Talent', 'Product', 'Designer'],
    note: 'Ontmoet op DDW. Zoekt een CTO. Restaureert zeilboten.',
    query: 'zeil',
    // functie en notitie per kaartje in de popup, in de volgorde van PCARDS in main.js
    cards: [
      ['UX Lead bij Studio Noord', 'Koffie gedaan in maart. Wil sparren over onderzoek.'],
      ['Founder bij Kiemkracht', 'Pitch gezien in Rotterdam. Terugbellen na de zomer.'],
      ['Head of Talent bij Nordlicht', 'Ontmoet op DDW. Zoekt een CTO. Restaureert <mark class="hl">zeil</mark>boten.'],
      ['Investeerder', 'Intro via Eva. Interesse in HR-tech.'],
      ['Recruiter bij Talentlab', 'Stuurt de vacature door naar haar netwerk.'],
    ],
  },

  en: {
    title: 'Rolodink — explainer video',
    file: 'rolodink-explainer',
    hook: ['Who was that', 'one again?'],
    tagline: ['Your notes,', 'right on LinkedIn.'],
    steps: [
      ['Open a', 'profile.', 'Click <span class="kbd">Add to Rldnk</span>'],
      ['Write a', 'note.', 'Private, just for you.'],
      ['Find them', 'again.', 'Search by name, company or detail.'],
    ],
    profile: {
      degree: '· 1st',
      headline: 'Head of Talent at Nordlicht',
      meta: 'Utrecht, Netherlands · 500+ connections · <span class="link">Contact info</span>',
      message: 'Message',
      more: 'More',
      about: 'About',
    },
    sticker: 'Stored encrypted',
    popup: {
      pills: ['Show All Connections', 'Settings', 'Help'],
      search: 'Search connections... (Ctrl+F)',
      result: '1 result for “sail”',
    },
    outro: ['From connection', 'to relationship.'],
    cta: 'Free for Chrome, Edge & Firefox',
    roles: ['UX Lead', 'Founder', 'Investor', 'Recruiter', 'Sales', 'CFO', 'Engineer', 'Consultant', 'Marketing', 'Head of Talent', 'Product', 'Designer'],
    note: 'Met at DDW. Looking for a CTO. Restores sailboats.',
    query: 'sail',
    cards: [
      ['UX Lead at Studio Noord', 'Had coffee in March. Wants to brainstorm research.'],
      ['Founder at Kiemkracht', 'Saw the pitch in Rotterdam. Call back after summer.'],
      ['Head of Talent at Nordlicht', 'Met at DDW. Looking for a CTO. Restores <mark class="hl">sail</mark>boats.'],
      ['Investor', 'Intro via Eva. Interested in HR tech.'],
      ['Recruiter at Talentlab', 'Sharing the job opening with her network.'],
    ],
  },
};
