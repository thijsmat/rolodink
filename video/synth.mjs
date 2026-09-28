// Bouwstenen voor de soundtrack: ruis, oscillatoren, filters, instrumenten, galm,
// echo, een limiter en een luidheidsmeting volgens EBU R128.
//
// Alles rekent met Float32Array's op 48 kHz en is deterministisch: ruis komt uit
// een generator met een vaste seed, dus elke render klinkt exact hetzelfde.
// Elk instrument geeft een mono buffer terug die begint op de aanslag; Mix zet
// die buffers op hun plek in het stereobeeld.

export const SR = 48000;
const TAU = 2 * Math.PI;

export const mtof = midi => 440 * 2 ** ((midi - 69) / 12);
export const dB = x => 10 ** (x / 20);
export const len = seconds => Math.max(1, Math.round(seconds * SR));
export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));

// zachte inzet (halve cosinus) en exponentieel uitsterven
const rise = (t, a) => (t >= a ? 1 : 0.5 - 0.5 * Math.cos((Math.PI * t) / a));
const fall = (t, tau) => Math.exp(-t / tau);

function fadeOut(buf, seconds) {
  const n = Math.min(buf.length, len(seconds));
  for (let i = 0; i < n; i++) buf[buf.length - 1 - i] *= i / n;
  return buf;
}

// Brengt de piek op 1. Gefilterde ruis is van zichzelf veel zachter dan een toon;
// zo betekent een gain in de partituur voor elk geluid hetzelfde: het piekniveau.
export function normalize(buf, peak = 1) {
  let max = 0;
  for (const x of buf) max = Math.max(max, Math.abs(x));
  if (max > 0) for (let i = 0; i < buf.length; i++) buf[i] *= peak / max;
  return buf;
}

// ---------------------------------------------------------------------------
// ruis
// ---------------------------------------------------------------------------

// mulberry32: klein, snel en ruim goed genoeg voor ruis
export function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), a | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function white(seed) {
  const r = rng(seed);
  return () => r() * 2 - 1;
}

// Roze ruis (−3 dB per octaaf, filter van Paul Kellett): voller en zachter dan wit.
export function pink(seed) {
  const w = white(seed);
  const b = new Float64Array(7);
  return () => {
    const x = w();
    b[0] = 0.99886 * b[0] + x * 0.0555179;
    b[1] = 0.99332 * b[1] + x * 0.0750759;
    b[2] = 0.969 * b[2] + x * 0.153852;
    b[3] = 0.8665 * b[3] + x * 0.3104856;
    b[4] = 0.55 * b[4] + x * 0.5329522;
    b[5] = -0.7616 * b[5] - x * 0.016898;
    const y = b[0] + b[1] + b[2] + b[3] + b[4] + b[5] + b[6] + x * 0.5362;
    b[6] = x * 0.115926;
    return y * 0.11;
  };
}

// ---------------------------------------------------------------------------
// filter en oscillator
// ---------------------------------------------------------------------------

// Toestandsvariabel filter (topologie van Andrew Simper): blijft stabiel als de
// frequentie per sample verandert en levert laag-, band- en hoogdoorlaat tegelijk.
export class Filter {
  constructor(freq = 1000, q = Math.SQRT1_2) {
    this.ic1 = 0;
    this.ic2 = 0;
    this.set(freq, q);
  }

  set(freq, q = this.q) {
    const g = Math.tan((Math.PI * clamp(freq, 10, SR * 0.45)) / SR);
    this.q = q;
    this.k = 1 / q;
    this.a1 = 1 / (1 + g * (g + this.k));
    this.a2 = g * this.a1;
    this.a3 = g * this.a2;
    return this;
  }

  tick(x) {
    const v3 = x - this.ic2;
    const v1 = this.a1 * this.ic1 + this.a2 * v3;
    const v2 = this.ic2 + this.a2 * this.ic1 + this.a3 * v3;
    this.ic1 = 2 * v1 - this.ic1;
    this.ic2 = 2 * v2 - this.ic2;
    this.low = v2;
    this.band = this.k * v1; // 0 dB op de middenfrequentie
    this.high = x - this.k * v1 - v2;
    return this;
  }
}

// Zaagtand met PolyBLEP: de sprong wordt afgerond, zodat er nauwelijks aliasing ontstaat.
export class Saw {
  constructor(phase = 0) {
    this.p = phase;
  }

  tick(freq) {
    const dt = freq / SR;
    const p = this.p;
    let y = 2 * p - 1;
    if (p < dt) {
      const x = p / dt;
      y -= x + x - x * x - 1;
    } else if (p > 1 - dt) {
      const x = (p - 1) / dt;
      y -= x * x + x + x + 1;
    }
    this.p = p + dt >= 1 ? p + dt - 1 : p + dt;
    return y;
  }
}

// ---------------------------------------------------------------------------
// drums
// ---------------------------------------------------------------------------

// Ronde kick: een sinus die in toonhoogte zakt, licht verzadigd, met een tikje erop.
export function kick({ tone = 46, punch = 150, tail = 0.3, click = 0.12, seed = 1 } = {}) {
  const out = new Float32Array(len(tail * 4.5));
  const noise = white(seed);
  const hp = new Filter(2500);
  const norm = Math.tanh(1.6);
  let ph = 0;
  for (let i = 0; i < out.length; i++) {
    const t = i / SR;
    ph += (tone + (punch - tone) * fall(t, 0.03)) / SR;
    const body = Math.sin(TAU * ph) * rise(t, 0.001) * fall(t, tail);
    out[i] = Math.tanh(1.6 * body) / norm + click * hp.tick(noise()).high * fall(t, 0.004);
  }
  return fadeOut(out, 0.02);
}

// Klap: drie korte ruisstoten kort na elkaar en een staart, zoals een 808.
export function clap({ tone = 1300, tail = 0.09, seed = 2 } = {}) {
  const out = new Float32Array(len(0.45));
  const noise = white(seed);
  const bp = new Filter(tone, 1.1);
  const hp = new Filter(700);
  const bursts = [0, 0.011, 0.021];
  for (let i = 0; i < out.length; i++) {
    const t = i / SR;
    let env = t >= 0.028 ? 0.8 * fall(t - 0.028, tail) : 0;
    for (const b of bursts) if (t >= b) env = Math.max(env, fall(t - b, 0.004));
    out[i] = hp.tick(bp.tick(noise()).band).high * env;
  }
  return normalize(fadeOut(out, 0.02));
}

export function shaker({ tail = 0.03, seed = 3 } = {}) {
  const out = new Float32Array(len(tail * 6));
  const noise = white(seed);
  const hp = new Filter(6000);
  const bp = new Filter(9500, 0.9);
  for (let i = 0; i < out.length; i++) {
    const t = i / SR;
    out[i] = bp.tick(hp.tick(noise()).high).band * rise(t, 0.005) * fall(t, tail);
  }
  return normalize(fadeOut(out, 0.01));
}

export function openHat({ tail = 0.12, seed = 4 } = {}) {
  const out = new Float32Array(len(tail * 5));
  const noise = white(seed);
  const hp = new Filter(7000);
  const bp = new Filter(10500, 0.7);
  for (let i = 0; i < out.length; i++) {
    const t = i / SR;
    out[i] = bp.tick(hp.tick(noise()).high).band * rise(t, 0.001) * fall(t, tail);
  }
  return normalize(fadeOut(out, 0.02));
}

// ---------------------------------------------------------------------------
// tonen
// ---------------------------------------------------------------------------

// Bas: sinus plus een gefilterde zaagtand, zodat hij ook op laptopspeakers hoorbaar is.
export function bassNote(freq, dur, { pluck = 1, release = 0.02 } = {}) {
  const out = new Float32Array(len(dur + release * 5));
  const saw = new Saw();
  const lp = new Filter(200, 0.9);
  const norm = Math.tanh(1.4);
  let ph = 0;
  for (let i = 0; i < out.length; i++) {
    const t = i / SR;
    ph += freq / SR;
    if (i % 8 === 0) lp.set(200 + 3 * freq + 700 * pluck * fall(t, 0.08));
    const body = 0.75 * Math.sin(TAU * ph) + 0.6 * lp.tick(saw.tick(freq)).low;
    const env = rise(t, 0.004) * (t < dur ? 1 : fall(t - dur, release));
    out[i] = (Math.tanh(1.4 * body) / norm) * env;
  }
  return fadeOut(out, 0.01);
}

// Pad: drie licht ontstemde zaagtanden door een 24 dB-laagdoorlaatfilter.
// cutoff(t) krijgt de absolute tijd, zodat alle akkoorden samen opengaan.
export function padNote(freq, dur, { attack = 0.4, release = 0.6, cutoff = () => 1500, start = 0, seed = 1 } = {}) {
  const out = new Float32Array(len(dur + release * 4));
  const r = rng(seed);
  const detune = [-0.1, 0, 0.085]; // halve tonen
  const oscs = detune.map(() => new Saw(r()));
  const freqs = detune.map(d => freq * 2 ** (d / 12));
  const lp1 = new Filter(1000, 0.55);
  const lp2 = new Filter(1000, 0.55);
  for (let i = 0; i < out.length; i++) {
    const t = i / SR;
    if (i % 32 === 0) {
      const c = cutoff(start + t);
      lp1.set(c);
      lp2.set(c);
    }
    const s = (oscs[0].tick(freqs[0]) + oscs[1].tick(freqs[1]) + oscs[2].tick(freqs[2])) / 3;
    const env = rise(t, attack) * (t < dur ? 1 : fall(t - dur, release));
    out[i] = lp2.tick(lp1.tick(s).low).low * env;
  }
  return fadeOut(out, 0.05);
}

// Tokkel (FM): helder bij de aanslag, daarna bijna een sinus. bend buigt de toon
// in bendTime seconden zoveel halve tonen, voor een 'verwelkende' noot.
export function pluck(freq, { tail = 0.3, index = 2, bite = 0.06, ratio = 1, bend = 0, bendTime = 0.3 } = {}) {
  const out = new Float32Array(len(tail * 5));
  let pc = 0;
  let pm = 0;
  for (let i = 0; i < out.length; i++) {
    const t = i / SR;
    const f = bend ? freq * 2 ** ((bend * Math.min(1, t / bendTime)) / 12) : freq;
    pc += f / SR;
    pm += (f * ratio) / SR;
    const idx = index * fall(t, bite) + 0.12;
    out[i] = Math.sin(TAU * pc + idx * Math.sin(TAU * pm)) * rise(t, 0.002) * fall(t, tail);
  }
  return fadeOut(out, 0.02);
}

// Klokje: grondtoon met de boventonen van een vibrafoonstaaf (4× en 10×), die snel
// wegsterven, een zweem zweving voor glans en een zacht tikje van de hamer.
export function chime(freq, { tail = 1.1, bright = 1, seed = 5 } = {}) {
  const out = new Float32Array(len(Math.min(tail * 4, 5)));
  const parts = [
    [1, 1, 1],
    [1.0032, 0.3, 0.85],
    [4, 0.26 * bright, 0.2],
    [10, 0.06 * bright, 0.06],
  ].filter(([ratio]) => freq * ratio < 15000);
  for (const [ratio, amp, k] of parts) {
    const w = (TAU * freq * ratio) / SR;
    const step = Math.exp(-1 / (tail * k * SR));
    let env = 0.62 * amp;
    for (let i = 0; i < out.length; i++) {
      out[i] += env * Math.sin(w * i);
      env *= step;
    }
  }
  const noise = white(seed);
  const bp = new Filter(Math.min(freq * 3, 9000), 1.2);
  const strike = len(0.012);
  for (let i = 0; i < out.length; i++) {
    const t = i / SR;
    out[i] *= rise(t, 0.0015);
    if (i < strike) out[i] += 0.15 * bright * bp.tick(noise()).band * fall(t, 0.0015);
  }
  return fadeOut(out, 0.03);
}

// ---------------------------------------------------------------------------
// geluidseffecten
// ---------------------------------------------------------------------------

// Muisklik: indrukken en loslaten, elk een tik met een klein beetje toon.
export function mouseClick({ seed = 6 } = {}) {
  const out = new Float32Array(len(0.14));
  const noise = white(seed);
  const bp = new Filter(3800, 1.3);
  const events = [[0, 1, 1], [0.075, 0.55, 1.2]]; // [tijd, sterkte, toon]
  for (let i = 0; i < out.length; i++) {
    const t = i / SR;
    const n = bp.tick(noise()).band;
    let y = 0;
    for (const [at, amp, tone] of events) {
      const u = t - at;
      if (u < 0) continue;
      const tick = 1.1 * n * fall(u, 0.0008);
      const body = 0.55 * Math.sin(TAU * 2100 * tone * u) * fall(u, 0.003);
      const thump = 0.3 * Math.sin(TAU * 180 * u) * fall(u, 0.006);
      y += amp * (tick + body + thump) * rise(u, 0.0002);
    }
    out[i] = y;
  }
  return normalize(fadeOut(out, 0.005));
}

// Toetsaanslag: een klikje, de toets die de bodem raakt en een korte, doffe tik.
// De spatiebalk is lager en voller.
export function keystroke({ seed = 7, space = false } = {}) {
  const r = rng(seed);
  const out = new Float32Array(len(0.06));
  const noise = white(seed + 7919);
  const bp = new Filter(2300 + r() * 1700, 1.1);
  const thock = space ? 150 : 220 + r() * 100;
  const bottom = 0.0045 + r() * 0.003;
  const body = space ? 0.8 : 0.45;
  const ring = space ? 0.016 : 0.008;
  for (let i = 0; i < out.length; i++) {
    const t = i / SR;
    const tick = fall(t, 0.0011) + (t >= bottom ? 0.55 * fall(t - bottom, 0.0009) : 0);
    const thud = body * Math.sin(TAU * thock * t) * rise(t, 0.0006) * fall(t, ring);
    out[i] = bp.tick(noise()).band * tick + thud;
  }
  return normalize(fadeOut(out, 0.005));
}

// Kaartje in een rolodex dat omslaat: papierig tikje met een zachte plof.
export function flap({ seed = 8, heavy = false } = {}) {
  const r = rng(seed);
  const out = new Float32Array(len(0.06));
  const noise = white(seed + 7919);
  const bp = new Filter(1300 + r() * 1100, 0.9);
  const hp = new Filter(5500);
  const thud = 115 + r() * 45;
  const snap = heavy ? 0.004 : 0.0024;
  const weight = heavy ? 0.55 : 0.3;
  for (let i = 0; i < out.length; i++) {
    const t = i / SR;
    const x = noise();
    const paper = bp.tick(x).band * fall(t, snap) + 0.35 * hp.tick(x).high * fall(t, 0.0006);
    const body = weight * Math.sin(TAU * thud * t) * fall(t, 0.009);
    out[i] = (paper + body) * rise(t, 0.0004);
  }
  return normalize(fadeOut(out, 0.005));
}

// Zoef die een beweging volgt. speed(u) is de snelheid (0-1) met u van 0 tot 1 over
// de duur: hoe sneller, hoe harder en hoger. grain geeft een korrelige textuur,
// zoals een stift over papier.
export function whoosh(dur, speed, { lo = 250, hi = 2600, q = 0.8, air = 0.35, grain = 0, bright = false, seed = 9 } = {}) {
  const out = new Float32Array(len(dur));
  const noise = bright ? white(seed) : pink(seed);
  const texture = white(seed + 7919);
  const smooth = new Filter(45);
  const bp = new Filter(lo, q);
  const bpAir = new Filter(lo * 2.3, q * 1.3);
  for (let i = 0; i < out.length; i++) {
    const v = clamp(speed(i / out.length));
    if (i % 16 === 0) {
      const f = lo * (hi / lo) ** v;
      bp.set(f);
      bpAir.set(f * 2.3);
    }
    const x = noise();
    const tex = 0.5 + 0.5 * Math.tanh(smooth.tick(texture()).low * 30);
    out[i] = (bp.tick(x).band + air * bpAir.tick(x).band) * v ** 1.4 * (1 - grain + 2 * grain * tex);
  }
  for (let i = 0; i < Math.min(out.length, len(0.004)); i++) out[i] *= i / len(0.004);
  return normalize(fadeOut(out, 0.01));
}

// Inslag: een diepe sinus die zakt, met gedempte ruis.
export function boom({ from = 72, to = 38, tail = 0.8, rumble = 0.35, seed = 10 } = {}) {
  const out = new Float32Array(len(tail * 4));
  const noise = pink(seed);
  const lp = new Filter(3000);
  let ph = 0;
  for (let i = 0; i < out.length; i++) {
    const t = i / SR;
    ph += (to + (from - to) * fall(t, 0.12)) / SR;
    if (i % 16 === 0) lp.set(180 + 3200 * fall(t, 0.07));
    const sub = Math.sin(TAU * ph) * fall(t, tail);
    const air = rumble * lp.tick(noise()).low * fall(t, 0.3);
    out[i] = Math.tanh(1.3 * (sub + air)) * rise(t, 0.003);
  }
  return fadeOut(out, 0.05);
}

// Glinstering: hoge, zachte ruis die langzaam uitsterft, als een bekken van ver.
export function shimmer({ tail = 1.2, seed = 11 } = {}) {
  const out = new Float32Array(len(tail * 4));
  const noise = white(seed);
  const hp = new Filter(5500);
  const bp = new Filter(9000, 0.6);
  for (let i = 0; i < out.length; i++) {
    const t = i / SR;
    out[i] = bp.tick(hp.tick(noise()).high).band * rise(t, 0.012) * fall(t, tail);
  }
  return normalize(fadeOut(out, 0.05));
}

// Plop: een sinus die snel in toonhoogte zakt.
export function pop({ from = 1000, to = 450, tail = 0.045 } = {}) {
  const out = new Float32Array(len(tail * 6));
  let ph = 0;
  for (let i = 0; i < out.length; i++) {
    const t = i / SR;
    ph += (to + (from - to) * fall(t, 0.014)) / SR;
    out[i] = Math.sin(TAU * ph) * rise(t, 0.0008) * fall(t, tail);
  }
  return fadeOut(out, 0.005);
}

// Druppel: een snel stijgende toon, en een kleinere druppel erachteraan.
export function droplet({ from = 650, to = 1700, tail = 0.05 } = {}) {
  const out = new Float32Array(len(0.3));
  const drops = [[0, 1, 1], [0.09, 0.3, 1.2]]; // [tijd, sterkte, toon]
  const ph = [0, 0];
  for (let i = 0; i < out.length; i++) {
    const t = i / SR;
    let y = 0;
    drops.forEach(([at, amp, k], d) => {
      const u = t - at;
      if (u < 0) return;
      ph[d] += (from * k * (to / from) ** Math.min(1, u / 0.028)) / SR;
      y += amp * Math.sin(TAU * ph[d]) * rise(u, 0.001) * fall(u, tail);
    });
    out[i] = y;
  }
  return fadeOut(out, 0.01);
}

// Blip omhoog, voor iets dat openklapt.
export function blip({ from = 520, to = 1040, glide = 0.05, tail = 0.09 } = {}) {
  const out = new Float32Array(len(tail * 6));
  let ph = 0;
  for (let i = 0; i < out.length; i++) {
    const t = i / SR;
    ph += (to + (from - to) * fall(t, glide / 3)) / SR;
    out[i] = (Math.sin(TAU * ph) + 0.2 * Math.sin(2 * TAU * ph)) * rise(t, 0.003) * fall(t, tail);
  }
  return fadeOut(out, 0.01);
}

// Slotje dat dichtklikt: twee metalen tikjes kort na elkaar, met wat boventonen.
export function latch({ seed = 12 } = {}) {
  const out = new Float32Array(len(0.18));
  const noise = white(seed);
  const bp = new Filter(4200, 1.4);
  const hits = [[0, 0.5], [0.028, 1]]; // [tijd, sterkte]
  const ring = [[2870, 0.35, 0.03], [4630, 0.25, 0.022], [6310, 0.15, 0.015]]; // [Hz, sterkte, uitsterven]
  for (let i = 0; i < out.length; i++) {
    const t = i / SR;
    const n = bp.tick(noise()).band;
    let y = 0;
    for (const [at, amp] of hits) {
      const u = t - at;
      if (u < 0) continue;
      let metal = 0;
      for (const [f, a, tau] of ring) metal += a * Math.sin(TAU * f * u) * fall(u, tau);
      y += amp * (n * fall(u, 0.0009) + 0.35 * Math.sin(TAU * 420 * u) * fall(u, 0.008) + metal) * rise(u, 0.0002);
    }
    out[i] = y;
  }
  return normalize(fadeOut(out, 0.01));
}

// ---------------------------------------------------------------------------
// mixer
// ---------------------------------------------------------------------------

// Stereobussen van gelijke lengte. add() zet een mono geluid op tijdstip t, met
// panning (−1 links … 1 rechts, of een functie van de tijd) en sends naar de galm
// ('verb') en de echo ('echo').
export class Mix {
  constructor(seconds) {
    this.n = len(seconds);
    this.buses = new Map();
  }

  bus(name) {
    if (!this.buses.has(name)) this.buses.set(name, [new Float32Array(this.n), new Float32Array(this.n)]);
    return this.buses.get(name);
  }

  add(sound, t, { gain = 1, pan = 0, bus = 'fx', verb = 0, echo = 0 } = {}) {
    for (const [name, amount] of [[bus, 1], ['verb', verb], ['echo', echo]]) {
      if (amount > 0) this.#write(this.bus(name), sound, t, gain * amount, pan);
    }
  }

  addStereo([sl, sr], t, { gain = 1, bus = 'fx' } = {}) {
    const [L, R] = this.bus(bus);
    const start = Math.round(t * SR);
    for (let i = Math.max(0, -start); i < sl.length && start + i < this.n; i++) {
      L[start + i] += sl[i] * gain;
      R[start + i] += sr[i] * gain;
    }
  }

  #write([L, R], sound, t, gain, pan) {
    const start = Math.round(t * SR);
    const moving = typeof pan === 'function';
    let gl = 0;
    let gr = 0;
    const aim = p => {
      const a = ((clamp(p, -1, 1) + 1) * Math.PI) / 4;
      gl = gain * Math.cos(a);
      gr = gain * Math.sin(a);
    };
    if (!moving) aim(pan);
    for (let i = Math.max(0, -start); i < sound.length && start + i < this.n; i++) {
      if (moving && i % 64 === 0) aim(pan(t + i / SR));
      L[start + i] += sound[i] * gl;
      R[start + i] += sound[i] * gr;
    }
  }

  // Filtert een hele bus; type is 'low', 'band' of 'high'.
  filter(name, type, freq, q = Math.SQRT1_2) {
    for (const ch of this.bus(name)) {
      const f = new Filter(freq, q);
      for (let i = 0; i < ch.length; i++) ch[i] = f.tick(ch[i])[type];
    }
  }

  // Sidechain: de bus duikt even weg op elke kick, zodat de kick vrij klinkt.
  duck(name, times, depth, { attack = 0.008, release = 0.14 } = {}) {
    const [L, R] = this.bus(name);
    const g = new Float32Array(this.n).fill(1);
    for (const t of times) {
      const s = Math.round(t * SR);
      const end = Math.min(this.n, s + len(release * 5));
      for (let i = Math.max(0, s - len(attack)); i < end; i++) {
        const u = (i - s) / SR;
        const env = u < 0 ? 1 + u / attack : fall(u, release);
        g[i] = Math.min(g[i], 1 - depth * env);
      }
    }
    for (let i = 0; i < this.n; i++) {
      L[i] *= g[i];
      R[i] *= g[i];
    }
  }
}

// ---------------------------------------------------------------------------
// effecten
// ---------------------------------------------------------------------------

function allpass(size, g) {
  const buf = new Float32Array(size);
  let p = 0;
  return x => {
    const d = buf[p];
    const y = d - g * x;
    buf[p] = x + g * y;
    p = (p + 1) % size;
    return y;
  };
}

function hadamard8(v) {
  for (let h = 1; h < 8; h *= 2) {
    for (let i = 0; i < 8; i += 2 * h) {
      for (let j = i; j < i + h; j++) {
        const a = v[j];
        const b = v[j + h];
        v[j] = a + b;
        v[j + h] = a - b;
      }
    }
  }
  for (let i = 0; i < 8; i++) v[i] *= Math.SQRT1_2 / 2; // 1/√8
}

// Galm: een feedback delay network met acht lijnen en een Hadamard-matrix. Vier
// allpass-diffusors per kanaal smeren klikjes uit voordat ze de galm in gaan.
export function reverb([inL, inR], { decay = 1.8, damping = 5000, predelay = 0.02 } = {}) {
  const n = inL.length;
  const outL = new Float32Array(n);
  const outR = new Float32Array(n);
  const sizes = [1493, 1789, 2011, 2243, 2557, 2837, 3119, 3413];
  const lines = sizes.map(s => new Float32Array(s));
  const pos = new Int32Array(8);
  const gain = sizes.map(s => 10 ** ((-3 * s) / (decay * SR)));
  const damp = Math.exp((-TAU * damping) / SR);
  const lp = new Float64Array(8);
  const v = new Float64Array(8);
  const diffL = [allpass(229, 0.72), allpass(173, 0.72), allpass(611, 0.62), allpass(447, 0.62)];
  const diffR = [allpass(241, 0.72), allpass(163, 0.72), allpass(587, 0.62), allpass(461, 0.62)];
  const pre = len(predelay);
  for (let i = 0; i < n; i++) {
    let xl = i >= pre ? inL[i - pre] : 0;
    let xr = i >= pre ? inR[i - pre] : 0;
    for (const d of diffL) xl = d(xl);
    for (const d of diffR) xr = d(xr);
    for (let k = 0; k < 8; k++) {
      const y = lines[k][pos[k]];
      lp[k] = y + damp * (lp[k] - y);
      v[k] = lp[k];
    }
    outL[i] = (v[0] - v[1] + v[2] - v[3] + v[4] - v[5] + v[6] - v[7]) * 0.35;
    outR[i] = (v[0] + v[1] - v[2] - v[3] + v[4] + v[5] - v[6] - v[7]) * 0.35;
    hadamard8(v);
    for (let k = 0; k < 8; k++) {
      lines[k][pos[k]] = gain[k] * v[k] + (k % 2 ? xr : xl) * 0.5;
      pos[k] = (pos[k] + 1) % sizes[k];
    }
  }
  return [outL, outR];
}

// Echo die heen en weer springt tussen links en rechts; elke herhaling iets doffer.
export function pingPong([inL, inR], { time = 0.37, feedback = 0.35, tone = 3200 } = {}) {
  const n = inL.length;
  const size = len(time);
  const bl = new Float32Array(size);
  const br = new Float32Array(size);
  const outL = new Float32Array(n);
  const outR = new Float32Array(n);
  const lp = new Filter(tone, 0.6);
  const hp = new Filter(300, 0.6);
  let p = 0;
  for (let i = 0; i < n; i++) {
    const yl = bl[p];
    const yr = br[p];
    bl[p] = hp.tick(lp.tick((inL[i] + inR[i]) * 0.5 + feedback * yr).low).high;
    br[p] = yl;
    outL[i] = yl;
    outR[i] = yr;
    p = (p + 1) % size;
  }
  return [outL, outR];
}

// Draait een stereobuffer om: een galm die naar een aanslag toe zuigt.
export function reversed([L, R]) {
  return [L.slice().reverse(), R.slice().reverse()];
}

// ---------------------------------------------------------------------------
// mastering
// ---------------------------------------------------------------------------

// Geïntegreerde luidheid in LUFS volgens ITU-R BS.1770-4 (K-weging, 400 ms-blokken
// met 75% overlap, absolute poort op −70 LUFS en relatieve poort 10 LU lager).
export function loudness([L, R]) {
  const n = L.length;
  const kl = kWeighting();
  const kr = kWeighting();
  const sum = new Float64Array(n + 1);
  for (let i = 0; i < n; i++) {
    const a = kl(L[i]);
    const b = kr(R[i]);
    sum[i + 1] = sum[i] + a * a + b * b;
  }
  const block = len(0.4);
  const hop = len(0.1);
  const z = [];
  for (let s = 0; s + block <= n; s += hop) z.push((sum[s + block] - sum[s]) / block);
  const lufs = x => -0.691 + 10 * Math.log10(x);
  const mean = a => a.reduce((x, y) => x + y, 0) / a.length;
  const loud = z.filter(x => lufs(x) > -70);
  if (!loud.length) return -Infinity;
  const gate = lufs(mean(loud)) - 10;
  return lufs(mean(loud.filter(x => lufs(x) > gate)));
}

function kWeighting() {
  const stages = [
    [1.53512485958697, -2.69169618940638, 1.19839281085285, -1.69065929318241, 0.73248077421585],
    [1, -2, 1, -1.99004745483398, 0.99007225036621],
  ].map(([b0, b1, b2, a1, a2]) => {
    const s = new Float64Array(4); // x1, x2, y1, y2
    return x => {
      const y = b0 * x + b1 * s[0] + b2 * s[1] - a1 * s[2] - a2 * s[3];
      s[1] = s[0];
      s[0] = x;
      s[3] = s[2];
      s[2] = y;
      return y;
    };
  });
  return x => stages[1](stages[0](x));
}

// Limiter met vooruitkijken: de versterking zakt al vóór een piek en veert daarna
// rustig terug, zodat er niets clipt en niets kraakt. Geeft de diepste demping terug.
export function limiter([L, R], { ceiling = dB(-1.5), lookahead = 0.0015, release = 0.08 } = {}) {
  const n = L.length;
  const w = len(lookahead);
  const need = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const peak = Math.max(Math.abs(L[i]), Math.abs(R[i]));
    need[i] = peak > ceiling ? ceiling / peak : 1;
  }
  const rel = Math.exp(-1 / (release * SR));
  const ring = new Float32Array(w).fill(1);
  let sum = w;
  let held = 1;
  let deepest = 1;
  for (let i = 0; i < n; i++) {
    let m = 1;
    for (let k = i; k < Math.min(n, i + w); k++) m = Math.min(m, need[k]);
    held = Math.min(m, 1 - (1 - held) * rel);
    sum += held - ring[i % w];
    ring[i % w] = held;
    const g = Math.min(1, sum / w);
    L[i] *= g;
    R[i] *= g;
    deepest = Math.min(deepest, g);
  }
  return deepest;
}

// Coëfficiënten voor een piek- of shelvingfilter, uit het Audio EQ Cookbook van
// Robert Bristow-Johnson: [b0, b1, b2, a1, a2], al gedeeld door a0.
function eqCoefficients(type, freq, gain, q) {
  const A = 10 ** (gain / 40);
  const w = (TAU * freq) / SR;
  const cos = Math.cos(w);
  const alpha = Math.sin(w) / (2 * q);
  const k = 2 * Math.sqrt(A) * alpha;
  let c;
  if (type === 'peak') {
    c = [1 + alpha * A, -2 * cos, 1 - alpha * A, 1 + alpha / A, -2 * cos, 1 - alpha / A];
  } else if (type === 'lowShelf') {
    c = [
      A * (A + 1 - (A - 1) * cos + k), 2 * A * (A - 1 - (A + 1) * cos), A * (A + 1 - (A - 1) * cos - k),
      A + 1 + (A - 1) * cos + k, -2 * (A - 1 + (A + 1) * cos), A + 1 + (A - 1) * cos - k,
    ];
  } else {
    c = [
      A * (A + 1 + (A - 1) * cos + k), -2 * A * (A - 1 + (A + 1) * cos), A * (A + 1 + (A - 1) * cos - k),
      A + 1 - (A - 1) * cos + k, 2 * (A - 1 - (A + 1) * cos), A + 1 - (A - 1) * cos - k,
    ];
  }
  const [b0, b1, b2, a0, a1, a2] = c;
  return [b0 / a0, b1 / a0, b2 / a0, a1 / a0, a2 / a0];
}

// EQ op een stereobuffer. bands: [type ('peak', 'lowShelf', 'highShelf'), Hz, dB, q].
export function equalize([L, R], bands) {
  for (const [type, freq, gain, q = Math.SQRT1_2] of bands) {
    const [b0, b1, b2, a1, a2] = eqCoefficients(type, freq, gain, q);
    for (const ch of [L, R]) {
      let z1 = 0;
      let z2 = 0;
      for (let i = 0; i < ch.length; i++) {
        const x = ch[i];
        const y = b0 * x + z1;
        z1 = b1 * x - a1 * y + z2;
        z2 = b2 * x - a2 * y;
        ch[i] = y;
      }
    }
  }
}

// Hoogdoorlaat tegen subsonisch gerommel, EQ, daarna op doelluidheid brengen en
// begrenzen. Twee rondes, omdat de limiter de luidheid een fractie verlaagt.
export function master([L, R], { target = -16, ceiling = -1.5, eq = [] } = {}) {
  for (const ch of [L, R]) {
    const hp = new Filter(25);
    for (let i = 0; i < ch.length; i++) ch[i] = hp.tick(ch[i]).high;
  }
  equalize([L, R], eq);
  let gain = dB(target - loudness([L, R]));
  let result = null;
  for (let round = 0; round < 3; round++) {
    const out = [L.map(x => x * gain), R.map(x => x * gain)];
    const deepest = limiter(out, { ceiling: dB(ceiling) });
    const lufs = loudness(out);
    result = { audio: out, lufs, limiting: -20 * Math.log10(deepest) };
    if (Math.abs(lufs - target) < 0.05) break;
    gain *= dB(target - lufs);
  }
  return result;
}

// 24-bit PCM WAV, stereo, 48 kHz.
export function wav([L, R]) {
  const n = L.length;
  const buf = Buffer.alloc(44 + n * 6);
  buf.write('RIFF', 0);
  buf.writeUInt32LE(36 + n * 6, 4);
  buf.write('WAVE', 8);
  buf.write('fmt ', 12);
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20);
  buf.writeUInt16LE(2, 22);
  buf.writeUInt32LE(SR, 24);
  buf.writeUInt32LE(SR * 6, 28);
  buf.writeUInt16LE(6, 32);
  buf.writeUInt16LE(24, 34);
  buf.write('data', 36);
  buf.writeUInt32LE(n * 6, 40);
  let o = 44;
  for (let i = 0; i < n; i++) {
    for (const ch of [L, R]) {
      buf.writeIntLE(Math.round(clamp(ch[i], -1, 1) * 8388607), o, 3);
      o += 3;
    }
  }
  return buf;
}
