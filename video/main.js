'use strict';

/*
 * Rolodink — uitlegvideo (19 s, 1920×1080, 60 fps)
 *
 * Alles hangt aan één functie: render(t). Er lopen geen CSS-animaties of
 * transities; elke eigenschap wordt uit de tijd t berekend. Daardoor levert
 * render.mjs frame voor frame exact hetzelfde beeld op, en kun je in de preview
 * vrij door de tijdlijn scrubben.
 *
 *   0,0 –  3,1  vraag   "Wie was dat ook alweer?" → de camera vliegt door de o
 *   2,4 –  6,0  merk    Rolodink rolt in als kaartjes in een rolodex, het doek valt weg
 *   5,4 –  9,0  stap 1  profiel openen, Add to Rldnk
 *   9,0 – 12,5  stap 2  notitie typen, versleuteld opgeslagen
 *  12,5 – 15,3  stap 3  popup openen, zoeken op "zeil"
 *  15,3 – 19,0  slot    het zoekresultaat klapt om: "Van connectie naar relatie."
 */

(() => {
  const FPS = 60;
  const DURATION = 19;
  const RENDER = new URLSearchParams(location.search).has('render');
  if (RENDER) document.body.classList.add('render');

  // ---------- rekenhulp ----------
  const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  const lerp = (a, b, t) => a + (b - a) * t;
  const prog = (t, start, dur) => clamp((t - start) / dur);
  const E = {
    inQuad: x => x * x,
    inCubic: x => x * x * x,
    outCubic: x => 1 - Math.pow(1 - x, 3),
    inOutCubic: x => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2),
    outQuart: x => 1 - Math.pow(1 - x, 4),
    inOutQuart: x => (x < 0.5 ? 8 * x ** 4 : 1 - Math.pow(-2 * x + 2, 4) / 2),
    outExpo: x => (x >= 1 ? 1 : 1 - Math.pow(2, -10 * x)),
    // gedempte veer: schiet ~20% door en komt tot rust
    spring: x => (x >= 1 ? 1 : 1 - Math.exp(-6.5 * x) * Math.cos(11 * x)),
  };
  const rng = seed => {
    let s = seed >>> 0;
    return () => (s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296;
  };

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const stage = $('#stage');
  let stageScale = 1;

  // Rechthoek van een element in stage-coördinaten (ook als de preview geschaald is).
  function box(el) {
    const r = el.getBoundingClientRect();
    const s = stage.getBoundingClientRect();
    const x = (r.left - s.left) / stageScale;
    const y = (r.top - s.top) / stageScale;
    const w = r.width / stageScale;
    const h = r.height / stageScale;
    return { x, y, w, h, cx: x + w / 2, cy: y + h / 2 };
  }

  // Elementen binnen een verborgen scène krijgen '' in plaats van 'visible',
  // anders breken ze door de verborgen ouder heen.
  const show = (el, on) => (el.style.visibility = on ? '' : 'hidden');

  function splitWords(el) {
    const words = el.textContent.trim().split(/\s+/);
    el.textContent = '';
    return words.map((word, i) => {
      const mask = document.createElement('span');
      mask.className = 'wm';
      const inner = document.createElement('span');
      inner.className = 'wi';
      inner.textContent = word;
      mask.appendChild(inner);
      el.appendChild(mask);
      if (i < words.length - 1) el.appendChild(document.createTextNode(' '));
      return inner;
    });
  }

  function splitChars(el) {
    const chars = [...el.textContent];
    el.textContent = '';
    return chars.map(c => {
      const span = document.createElement('span');
      span.className = 'ch';
      span.textContent = c === ' ' ? ' ' : c;
      el.appendChild(span);
      return span;
    });
  }

  // Verticale bewegingsonscherpte via een SVG-filter per element.
  const SVGNS = 'http://www.w3.org/2000/svg';
  const blurFilters = new Map();
  function vblur(el, id, sigma) {
    if (sigma < 0.4) {
      el.style.filter = 'none';
      return;
    }
    let fe = blurFilters.get(id);
    if (!fe) {
      const f = document.createElementNS(SVGNS, 'filter');
      f.setAttribute('id', id);
      f.setAttribute('x', '-10%');
      f.setAttribute('y', '-50%');
      f.setAttribute('width', '120%');
      f.setAttribute('height', '200%');
      fe = document.createElementNS(SVGNS, 'feGaussianBlur');
      f.appendChild(fe);
      $('#filters').appendChild(f);
      blurFilters.set(id, fe);
    }
    fe.setAttribute('stdDeviation', `0 ${Math.min(sigma, 24).toFixed(2)}`);
    el.style.filter = `url(#${id})`;
  }

  // Woorden die uit een masker omhoog komen (en er eventueel weer uit vertrekken).
  function wordsIn(items, t, tin, { stagger = 0.07, dur = 0.9, rot = 0, tout = 99, sink = false } = {}) {
    items.forEach((el, i) => {
      const pin = E.outExpo(prog(t, tin + i * stagger, dur));
      const pout = E.inOutQuart(prog(t, tout + i * 0.025, 0.34));
      const y = (1 - pin) * 112 + (sink ? 1 : -1) * pout * 112;
      el.style.transform = `translateY(${y.toFixed(3)}%) rotate(${((1 - pin) * rot).toFixed(3)}deg)`;
    });
  }

  // Letters die scherp worden terwijl ze omhoog drijven.
  function charsBlurIn(items, t, start, stagger, dur) {
    items.forEach((el, i) => {
      const p = prog(t, start + i * stagger, dur);
      const e = E.outCubic(p);
      el.style.opacity = clamp(p * 1.8).toFixed(3);
      el.style.transform = `translateY(${((1 - e) * 0.42).toFixed(4)}em)`;
      el.style.filter = e < 0.999 ? `blur(${((1 - e) * 16).toFixed(2)}px)` : 'none';
    });
  }

  // =====================================================================
  // Scène 1 — "Wie was dat ook alweer?"
  // =====================================================================
  const PAL = {
    ink: ['#3A4C85', '#1B2951'],
    blue: ['#4B97E6', '#0A66C2'],
    gold: ['#E0B443', '#B8860B'],
    electric: ['#6A95FF', '#1263FE'],
    teal: ['#3CD6B0', '#0E9F7E'],
    coral: ['#F4AE93', '#D2654A'],
  };
  // naam, rol, kleur, middelpunt x/y, rotatie
  const CHIPS = [
    ['Lotte Bakker', 'UX Lead', 'gold', 262, 150, -6],
    ['Daan de Wit', 'Founder', 'blue', 690, 106, 4],
    ['Mehmet Kaya', 'Investeerder', 'teal', 1218, 124, -3],
    ['Eva Jansen', 'Recruiter', 'ink', 1650, 178, 5],
    ['Joris Smit', 'Sales', 'electric', 190, 464, 5],
    ['Noor El Amrani', 'CFO', 'coral', 1708, 452, -5],
    ['Bram Hoekstra', 'Engineer', 'ink', 224, 742, -4],
    ['Tim de Groot', 'Consultant', 'gold', 1704, 752, 4],
    ['Fleur Mulder', 'Marketing', 'teal', 380, 966, 3],
    ['Sanne Visser', 'Head of Talent', 'coral', 818, 992, -3],
    ['Iris Vos', 'Product', 'blue', 1244, 968, 4],
    ['Sem Bos', 'Designer', 'electric', 1636, 956, -4],
  ];
  const APPEAR = [3, 9, 0, 6, 11, 4, 1, 8, 5, 10, 2, 7];
  const FORGET = [5, 0, 8, 2, 10, 4, 7, 1, 11, 3, 9, 6];
  const Z0 = 2.5; // start van de zoom door de o
  const ZD = 0.62;
  const INK_DROP = Z0 - 0.16; // de binnenruimte van de o loopt vol met navy

  const s1 = $('#s1');
  const s1bg = $('#s1bg');
  const s1cam = $('#s1cam');
  let chips = [];
  let hookWords = [];
  let hookChars = [];
  let oPt = { x: 0, y: 0 };
  let counter = null; // masker in de vorm van de binnenruimte van de o

  function initialsOf(name) {
    const parts = name.split(' ');
    return parts[0][0] + parts[parts.length - 1][0];
  }

  // Tekent de o op een canvas en vult de binnenruimte (flood fill) tot een masker.
  // Het masker wordt een paar pixels opgerekt, zodat de navy scène netjes onder de
  // binnenrand van de gouden letter doorloopt.
  function buildCounterMask(o, baseline) {
    const K = 3;
    const fs = parseFloat(getComputedStyle(o).fontSize);
    const font = `italic 400 ${fs * K}px "Instrument Serif"`;
    const c = document.createElement('canvas');
    let ctx = c.getContext('2d');
    ctx.font = font;
    const m = ctx.measureText('o');
    const L = Math.ceil(m.actualBoundingBoxLeft);
    const R = Math.ceil(m.actualBoundingBoxRight);
    const A = Math.ceil(m.actualBoundingBoxAscent);
    const D = Math.ceil(m.actualBoundingBoxDescent);
    const pad = 12;
    const W = L + R + pad * 2;
    const H = A + D + pad * 2;
    c.width = W;
    c.height = H;
    ctx = c.getContext('2d');
    ctx.font = font;
    ctx.fillStyle = '#000';
    ctx.fillText('o', pad + L, pad + A);
    const src = ctx.getImageData(0, 0, W, H).data;

    const inside = new Uint8Array(W * H);
    const stack = [Math.round(pad + (A + D) / 2) * W + Math.round(pad + (L + R) / 2)];
    while (stack.length) {
      const p = stack.pop();
      if (inside[p] || src[p * 4 + 3] > 110) continue;
      inside[p] = 1;
      const x = p % W;
      if (x > 0) stack.push(p - 1);
      if (x < W - 1) stack.push(p + 1);
      if (p >= W) stack.push(p - W);
      if (p < W * (H - 1)) stack.push(p + W);
    }

    const grow = 2 * K;
    const dilate = (from, to, step, len, lines, lineStep) => {
      for (let l = 0; l < lines; l++) {
        const base = l * lineStep;
        let last = -1e9;
        const left = new Int32Array(len);
        for (let i = 0; i < len; i++) {
          if (from[base + i * step]) last = i;
          left[i] = i - last;
        }
        last = 1e9;
        for (let i = len - 1; i >= 0; i--) {
          if (from[base + i * step]) last = i;
          to[base + i * step] = left[i] <= grow || last - i <= grow ? 1 : 0;
        }
      }
    };
    const tmp = new Uint8Array(W * H);
    const out = new Uint8Array(W * H);
    dilate(inside, tmp, 1, W, H, W);
    dilate(tmp, out, W, H, W, 1);

    const img = ctx.createImageData(W, H);
    for (let p = 0; p < W * H; p++) if (out[p]) img.data[p * 4 + 3] = 255;
    ctx.clearRect(0, 0, W, H);
    ctx.putImageData(img, 0, 0);

    const ob = box(o);
    return {
      url: `url(${c.toDataURL('image/png')})`,
      x: ob.x - (pad + L) / K,
      y: baseline - (pad + A) / K,
      w: W / K,
      h: H / K,
      cx: ob.x + (R - L) / 2 / K,
      cy: baseline - (A - D) / 2 / K,
    };
  }

  function buildS1() {
    const root = $('#chips');
    chips = CHIPS.map(([name, role, pal, x, y, rot], i) => {
      const el = document.createElement('div');
      el.className = 'chip';
      el.innerHTML =
        `<div class="av" style="background:linear-gradient(135deg,${PAL[pal][0]},${PAL[pal][1]})">` +
        `<span class="ini">${initialsOf(name)}</span><span class="q">?</span></div>` +
        `<div class="tx"><div class="nm">${name}</div><div class="rl">${role}</div><div class="sk"><i></i><i></i></div></div>`;
      root.appendChild(el);
      return {
        el, x, y, rot, i,
        appear: APPEAR[i], forget: FORGET[i],
        ini: $('.ini', el), q: $('.q', el), nm: $('.nm', el), rl: $('.rl', el), sk: $('.sk', el),
      };
    });
    chips.forEach(c => {
      c.el.style.left = `${c.x - c.el.offsetWidth / 2}px`;
      c.el.style.top = `${c.y - c.el.offsetHeight / 2}px`;
    });

    hookWords = splitWords($('#hook .l1'));
    hookChars = splitChars($('#hook .l2'));
    hookChars[hookChars.length - 1].style.transformOrigin = '40% 85%';

    // De o van "ook": de camera vliegt door zijn binnenruimte naar de volgende scène.
    const o = hookChars[0];
    const marker = document.createElement('i');
    marker.style.cssText = 'display:inline-block;width:0;height:0;vertical-align:baseline';
    o.appendChild(marker);
    const baseline = box(marker).y;
    marker.remove();
    counter = buildCounterMask(o, baseline);
    oPt = { x: counter.cx, y: counter.cy };
  }

  const pushAt = t => 1 + 0.045 * E.inOutCubic(prog(t, 0, 2.6));
  const zoomAt = t => Math.pow(72, E.inCubic(prog(t, Z0, ZD)));

  function renderS1(t) {
    const visible = t < Z0 + ZD + 0.02;
    s1.style.visibility = s1bg.style.visibility = visible ? 'visible' : 'hidden';
    if (!visible) return;

    chips.forEach(c => {
      const a0 = 0.04 + c.appear * 0.05;
      const pa = prog(t, a0, 0.85);
      const scale = lerp(0.55, 1, E.spring(pa));
      const dx = Math.sin(t * 0.9 + c.i * 1.7) * 9;
      const dy = Math.cos(t * 0.75 + c.i * 2.3) * 7;
      const rot = c.rot + Math.sin(t * 0.6 + c.i) * 1.2;
      // vergeten: namen vervagen tot grijze balkjes, initialen worden een vraagteken
      const f0 = 1.22 + c.forget * 0.07;
      const f = E.inOutCubic(prog(t, f0, 0.55));
      c.el.style.transform = `translate(${dx.toFixed(2)}px, ${dy.toFixed(2)}px) rotate(${rot.toFixed(2)}deg) scale(${scale.toFixed(4)})`;
      c.el.style.opacity = (clamp(prog(t, a0, 0.2)) * lerp(1, 0.72, f)).toFixed(3);
      const textBlur = f > 0.001 ? `blur(${(f * 7).toFixed(2)}px)` : 'none';
      c.nm.style.opacity = c.rl.style.opacity = (1 - f).toFixed(3);
      c.nm.style.filter = c.rl.style.filter = textBlur;
      c.sk.style.opacity = f.toFixed(3);
      c.ini.style.opacity = (1 - f).toFixed(3);
      c.q.style.opacity = f.toFixed(3);
      c.q.style.transform = `scale(${lerp(0.3, 1, E.spring(prog(t, f0 + 0.15, 0.6))).toFixed(4)})`;
    });

    wordsIn(hookWords, t, 0.15, { stagger: 0.09, dur: 0.9, rot: 7 });
    charsBlurIn(hookChars, t, 0.52, 0.04, 0.72);
    // het vraagteken wiebelt even na
    const qt = t - 1.2;
    if (qt > 0) {
      const q = hookChars[hookChars.length - 1];
      q.style.transform += ` rotate(${(10 * Math.sin(qt * 10) * Math.exp(-qt * 2.3)).toFixed(3)}deg)`;
    }

    // langzame push-in, daarna de zoom door de o
    s1cam.style.transformOrigin = `${oPt.x.toFixed(2)}px ${oPt.y.toFixed(2)}px`;
    s1cam.style.transform = `scale(${(pushAt(t) * zoomAt(t)).toFixed(5)})`;
  }

  // =====================================================================
  // Scène 2 — het merk
  // =====================================================================
  const s2 = $('#s2');
  const LOCK_HOME = { cx: 960, cy: 452 };
  const LOCK_HUD = { x: 76, y: 48, s: 0.215 };
  const ROLL_STEP = 1.25; // afstand tussen de letters in de rolstrook (em)
  let lockSize = { w: 0, h: 0 };
  let lockups = [];
  let tagWords = [];

  function buildLockup(root) {
    root.innerHTML = '<span class="appicon"><img src="../afbeeldingen/rolodink.png" alt=""></span><span class="lword"></span>';
    const word = $('.lword', root);
    const r = rng(11);
    const slots = [...'Rolodink'].map((ch, i) => {
      const slot = document.createElement('span');
      slot.className = 'lslot';
      const strip = document.createElement('span');
      strip.className = 'lstrip';
      const pool = ch === ch.toUpperCase() ? 'BDGHKMNPSTUVZ' : 'abcdeghkmnopqrsuvxyz';
      const seq = [''];
      for (let k = 0; k < 5 + (i % 3); k++) seq.push(pool[Math.floor(r() * pool.length)]);
      seq.push(ch);
      seq.forEach(g => {
        const s = document.createElement('span');
        s.textContent = g;
        strip.appendChild(s);
      });
      slot.appendChild(strip);
      word.appendChild(slot);
      return { slot, strip, n: seq.length, ch };
    });
    // elke gleuf zo breed als zijn eindletter, dus de spatiëring klopt als alles stilstaat
    const meas = document.createElement('span');
    meas.style.cssText = 'position:absolute;visibility:hidden;white-space:pre';
    word.appendChild(meas);
    slots.forEach(s => {
      meas.textContent = s.ch;
      s.slot.style.width = `${meas.getBoundingClientRect().width / stageScale}px`;
    });
    meas.remove();
    return { root, icon: $('.appicon', root), slots };
  }

  function buildS2() {
    lockups = [buildLockup($('#lockPaper')), buildLockup($('#lockInk'))];
    lockSize = { w: lockups[0].root.offsetWidth, h: lockups[0].root.offsetHeight };
    tagWords = [...splitWords($('#tagline .t1')), ...splitWords($('#tagline .t2'))];
  }

  function lockupTransform(t) {
    const intro = E.outCubic(prog(t, 2.85, 1.0));
    let s = lerp(1.18, 1, intro); // de zoom loopt nog even door
    let x = LOCK_HOME.cx - (lockSize.w * s) / 2;
    let y = LOCK_HOME.cy - (lockSize.h * s) / 2;
    const mp = E.inOutQuart(prog(t, 5.2, 0.76));
    if (mp > 0) {
      x = lerp(x, LOCK_HUD.x, mp);
      y = lerp(y, LOCK_HUD.y, mp);
      s = Math.exp(lerp(Math.log(s), Math.log(LOCK_HUD.s), mp));
    }
    return `translate(${x.toFixed(2)}px, ${y.toFixed(2)}px) scale(${s.toFixed(5)})`;
  }

  function renderLockups(t) {
    const xf = lockupTransform(t);
    const ip = prog(t, 2.9, 0.95);
    lockups.forEach(L => {
      L.root.style.transform = xf;
      L.icon.style.transform = `scale(${E.spring(ip).toFixed(4)}) rotate(${((1 - E.outCubic(ip)) * -26).toFixed(3)}deg)`;
      L.icon.style.opacity = clamp(ip * 4).toFixed(3);
      // de letters rollen als kaartjes in een rolodex naar hun plek
      L.slots.forEach((s, i) => {
        const st = 3.0 + i * 0.055;
        const d = 0.7 + i * 0.035;
        const y = E.outQuart(prog(t, st, d)) * (s.n - 1) * ROLL_STEP;
        const yPrev = E.outQuart(prog(t - 1 / FPS, st, d)) * (s.n - 1) * ROLL_STEP;
        s.strip.style.transform = `translateY(${(-y).toFixed(4)}em)`;
        vblur(s.strip, `lk${i}`, Math.abs(y - yPrev) * 204 * 0.42);
      });
    });
  }

  let maskOn = false;
  function setMask(on) {
    if (on === maskOn) return;
    maskOn = on;
    for (const p of ['maskImage', 'webkitMaskImage']) s2.style[p] = on ? counter.url : 'none';
    for (const p of ['maskRepeat', 'webkitMaskRepeat']) s2.style[p] = 'no-repeat';
  }

  function renderS2(t) {
    const visible = t >= INK_DROP && t < 6.05;
    s2.style.visibility = visible ? 'visible' : 'hidden';
    if (!visible) return;

    if (t < Z0 + ZD) {
      // De navy scène vult de binnenruimte van de o (een druppel inkt) en groeit
      // met de zoom mee tot hij het hele beeld is.
      const z = pushAt(t) * zoomAt(t);
      setMask(true);
      const mx = oPt.x + z * (counter.x - oPt.x);
      const my = oPt.y + z * (counter.y - oPt.y);
      const size = `${(counter.w * z).toFixed(2)}px ${(counter.h * z).toFixed(2)}px`;
      const pos = `${mx.toFixed(2)}px ${my.toFixed(2)}px`;
      s2.style.maskSize = s2.style.webkitMaskSize = size;
      s2.style.maskPosition = s2.style.webkitMaskPosition = pos;
      const r = counter.h * z * E.outCubic(prog(t, INK_DROP, 0.3));
      s2.style.clipPath = `circle(${r.toFixed(2)}px at ${oPt.x.toFixed(2)}px ${oPt.y.toFixed(2)}px)`;
    } else if (t < 5.28) {
      setMask(false);
      s2.style.clipPath = 'none';
    } else {
      // het doek valt schuin naar beneden weg
      setMask(false);
      const cp = E.inOutCubic(prog(t, 5.28, 0.74));
      const e = lerp(-180, 1080 + 190, cp);
      s2.style.clipPath = `polygon(0px ${e.toFixed(2)}px, 1920px ${(e - 180).toFixed(2)}px, 1920px 1100px, 0px 1100px)`;
    }

    wordsIn(tagWords, t, 3.86, { stagger: 0.06, dur: 0.9, tout: 5.0, sink: true });
  }

  // =====================================================================
  // Scène 3-5 — de drie stappen
  // =====================================================================
  const steps = $('#steps');
  const win = $('#win');
  const scroller = $('#scroller');
  const btn = $('#rldnkBtn');
  const btnA = $('#rldnkBtn .bt.a');
  const btnB = $('#rldnkBtn .bt.b');
  const noteCard = $('#noteCard');
  const ta = $('#ta');
  const typed = $('#typed');
  const caret = $('#caret');
  const placeholder = $('#ta .ph');
  const statusEls = $$('#status .s');
  const sticker = $('#sticker');
  const extIcon = $('#extIcon');
  const winDim = $('#winDim');
  const popup = $('#popup');
  const pq = $('#pq');
  const pph = $('.pph');
  const pcaret = $('#pcaret');
  const pinfo = $('#pinfo');

  // Wissels tussen de stappen: nummer, titel en onderregel rollen tegelijk door.
  const STEP_FIRST = 5.62; // eerste binnenkomst, na het doek
  const SWITCH = [9.0, 12.45];
  const DIGIT = 210; // hoogte van één cijfer (0,84 × 250 px)
  const SCROLL = 150;
  const POPUP_SCALE = 1.12;

  const NOTE = 'Ontmoet op DDW. Zoekt een CTO. Restaureert zeilboten.';
  const QUERY = 'zeil';
  const QUERY_TIMES = [13.62, 13.75, 13.87, 14.0];
  const noteTimes = [];

  const PCARDS = [
    ['Lotte Bakker', 'UX Lead bij Studio Noord', 'gold', 'Koffie gedaan in maart. Wil sparren over onderzoek.'],
    ['Daan de Wit', 'Founder bij Kiemkracht', 'blue', 'Pitch gezien in Rotterdam. Terugbellen na de zomer.'],
    ['Sanne Visser', 'Head of Talent bij Nordlicht', 'coral', 'Ontmoet op DDW. Zoekt een CTO. Restaureert <mark class="hl">zeil</mark>boten.'],
    ['Mehmet Kaya', 'Investeerder', 'teal', 'Intro via Eva. Interesse in HR-tech.'],
    ['Eva Jansen', 'Recruiter bij Talentlab', 'ink', 'Stuurt de vacature door naar haar netwerk.'],
  ];

  let titles = [];
  let subs = [];
  let numZeros = [];
  let numStrips = [];
  let fillItems = [];
  let fillW = 0;
  let btnW = { a: 0, b: 0 };
  let pcards = [];
  let sanne = null;

  function buildSteps() {
    titles = $$('.stitle').map(el => [...splitWords($('.l1', el)), ...splitWords($('.l2', el))]);
    titles.flat().forEach(w => (w.h = w.offsetHeight));
    subs = $$('.ssub .si');
    subs.forEach(s => (s.h = s.offsetHeight));
    numZeros = $$('#stepNum .zi');
    numStrips = $$('#stepNum .strip');
    fillItems = $$('#stepNum .fill .strip span');
    fillW = $('#stepNum .slot').offsetWidth;

    // breedte van de knop in beide toestanden
    const meas = document.createElement('span');
    meas.style.cssText = 'position:absolute;visibility:hidden;white-space:nowrap;font:600 21px/1 Inter';
    document.body.appendChild(meas);
    meas.textContent = btnA.textContent;
    btnW.a = meas.getBoundingClientRect().width / stageScale + 52 + 3;
    meas.innerHTML = btnB.innerHTML;
    $('svg', meas).style.cssText = 'width:19px;height:19px;margin-left:8px';
    btnW.b = meas.getBoundingClientRect().width / stageScale + 52 + 3;
    meas.remove();

    // typritme: snel, met een adempauze na elke zin
    const r = rng(5);
    let tt = 9.88;
    for (const ch of NOTE) {
      noteTimes.push(tt);
      tt += 0.017 + r() * 0.013 + (ch === '.' ? 0.1 : 0) + (ch === ' ' ? 0.006 : 0);
    }

    // de lijst in de popup
    const list = $('#plist');
    const check = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8.5l3.2 3.2L13 5" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    pcards = PCARDS.map(([name, role, pal, note]) => {
      const wrap = document.createElement('div');
      wrap.className = 'pwrap';
      wrap.innerHTML =
        `<div class="pcard"><span class="acc"></span>` +
        `<div class="pc-head"><span class="pc-av" style="background:linear-gradient(135deg,${PAL[pal][0]},${PAL[pal][1]})">${initialsOf(name)}</span>` +
        `<span class="pc-name">${name}<span class="pc-badge">${check}</span></span><span class="pc-link">in</span></div>` +
        `<div class="pc-role">${role}</div><div class="pc-note">${note}</div></div>`;
      list.appendChild(wrap);
      return { wrap, card: $('.pcard', wrap), acc: $('.acc', wrap), mark: $('mark', wrap), name };
    });
    pcards.forEach(c => {
      c.h = c.wrap.offsetHeight;
      c.wrap.style.height = `${c.h}px`;
      c.wrap.style.marginBottom = '12px';
    });
    sanne = pcards.find(c => c.name === 'Sanne Visser');
    // de voorkant van de omklapkaart is het zoekresultaat zoals het er dan bij staat
    const front = sanne.card.cloneNode(true);
    $('mark', front).style.setProperty('--hl', '100%');
    $('.acc', front).style.opacity = 1;
    $('#flipFront').appendChild(front);
  }

  // Hoek op de rolodex-trommel voor een woord dat per stap binnenrolt en weer
  // wegdraait: -90° is onder de trommel, 0° recht voor je, +90° eroverheen weg.
  function stepAngle(t, k, delay) {
    const tin = k === 0 ? STEP_FIRST : SWITCH[k - 1];
    const tout = SWITCH[k] ?? 99;
    const pin = k === 0
      ? E.outCubic(prog(t, tin + delay * 1.4, 0.85))
      : E.inOutQuart(prog(t, tin + delay, 0.62));
    const pout = E.inOutQuart(prog(t, tout + delay, 0.62));
    return -90 * (1 - pin) + 90 * pout;
  }

  function drum(el, id, a, aPrev) {
    const hidden = Math.abs(a) >= 89.5;
    show(el, !hidden);
    if (hidden) return;
    // draaien om een as achter de tekst; in rust is dit exact de identiteit
    const r = (el.h / 2).toFixed(1);
    el.style.transform = `perspective(900px) translateZ(-${r}px) rotateX(${a.toFixed(3)}deg) translateZ(${r}px)`;
    el.style.opacity = (1 - Math.pow(Math.abs(a) / 90, 2) * 0.55).toFixed(3);
    vblur(el, id, (Math.abs(a - aPrev) / 90) * el.h * 0.38);
  }

  function renderSteps(t) {
    const visible = t >= 5.2 && t < 16.4;
    steps.style.visibility = visible ? 'visible' : 'hidden';
    if (!visible) return;

    // --- browservenster ---
    const wp = E.outExpo(prog(t, 5.4, 1.2));
    const drift = E.inOutCubic(prog(t, 6.6, 8.6));
    const ry = lerp(-34, -10, wp) + 3.5 * drift;
    const rx = lerp(9, 3.5, wp) - 1.5 * drift;
    win.style.transform =
      `translate(${lerp(760, 0, wp).toFixed(2)}px, ${lerp(40, 0, wp).toFixed(2)}px) scale(${lerp(0.92, 1, wp).toFixed(4)}) ` +
      `rotateY(${ry.toFixed(3)}deg) rotateX(${rx.toFixed(3)}deg)`;
    win.style.opacity = clamp(prog(t, 5.4, 0.2)).toFixed(3);
    scroller.style.transform = `translateY(${(-SCROLL * E.inOutCubic(prog(t, 9.02, 0.62))).toFixed(2)}px)`;
    winDim.style.opacity = (0.12 * E.outCubic(prog(t, 13.02, 0.4))).toFixed(3);

    // --- groot stapnummer: de 0 blijft staan, het tweede cijfer rolt 1 → 2 → 3 ---
    const enter = x => E.outExpo(prog(x, 5.5, 1.0));
    const rollAt = x => (1 - enter(x)) * -1.06 + E.inOutQuart(prog(x, SWITCH[0] - 0.04, 0.62)) + E.inOutQuart(prog(x, SWITCH[1] - 0.04, 0.62));
    const roll = rollAt(t);
    numStrips.forEach(s => (s.style.transform = `translateY(${(-roll * DIGIT).toFixed(2)}px)`));
    const v = Math.abs(roll - rollAt(t - 1 / FPS)) * DIGIT;
    numStrips.forEach(s => vblur(s, 'num', v * 0.42));
    const zeroEnter = E.outExpo(prog(t, 5.44, 1.0));
    numZeros.forEach(z => (z.style.transform = `translateY(${((1 - zeroEnter) * DIGIT * 1.06).toFixed(2)}px)`));
    // elk cijfer loopt vol als een druppel, zodra zijn stap begint
    fillItems.forEach((el, k) => {
      const start = (k === 0 ? STEP_FIRST : SWITCH[k - 1]) + 0.45;
      const L = E.inOutCubic(prog(t, start, 1.15));
      if (L <= 0.001) {
        el.style.clipPath = 'inset(0 0 100% 0)';
        return;
      }
      const level = lerp(206, 4, L);
      const amp = 8 * Math.sin(Math.PI * L);
      const pts = [];
      for (let j = 0; j <= 20; j++) {
        const x = (fillW * j) / 20;
        const y = level + amp * Math.sin((j / 20) * Math.PI * 2.4 + t * 8 + k * 2);
        pts.push(`${x.toFixed(1)}px ${y.toFixed(1)}px`);
      }
      pts.push(`${fillW}px 230px`, '0px 230px');
      el.style.clipPath = `polygon(${pts.join(',')})`;
    });

    // --- titels en onderregels draaien per stap door als kaartjes op een rolodex ---
    titles.forEach((words, k) => {
      words.forEach((w, i) => {
        const d = 0.02 + i * 0.05;
        drum(w, `tw${k}${i}`, stepAngle(t, k, d), stepAngle(t - 1 / FPS, k, d));
      });
    });
    subs.forEach((s, k) => drum(s, `ts${k}`, stepAngle(t, k, 0.2), stepAngle(t - 1 / FPS, k, 0.2)));

    // --- stap 1: de knop wordt ingevoegd en aangeklikt ---
    const bi = prog(t, 6.32, 0.62);
    const done = E.inOutCubic(prog(t, 7.46, 0.34));
    btn.style.width = `${(lerp(0, btnW.a, E.outExpo(bi)) + (btnW.b - btnW.a) * done).toFixed(2)}px`;
    btn.style.marginRight = `${lerp(0, 12, E.outExpo(bi)).toFixed(2)}px`;
    btn.style.opacity = clamp(bi * 2.5).toFixed(3);
    btn.style.transform = `scale(${lerp(0.6, 1, E.spring(bi)).toFixed(4)})`;
    const glow = prog(t, 6.5, 0.9);
    btn.style.boxShadow = glow > 0 && glow < 1
      ? `0 0 0 ${(E.outCubic(glow) * 16).toFixed(2)}px rgba(59, 253, 203, ${(0.65 * (1 - glow)).toFixed(3)})`
      : 'none';
    btnA.style.transform = `translateY(${(-done * 110).toFixed(2)}%)`;
    btnB.style.transform = `translateY(${((1 - done) * 110).toFixed(2)}%)`;

    // --- stap 2: typen, opslaan ---
    const focus = E.outCubic(prog(t, 9.68, 0.2));
    ta.style.borderColor = focus > 0 ? `rgba(10, 102, 194, ${focus.toFixed(3)})` : '';
    ta.style.boxShadow = focus > 0 ? `0 0 0 ${(4 * focus).toFixed(2)}px rgba(10, 102, 194, .14)` : 'none';
    let n = 0;
    while (n < NOTE.length && noteTimes[n] <= t) n++;
    typed.textContent = NOTE.slice(0, n);
    placeholder.style.opacity = n > 0 ? 0 : 1;
    const lastKey = n > 0 ? noteTimes[n - 1] : 9.68;
    const blinkOn = t - lastKey < 0.45 || Math.floor((t - lastKey - 0.45) / 0.5) % 2 === 1;
    caret.style.opacity = t >= 9.68 && t < 12.5 && blinkOn ? 1 : 0;

    const statusWindows = [[noteTimes[0], 11.55], [11.55, 11.92], [11.92, 99]];
    statusEls.forEach((el, k) => {
      const [a, b] = statusWindows[k];
      const pin = E.outCubic(prog(t, a, 0.22));
      const pout = E.inCubic(prog(t, b, 0.18));
      el.style.transform = `translateY(${((1 - pin) * 100 - pout * 100).toFixed(2)}%)`;
      el.style.opacity = (pin * (1 - pout)).toFixed(3);
    });

    // --- stap 3: popup, zoeken, filteren ---
    const po = prog(t, 13.02, 0.45);
    show(popup, po > 0);
    if (po > 0) {
      const eb = box(extIcon);
      popup.style.left = `${(eb.x + eb.w + 8 - popup.offsetWidth).toFixed(2)}px`;
      popup.style.top = `${(eb.y + eb.h + 10).toFixed(2)}px`;
      popup.style.transform = `translateY(${lerp(-14, 0, E.outExpo(po)).toFixed(2)}px) scale(${(POPUP_SCALE * lerp(0.88, 1, E.outExpo(po))).toFixed(5)})`;
      popup.style.opacity = clamp(po * 3).toFixed(3);
    }
    const qn = QUERY_TIMES.filter(x => t >= x).length;
    pq.textContent = QUERY.slice(0, qn);
    pph.style.opacity = qn > 0 ? 0 : 1;
    const qLast = qn > 0 ? QUERY_TIMES[qn - 1] : 13.3;
    pcaret.style.opacity = po > 0.4 && (t - qLast < 0.45 || Math.floor((t - qLast - 0.45) / 0.5) % 2 === 1) ? 1 : 0;
    pinfo.style.height = `${(E.outCubic(prog(t, 14.16, 0.3)) * 40).toFixed(2)}px`;
    let j = 0;
    pcards.forEach(c => {
      if (c === sanne) return;
      const p = E.inOutCubic(prog(t, 14.16 + j * 0.045, 0.4));
      j++;
      c.wrap.style.height = `${lerp(c.h, 0, p).toFixed(2)}px`;
      c.wrap.style.marginBottom = `${lerp(12, 0, p).toFixed(2)}px`;
      c.card.style.opacity = (1 - p).toFixed(3);
      c.card.style.transform = `scale(${lerp(1, 0.92, p).toFixed(4)})`;
    });
    const hit = E.outCubic(prog(t, 14.45, 0.3));
    sanne.acc.style.opacity = hit.toFixed(3);
    sanne.card.style.boxShadow = `0 0 0 ${(2 * hit).toFixed(2)}px rgba(10, 102, 194, ${(0.9 * hit).toFixed(3)}), 0 14px 30px -14px rgba(7, 21, 51, ${(0.4 * hit).toFixed(3)})`;
    sanne.mark.style.setProperty('--hl', `${(E.inOutCubic(prog(t, 14.52, 0.34)) * 100).toFixed(2)}%`);

    // --- sticker onder de notitie zodra hij is opgeslagen ---
    const sp = prog(t, 11.98, 0.75);
    const sOut = E.inCubic(prog(t, 12.42, 0.3));
    show(sticker, sp > 0 && sOut < 1);
    if (sp > 0 && sOut < 1) {
      const nb = box(noteCard);
      sticker.style.transform =
        `translate(${(nb.x + nb.w - sticker.offsetWidth - 20).toFixed(2)}px, ${(nb.y + nb.h + 18).toFixed(2)}px) ` +
        `rotate(${lerp(-10, -2.5, E.outCubic(sp)).toFixed(3)}deg) scale(${(E.spring(sp) * (1 - 0.2 * sOut)).toFixed(4)})`;
      sticker.style.opacity = (clamp(sp * 4) * (1 - sOut)).toFixed(3);
    }
  }

  // =====================================================================
  // Overgang — het zoekresultaat klapt om als een rolodexkaart
  // =====================================================================
  const flip = $('#flip');
  const flipInner = $('#flipInner');
  const flipFaces = $$('#flip .face');
  const flipIcon = $('#flipIcon');
  const F0 = 15.28;
  const FLIP_SWAP = 15.84;
  const EXPAND = [15.84, 0.55];
  let flipFrom = null;

  function renderFlip(t) {
    const active = t >= F0 && t < 16.45;
    flip.style.visibility = active ? 'visible' : 'hidden';
    show(sanne.card, t < F0);
    if (t < F0) return;
    flipFrom = box(sanne.card);
    if (!active) return;
    const lift = E.outCubic(prog(t, F0, 0.3));
    const rot = 180 * E.inOutCubic(prog(t, 15.34, 0.5));
    const ex = E.inOutQuart(prog(t, ...EXPAND));
    const x = lerp(flipFrom.x, 0, ex);
    const y = lerp(flipFrom.y, 0, ex);
    const w = lerp(flipFrom.w, 1920, ex);
    const h = lerp(flipFrom.h, 1080, ex);
    flip.style.left = `${x.toFixed(2)}px`;
    flip.style.top = `${y.toFixed(2)}px`;
    flip.style.width = `${w.toFixed(2)}px`;
    flip.style.height = `${h.toFixed(2)}px`;
    const radius = `${lerp(16 * POPUP_SCALE, 0, ex).toFixed(2)}px`;
    flipFaces.forEach(f => (f.style.borderRadius = radius));
    flipFaces[0].style.boxShadow = `0 ${(34 * lift).toFixed(1)}px ${(70 * lift).toFixed(1)}px -24px rgba(7, 21, 51, ${(0.5 * lift).toFixed(3)})`;
    flipInner.style.transform = `scale(${(1 + 0.06 * lift * (1 - ex)).toFixed(4)}) rotateX(${rot.toFixed(3)}deg)`;
    $('.pcard', flipFaces[0]).style.transform = `scale(${(flipFrom.w / sanne.card.offsetWidth).toFixed(5)})`;
    show(flipIcon, t < FLIP_SWAP);
  }

  // =====================================================================
  // Scène 6 — slot
  // =====================================================================
  const s6 = $('#s6');
  const oIcon = $('#oIcon');
  const oLock = $('#oLock');
  const oWord = $('#oLock .oword');
  const swoosh = $('#swoosh path');
  const ctaParts = $$('#cta > span');
  const outro = $('#outro');
  let outroWords = [];
  let outroChars = [];
  let lockIconPos = { x: 0, y: 0 };
  let swooshLen = 0;
  const ICON_BASE = 100; // .tile is 100 × 98 px

  function buildS6() {
    outroWords = splitWords($('#outro .o1'));
    outroChars = splitChars($('#outro .o2t'));
    const wordW = oWord.offsetWidth;
    const iconW = 92;
    const gap = 24;
    const left = 960 - (iconW + gap + wordW) / 2;
    const cy = 196;
    lockIconPos = { x: left + iconW / 2, y: cy };
    oLock.style.left = `${left + iconW + gap}px`;
    oLock.style.top = `${cy - 45}px`;
    swooshLen = swoosh.getTotalLength();
    swoosh.style.strokeDasharray = `${swooshLen}`;
  }

  function renderS6(t) {
    s6.style.visibility = t >= 16.3 ? 'visible' : 'hidden';

    // het icoon van de achterkant van de kaart reist door naar het logo bovenaan
    oIcon.style.visibility = t >= FLIP_SWAP ? 'visible' : 'hidden';
    if (t >= FLIP_SWAP && flipFrom) {
      const ex = E.inOutQuart(prog(t, ...EXPAND));
      const mp = E.inOutCubic(prog(t, 16.28, 0.58));
      const cx = lerp(lerp(flipFrom.cx, 960, ex), lockIconPos.x, mp);
      const cy = lerp(lerp(flipFrom.cy, 540, ex), lockIconPos.y, mp);
      const size = lerp(lerp(74, 128, ex), 92, mp);
      oIcon.style.transform = `translate(${(cx - ICON_BASE / 2).toFixed(2)}px, ${(cy - 49).toFixed(2)}px) scale(${(size / ICON_BASE).toFixed(5)})`;
    }
    if (t < 16.3) return;

    oWord.style.transform = `translateX(${((1 - E.outExpo(prog(t, 16.78, 0.9))) * -104).toFixed(3)}%)`;
    wordsIn(outroWords, t, 16.6, { stagger: 0.085, dur: 1.0, rot: 5 });
    charsBlurIn(outroChars, t, 16.84, 0.026, 0.75);
    const draw = E.inOutCubic(prog(t, 17.3, 0.55));
    show(swoosh, draw > 0);
    swoosh.style.strokeDashoffset = `${(swooshLen * (1 - draw)).toFixed(2)}`;
    ctaParts.forEach((el, k) => {
      const p = E.outExpo(prog(t, 17.45 + k * 0.1, 0.9));
      el.style.transform = `translateY(${((1 - p) * 34).toFixed(2)}px)`;
      el.style.opacity = clamp(p * 1.4).toFixed(3);
    });
    outro.style.transform = `scale(${(1 + 0.014 * E.inOutCubic(prog(t, 16.6, 2.4))).toFixed(5)})`;
  }

  // =====================================================================
  // Cursor, klikken en vonken
  // =====================================================================
  const cursor = $('#cursor');
  const ripple = $('#ripple');
  const sparks = [];
  const CLICKS = [7.33, 9.66, 12.99];

  function buildFx() {
    const root = $('#sparks');
    for (let k = 0; k < 10; k++) {
      const i = document.createElement('i');
      root.appendChild(i);
      sparks.push(i);
    }
  }

  const target = {
    start: () => ({ x: 1990, y: 1170 }),
    button: () => { const b = box(btn); return { x: b.x + b.w * 0.42, y: b.y + b.h * 0.58 }; },
    note: () => { const b = box(ta); return { x: b.x + b.w * 0.64, y: b.y + b.h * 0.6 }; },
    rest: () => { const b = box(ta); return { x: b.x + b.w * 0.3, y: b.y + b.h + 160 }; },
    ext: () => { const b = box(extIcon); return { x: b.cx + 3, y: b.cy + 5 }; },
    aside: () => { const b = box(popup); return { x: b.x - 70, y: b.y + b.h * 0.52 }; },
  };
  const MOVES = [
    { t0: 6.45, t1: 7.28, from: target.start, to: target.button, arc: 80 },
    { t0: 8.98, t1: 9.62, from: target.button, to: target.note, arc: 46 },
    { t0: 9.92, t1: 10.4, from: target.note, to: target.rest, arc: -24 },
    { t0: 12.42, t1: 12.95, from: target.rest, to: target.ext, arc: -70 },
    { t0: 13.3, t1: 13.85, from: target.ext, to: target.aside, arc: 40 },
  ];

  function cursorAt(t) {
    let pos = MOVES[0].from();
    for (const m of MOVES) {
      if (t < m.t0) break;
      const p = E.inOutCubic(prog(t, m.t0, m.t1 - m.t0));
      const a = m.from();
      const b = m.to();
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const len = Math.hypot(dx, dy) || 1;
      const off = Math.sin(Math.PI * p) * m.arc;
      pos = { x: lerp(a.x, b.x, p) - (dy / len) * off, y: lerp(a.y, b.y, p) + (dx / len) * off };
    }
    return pos;
  }

  function renderFx(t) {
    const shown = clamp(prog(t, 6.45, 0.15)) * (1 - clamp(prog(t, 15.1, 0.25)));
    cursor.style.visibility = shown > 0 ? 'visible' : 'hidden';
    ripple.style.opacity = 0;
    if (shown > 0) {
      const pos = cursorAt(t);
      let press = 0;
      CLICKS.forEach(c => {
        const d = t - c;
        if (d >= 0 && d < 0.26) press = Math.max(press, d < 0.07 ? d / 0.07 : 1 - (d - 0.07) / 0.19);
      });
      cursor.style.transform = `translate(${(pos.x - 4).toFixed(2)}px, ${(pos.y - 3).toFixed(2)}px) scale(${(1 - 0.16 * press).toFixed(4)})`;
      cursor.style.opacity = shown.toFixed(3);
      const last = CLICKS.filter(c => t >= c && t < c + 0.55).pop();
      if (last !== undefined) {
        const p = prog(t, last, 0.55);
        ripple.style.transform = `translate(${pos.x.toFixed(2)}px, ${pos.y.toFixed(2)}px) scale(${lerp(0.5, 3.4, E.outCubic(p)).toFixed(4)})`;
        ripple.style.opacity = (0.75 * (1 - p)).toFixed(3);
      }
    }

    const sp = prog(t, 7.44, 0.65);
    const on = sp > 0 && sp < 1;
    sparks.forEach(el => show(el, on));
    if (on) {
      const b = box(btn);
      sparks.forEach((el, k) => {
        const a = (k / sparks.length) * Math.PI * 2 + 0.35;
        const d = lerp(12, 92 + (k % 3) * 20, E.outCubic(sp));
        const x = b.cx + Math.cos(a) * d * 1.45;
        const y = b.cy + Math.sin(a) * d * 0.8;
        el.style.transform = `translate(${x.toFixed(2)}px, ${y.toFixed(2)}px) scale(${(1 - sp * 0.9).toFixed(3)})`;
        el.style.opacity = (1 - E.inQuad(sp)).toFixed(3);
      });
    }
  }

  // =====================================================================
  // Tijdlijn
  // =====================================================================
  function render(t) {
    t = clamp(t, 0, DURATION);
    renderS1(t);
    renderLockups(t);
    renderS2(t);
    renderSteps(t);
    renderFlip(t);
    renderS6(t);
    renderFx(t);
  }

  function fit() {
    if (RENDER) return;
    const vw = window.innerWidth;
    const vh = window.innerHeight - 48;
    stageScale = Math.min(vw / 1920, vh / 1080);
    stage.style.transform = `scale(${stageScale})`;
    stage.style.left = `${(vw - 1920 * stageScale) / 2}px`;
    stage.style.top = `${(vh - 1080 * stageScale) / 2}px`;
  }

  async function init() {
    fit();
    await document.fonts.ready;
    await Promise.all([
      "500 64px 'Inter Tight'", "600 64px 'Inter Tight'", "700 64px 'Inter Tight'", "800 64px 'Inter Tight'",
      "italic 400 64px 'Instrument Serif'", "400 20px 'Inter'", "600 20px 'Inter'", "700 20px 'Inter'",
      "600 20px 'JetBrains Mono'",
    ].map(f => document.fonts.load(f)));
    await Promise.all($$('img').map(img => img.decode().catch(() => {})));

    buildS1();
    buildS2();
    buildSteps();
    buildS6();
    buildFx();
    render(0);
  }

  window.__timeline = { fps: FPS, duration: DURATION };
  window.renderFrame = t => render(t);
  window.__ready = init();

  // ---------- preview met afspeelknop en schuifbalk ----------
  if (!RENDER) {
    const play = $('#play');
    const scrub = $('#scrub');
    const clock = $('#clock');
    scrub.max = DURATION;
    let playing = true;
    let t0 = performance.now();
    let cur = 0;
    const seek = t => {
      cur = t;
      render(t);
      scrub.value = t;
      clock.textContent = `${t.toFixed(2)} s`;
    };
    window.__ready.then(() => {
      const tick = now => {
        if (playing) seek(((now - t0) / 1000) % DURATION);
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
    const toggle = () => {
      playing = !playing;
      play.textContent = playing ? 'Pauze' : 'Speel';
      if (playing) t0 = performance.now() - cur * 1000;
    };
    play.addEventListener('click', toggle);
    scrub.addEventListener('input', () => {
      if (playing) toggle();
      seek(parseFloat(scrub.value));
    });
    window.addEventListener('keydown', e => {
      if (e.code === 'Space') {
        e.preventDefault();
        toggle();
      }
      if (e.code === 'ArrowRight' || e.code === 'ArrowLeft') {
        if (playing) toggle();
        seek(clamp(cur + ((e.code === 'ArrowRight' ? 1 : -1) / FPS) * (e.shiftKey ? 10 : 1), 0, DURATION));
      }
    });
    window.addEventListener('resize', () => {
      fit();
      render(cur);
    });
  }
})();
