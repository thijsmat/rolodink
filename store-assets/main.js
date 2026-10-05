// Bouwt één store-afbeelding op uit shots.json en copy/<taal>.json:
//
//   index.html?variant=store&lang=nl&shot=3-search   → screenshot met kop (Chrome, Edge)
//   index.html?variant=clean&lang=en&shot=3-search   → zonder tekst in beeld (Firefox)
//   index.html?variant=tile-small | tile-marquee      → promotegels
//   index.html?variant=logo                           → logo voor Edge, 300×300
//
// Alles gaat via textContent, nooit via innerHTML. De LinkedIn-pagina is
// nagebouwd met fictieve personen; de knop en de notitiekaart volgen de
// content script van de extensie (linkedin-crm-extension/ui/src/content/main.js)
// en de popup is de echte popup in een iframe, met demodata (zie render.mjs).

const params = new URLSearchParams(location.search);
const variant = params.get('variant') ?? 'store';
const lang = /^[a-z]{2}$/.test(params.get('lang') ?? '') ? params.get('lang') : 'nl';
const shotId = params.get('shot') ?? '1-note-on-profile';

const SVG_NS = 'http://www.w3.org/2000/svg';

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
}

// Een lijnicoon: paden met currentColor, zodat de kleur uit de CSS komt.
function icon(size, paths, { viewBox = '0 0 24 24', stroke = 1.8 } = {}) {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('viewBox', viewBox);
  svg.setAttribute('width', size);
  svg.setAttribute('height', size);
  svg.setAttribute('aria-hidden', 'true');
  for (const d of paths) {
    const path = document.createElementNS(SVG_NS, 'path');
    path.setAttribute('d', d);
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke', 'currentColor');
    path.setAttribute('stroke-width', stroke);
    path.setAttribute('stroke-linecap', 'round');
    path.setAttribute('stroke-linejoin', 'round');
    svg.append(path);
  }
  return svg;
}

const ICONS = {
  back: ['M15 5l-7 7 7 7'],
  forward: ['M9 5l7 7-7 7'],
  reload: ['M19.5 12a7.5 7.5 0 1 1-2.2-5.3', 'M19.5 4.5v4.6h-4.6'],
  lock: ['M5.2 7.2V5.4a2.8 2.8 0 0 1 5.6 0v1.8', 'M4 7.2h8a.8.8 0 0 1 .8.8v5a.8.8 0 0 1-.8.8H4a.8.8 0 0 1-.8-.8V8a.8.8 0 0 1 .8-.8z'],
  person: ['M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8z', 'M4.5 20.5a7.5 7.5 0 0 1 15 0'],
  search: ['M10.5 17a6.5 6.5 0 1 0 0-13 6.5 6.5 0 0 0 0 13z', 'M15.5 15.5 20 20'],
  home: ['M3.5 11 12 4l8.5 7', 'M5.5 9.5V20h5v-5.5h3V20h5V9.5'],
  network: ['M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z', 'M2.5 20a6.5 6.5 0 0 1 13 0', 'M16 4.6a3.4 3.4 0 0 1 0 6.3', 'M18 13.6a6.4 6.4 0 0 1 3.5 6.4'],
  jobs: ['M4 7.5h16v12H4z', 'M9 7.5V5h6v2.5', 'M4 12.5h16'],
  messaging: ['M4 5h16v11H9l-5 4z'],
  bell: ['M6 16V10a6 6 0 0 1 12 0v6l1.5 2h-15z', 'M10 20.5a2 2 0 0 0 4 0'],
};

async function load() {
  const [copy, shots] = await Promise.all([
    fetch(`copy/${lang}.json`).then(r => r.json()),
    fetch('shots.json').then(r => r.json()),
  ]);
  document.documentElement.lang = lang;
  const stage = document.getElementById('stage');
  if (variant === 'logo') {
    buildLogo(stage);
  } else if (variant === 'tile-small' || variant === 'tile-marquee') {
    buildTile(stage, variant);
  } else {
    const shot = shots.find(s => s.id === shotId);
    if (!shot) throw new Error(`Onbekende shot ${shotId}`);
    buildShot(stage, copy, shot);
  }
  await document.fonts.ready;
  await Promise.all([...document.images].map(img => img.decode().catch(() => null)));
  await popupLoaded();
  globalThis.__ready = true;
}

// ---------- screenshots ----------

function buildShot(stage, copy, shot) {
  stage.className = `shot ${variant}`;
  if (variant === 'store') {
    const [lead, accent] = copy.headlines[shot.id];
    const headline = el('div', 'headline');
    headline.append(el('span', 'h1', lead), el('span', 'h2', accent));
    stage.append(headline);
  }
  const person = copy.people[shot.profile];
  const win = el('div', 'win');
  win.append(buildBar(person, Boolean(shot.popup)), buildPage(copy, person, shot));
  if (shot.popup) win.append(buildPopup());
  stage.append(win);
}

function buildBar(person, popupOpen) {
  const bar = el('div', 'bar');
  const dots = el('span', 'dots');
  dots.append(el('i'), el('i'), el('i'));
  const nav = el('span', 'nav');
  nav.append(icon(18, ICONS.back), icon(18, ICONS.forward), icon(18, ICONS.reload));
  const url = el('span', 'url');
  url.append(icon(15, ICONS.lock, { viewBox: '0 0 16 16', stroke: 1.5 }), document.createTextNode(`linkedin.com/in/${person.slug}`));
  // het echte werkbalkicoon van de extensie, ingedrukt als de popup open is
  const ext = el('span', popupOpen ? 'ext open' : 'ext');
  const img = el('img');
  img.src = 'icons/icon48.png';
  img.alt = '';
  ext.append(img);
  const me = el('span', 'me');
  me.append(icon(18, ICONS.person));
  bar.append(dots, nav, url, ext, me);
  return bar;
}

function buildPage(copy, person, shot) {
  const page = el('div', 'page');
  page.append(buildLinkedInNav(copy.linkedin));
  const scroller = el('div', 'scroller');
  // in de variant met kop is het venster lager: de bezoeker heeft iets gescrold
  if (variant === 'store') scroller.style.transform = 'translateY(-120px)';
  const layout = el('div', 'layout');
  const col = el('div', 'col');
  col.append(
    buildTopCard(copy.linkedin, person, shot),
    buildNoteCard(copy, shot),
    buildSkeletonCard(copy.linkedin.about, ['', 'w94', 'w86', 'w60']),
    buildSkeletonCard(copy.linkedin.activity, ['', 'w86', 'w40']),
  );
  const rail = el('div', 'rail');
  rail.append(buildAlsoViewed(copy.linkedin));
  layout.append(col, rail);
  scroller.append(layout);
  page.append(scroller);
  return page;
}

function buildLinkedInNav(li) {
  const nav = el('div', 'linav');
  const inner = el('div', 'in');
  const search = el('div', 'search');
  search.append(icon(16, ICONS.search), document.createTextNode(li.search));
  const items = el('div', 'items');
  const icons = [ICONS.home, ICONS.network, ICONS.jobs, ICONS.messaging, ICONS.bell];
  for (const [i, label] of li.nav.entries()) {
    const item = el('div', i === li.nav.length - 1 ? 'item me-item' : 'item');
    item.append(i < icons.length ? icon(24, icons[i], { stroke: 1.6 }) : el('span', 'face'), el('span', null, label));
    items.append(item);
  }
  inner.append(search, items);
  nav.append(inner);
  return nav;
}

function buildTopCard(li, person, shot) {
  const card = el('section', 'card topcard');
  card.style.setProperty('--h', person.hue);
  const avatar = el('div', 'avatar', person.initials);
  const info = el('div', 'info');
  const name = el('div', 'name', person.name);
  name.append(el('span', 'deg', ` · ${li.degree}`));
  const meta = el('div', 'meta', `${person.location} · `);
  meta.append(el('span', 'link', li.contactInfo));
  const actions = el('div', 'actions');
  actions.append(el('span', 'li-btn primary', li.message), buildAddButton(shot.button), el('span', 'li-btn muted', li.more));
  info.append(name, el('div', 'li-headline', person.headline), meta, el('div', 'conns', li.connections), actions);
  card.append(el('div', 'banner'), avatar, info);
  return card;
}

// "Add to Rldnk", zoals injectCRMButton in main.js hem bouwt: een <button> met de
// classes van de Berichtknop ernaast, een label in twee spans en 8px marge.
function buildAddButton(state) {
  const button = el('button', 'li-btn primary');
  button.id = 'crm-add-button';
  button.style.marginLeft = '8px';
  const wrapper = el('span');
  wrapper.append(el('span', null, state === 'added' ? 'Already added ✔️' : 'Add to Rldnk'));
  button.append(wrapper);
  button.disabled = state === 'added';
  return button;
}

// De notitiekaart, met de inline stijlen uit main.js. Eén afwijking: main.js
// gebruikt de systeemletter van het besturingssysteem (San Francisco op een
// Mac, Segoe UI op Windows); hier staat Inter, die daar het dichtst bij komt.
function buildNoteCard(copy, shot) {
  const container = el('div');
  container.id = 'rolodink-context-field';
  Object.assign(container.style, {
    marginBottom: '12px', padding: '12px', backgroundColor: '#fff', border: '1px solid #e0e0e0',
    borderRadius: '8px', display: 'flex', flexDirection: 'column', position: 'relative', fontFamily: "'Inter', sans-serif",
  });

  const header = el('div');
  Object.assign(header.style, { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' });
  const title = el('span', null, 'Rolodink Note');
  Object.assign(title.style, { fontWeight: '600', color: '#0a66c2', fontSize: '14px' });
  const close = el('button', null, '×');
  Object.assign(close.style, { background: 'none', border: 'none', fontSize: '18px', lineHeight: '1', color: 'rgba(0,0,0,0.6)', padding: '0' });
  header.append(title, close);

  const textarea = el('textarea');
  textarea.placeholder = 'Add a private note...';
  Object.assign(textarea.style, {
    width: '100%', minHeight: '60px', padding: '8px', border: '1px solid #d9d9d9', borderRadius: '4px',
    resize: 'vertical', fontSize: '14px', fontFamily: 'inherit', boxSizing: 'border-box', color: 'rgba(0,0,0,0.9)',
  });
  const own = copy.connections.find(c => c.id === shot.profile);
  if (shot.card === 'saved' && own) textarea.value = own.notes;

  const footer = el('div');
  Object.assign(footer.style, { display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '8px', marginTop: '4px', height: '16px' });
  const status = el('div', null, shot.card === 'saved' ? 'Saved' : 'Not in Rldnk yet');
  Object.assign(status.style, { fontSize: '12px', color: 'gray', textAlign: 'right' });
  footer.append(status);

  container.append(header, textarea, footer);
  // een zacht accent zodat het oog de kaart vindt; de kaart zelf blijft zoals main.js hem bouwt
  if (shot.highlight === 'card') container.classList.add('spot');
  return container;
}

function buildSkeletonCard(title, lines) {
  const card = el('section', 'card');
  const body = el('div', 'body');
  body.append(el('h2', null, title));
  for (const width of lines) body.append(el('div', `line ${width}`.trim()));
  card.append(body);
  return card;
}

function buildAlsoViewed(li) {
  const card = el('section', 'card');
  const body = el('div', 'body');
  body.append(el('h2', null, li.alsoViewed));
  for (const hue of [210, 20, 140]) {
    const row = el('div', 'person');
    row.style.setProperty('--h', hue);
    const lines = el('div', 'lines');
    lines.append(el('div', 'line w60'), el('div', 'line w94'), el('div', 'pill'));
    row.append(el('div', 'pic'), lines);
    body.append(row);
  }
  card.append(body);
  return card;
}

function buildPopup() {
  const popup = el('div', 'popup');
  const frame = el('iframe');
  frame.title = 'Rolodink';
  frame.src = 'popup/index.html';
  popup.append(frame);
  return popup;
}

// De popup gebruikt de systeemletter (-apple-system, 'Segoe UI', Roboto, …). Op
// deze Linux-renderer valt die terug op een Helvetica-kloon; met Inter onder
// 'Segoe UI' lijkt hij meer op wat gebruikers op een Mac of Windows zien.
async function popupLoaded() {
  const frame = document.querySelector('.popup iframe');
  if (!frame) return;
  if (frame.contentDocument?.readyState !== 'complete') {
    await new Promise(resolve => frame.addEventListener('load', resolve, { once: true }));
  }
  const doc = frame.contentDocument;
  const style = doc.createElement('style');
  style.textContent = "@font-face { font-family: 'Segoe UI'; font-weight: 100 900; src: url('../fonts/inter.woff2') format('woff2-variations'); }";
  doc.head.append(style);
  await doc.fonts.load("16px 'Segoe UI'");
  await doc.fonts.ready;
}

// ---------- promotegels ----------

// Het logo is het extensie-icoon zelf, schermvullend: zo ziet de listing er hetzelfde uit
// als de knop in de werkbalk.
function buildLogo(stage) {
  stage.className = 'logo';
  const img = el('img');
  img.src = 'afbeeldingen/rolodink.png';
  img.alt = '';
  stage.append(img);
}

function buildTile(stage, kind) {
  stage.className = `tile ${kind}`;
  const lockup = el('div', 'lockup');
  const appicon = el('span', 'appicon');
  const img = el('img');
  img.src = 'afbeeldingen/rolodink.png';
  img.alt = '';
  appicon.append(img);
  lockup.append(appicon, el('span', 'wordmark', 'Rolodink'));
  stage.append(lockup);
  if (kind !== 'tile-marquee') return;
  const deck = el('div', 'deck');
  for (const [hue, cls] of [[32, 'c1'], [205, 'c2'], [160, 'c3']]) {
    const card = el('div', `rcard ${cls}`);
    card.style.setProperty('--h', hue);
    const top = el('div', 'top');
    const nm = el('div', 'nm');
    nm.append(el('i'), el('i'));
    top.append(el('div', 'dot'), nm);
    const note = el('div', 'note');
    note.append(el('i'), el('i'));
    card.append(top, note);
    deck.append(card);
  }
  stage.append(deck, el('div', 'drop'));
}

try {
  await load();
} catch (error) {
  globalThis.__error = String(error);
  console.error(error);
}
