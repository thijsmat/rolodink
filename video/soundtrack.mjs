// De soundtrack van de uitlegvideo: muziek en geluidseffecten, gesynthetiseerd met
// synth.mjs. Er zitten geen samples in, dus ook geen rechten van derden.
//
// De effecten hangen aan de cues uit main.js (window.soundCues): verschuif je daar
// een moment, dan schuift het geluid mee. De muziek loopt op een vast grid van
// 122 BPM met de eerste tel op 3,11 s, als de camera door de o is. Op dat grid
// vallen ook de stapwissels (9,0 en 12,45 s) en het slotakkoord (16,39 s, als de
// omgeklapte kaart het beeld vult) op een tel. Verschuif je die, pas dan ONE of BPM aan.
//
//   intro     Gmaj9 → A7sus4: twinkelende kaartjes, verwelkende namen, een inktdruppel,
//             aanzwellende ruis en een omgekeerde galm naar de eerste tel
//   maat 1-6  D – A/C# – Bm7 – Gmaj7 – D/F# – G6 met kick, klap, shaker, bas, arpeggio
//             en pad; een effect bij elke handeling in beeld
//   break     A7sus4, drie tellen, terwijl de kaart omklapt
//   slot      Dmaj9 met het muzikale logo F#–A–D, uitsterven tot het einde

import {
  SR, Mix, clamp, dB, mtof, rng,
  kick, clap, shaker, openHat, bassNote, padNote, pluck, chime,
  mouseClick, keystroke, flap, whoosh, boom, shimmer, pop, droplet, blip, latch,
  reverb, pingPong, reversed, master,
} from './synth.mjs';

const BPM = 122;
const BEAT = 60 / BPM;
const ONE = 3.11; // eerste tel
const SWING = 0.1 * (BEAT / 4); // de even zestienden iets later
const RESOLVE = 27; // tel van het slotakkoord
const beat = b => ONE + b * BEAT;
const sixteenth = (bar, s) => beat(bar + s / 4) + (s % 2 ? SWING : 0);
const spread = x => (x - 0.5) * 1.2; // plek in beeld (0…1) → panning

// Akkoorden in tellen vanaf ONE. level is dB per padstem, low een extra lage stem.
const CHORDS = [
  { from: -ONE / BEAT, to: -4, pad: [55, 59, 62, 66, 69], low: 43, attack: 1.4, level: -17 }, // Gmaj9
  { from: -4, to: 0, pad: [57, 62, 64, 67], low: 45, level: -17 }, // A7sus4
  { from: 0, to: 4, pad: [57, 62, 64, 66], bass: 38, arp: [69, 74, 76, 78, 81], attack: 0.02 }, // D(add9)
  { from: 4, to: 8, pad: [57, 61, 64, 69], bass: 37, arp: [69, 73, 76, 81, 83] }, // A/C#
  { from: 8, to: 12, pad: [57, 59, 62, 66], bass: 35, arp: [69, 71, 74, 78, 81] }, // Bm7
  { from: 12, to: 16, pad: [55, 59, 62, 66], bass: 31, arp: [67, 71, 74, 78, 81] }, // Gmaj7
  { from: 16, to: 20, pad: [54, 57, 62, 64], bass: 30, arp: [66, 69, 74, 76, 78] }, // D/F#
  { from: 20, to: 24, pad: [55, 59, 62, 64], bass: 31, arp: [67, 71, 74, 79, 81] }, // G6
  { from: 24, to: RESOLVE, pad: [57, 62, 64, 67], bass: 33, level: -21 }, // A7sus4
  { from: RESOLVE, to: 30, pad: [50, 57, 62, 64, 66, 73], bass: 38, attack: 0.03, release: 0.6, level: -19 }, // Dmaj9
];

// Hoe open de pad klinkt: dicht in de intro, open bij de eerste tel, weer open bij het slot.
const PAD_CUTOFF = [
  [0, 900], [2.3, 1200], [ONE - 0.03, 3600], [ONE + 0.7, 2400], [5.1, 2000],
  [beat(24), 2000], [beat(RESOLVE) - 0.1, 1200], [beat(RESOLVE), 3200], [19, 1500],
];

const BASS_STEADY = [[0, 6], [6, 2], [8, 5], [14, 2, 12]]; // [zestiende, lengte, transpositie]
const BASS_DRIVE = [[0, 3], [3, 2], [6, 2], [8, 3], [11, 2], [14, 2, 12]];
const ARP = [0, -1, 2, 1, -1, 3, 2, -1, 4, -1, 2, 3, -1, 1, 2, -1]; // akkoordtoon per zestiende, −1 = rust
const ARP_LEVEL = { 0: -17, 4: -18, 8: -18, 12: -21, 16: -21, 20: -19 }; // dB per maat; zachter tijdens het typen
const BASS_LEVEL = { 0: -15, 4: -15, 8: -15, 12: -16.5, 16: -16.5, 20: -15 };
const SHAKER_ACCENT = [-4, -9, 0, -7]; // dB per zestiende binnen de tel
const KICK_EXTRA = { 8: [14], 16: [14], 20: [11] }; // extra kicks per maat

const SPARKLE = [71, 74, 76, 78, 81, 83, 86, 88, 90, 93, 95, 98]; // kaartjes verschijnen: omhoog
const WILT = [93, 91, 88, 86, 81, 79, 76, 74, 69, 67, 64, 62]; // namen vervagen: omlaag

// Dezelfde easings als in main.js, voor geluiden die een beweging volgen.
const EASE = {
  outCubic: x => 1 - (1 - x) ** 3,
  inOutCubic: x => (x < 0.5 ? 4 * x ** 3 : 1 - (-2 * x + 2) ** 3 / 2),
  outQuart: x => 1 - (1 - x) ** 4,
  inOutQuart: x => (x < 0.5 ? 8 * x ** 4 : 1 - (-2 * x + 2) ** 4 / 2),
  outExpo: x => (x >= 1 ? 1 : 1 - 2 ** (-10 * x)),
};

// Snelheid van een easing, genormaliseerd op 1, als functie van u (0…1).
function speedOf(ease, steps = 400) {
  const v = Array.from({ length: steps + 1 }, (_, k) => {
    const a = Math.max(0, k - 0.5) / steps;
    const b = Math.min(steps, k + 0.5) / steps;
    return (ease(b) - ease(a)) / (b - a);
  });
  const top = Math.max(...v);
  return u => v[Math.round(clamp(u) * steps)] / top;
}

// Dezelfde snelheid als functie van de absolute tijd, voor een beweging [begin, duur].
function motion([start, dur], ease) {
  const speed = speedOf(ease);
  return t => (t < start || t > start + dur ? 0 : speed((t - start) / dur));
}

// Waar (u, 0…1) de beweging halverwege elk van `count` kaartjes is: daar tikt het.
function crossings(ease, count) {
  return Array.from({ length: count }, (_, k) => {
    const y = (k + 0.5) / count;
    let lo = 0;
    let hi = 1;
    for (let i = 0; i < 40; i++) {
      const mid = (lo + hi) / 2;
      if (ease(mid) < y) lo = mid;
      else hi = mid;
    }
    return hi;
  });
}

// Waarde tussen sleutelpunten [tijd, waarde], logaritmisch geïnterpoleerd.
function envelope(points) {
  return t => {
    const k = points.findIndex(([at]) => at >= t);
    if (k <= 0) return points[k === 0 ? 0 : points.length - 1][1];
    const [t0, v0] = points[k - 1];
    const [t1, v1] = points[k];
    return v0 * (v1 / v0) ** ((t - t0) / (t1 - t0));
  };
}

// ---------------------------------------------------------------------------
// muziek
// ---------------------------------------------------------------------------

function pads(mix) {
  const cutoff = envelope(PAD_CUTOFF);
  const lowCutoff = t => cutoff(t) * 0.5;
  CHORDS.forEach((c, n) => {
    const start = Math.max(0, beat(c.from));
    const dur = beat(c.to) - start;
    const opts = { attack: c.attack ?? 0.25, release: c.release ?? 0.5, start };
    c.pad.forEach((m, k) => {
      const note = padNote(mtof(m), dur, { ...opts, cutoff, seed: 40 + n * 8 + k });
      mix.add(note, start, { bus: 'pad', gain: dB(c.level ?? -25), pan: (k / (c.pad.length - 1) - 0.5) * 1.2, verb: 0.3 });
    });
    if (c.low) mix.add(padNote(mtof(c.low), dur, { ...opts, cutoff: lowCutoff, seed: 90 + n }), start, { bus: 'low', gain: dB(-19), verb: 0.2 });
  });
}

function bassLine(mix) {
  for (const c of CHORDS.filter(ch => ch.bass && ch.from < 24)) {
    const pattern = c.from >= 16 ? BASS_DRIVE : BASS_STEADY;
    for (const [s, n, up = 0] of pattern) {
      mix.add(bassNote(mtof(c.bass + up), (n * BEAT) / 4 - 0.03), sixteenth(c.from, s), { bus: 'bass', gain: dB(BASS_LEVEL[c.from] - (up ? 3 : 0)) });
    }
  }
  // break: één lange A; slot: een lange D die uitsterft
  const [hold, end] = CHORDS.slice(-2);
  mix.add(bassNote(mtof(hold.bass), beat(hold.to) - beat(hold.from) - 0.03, { pluck: 0.5 }), beat(hold.from), { bus: 'bass', gain: dB(-14) });
  mix.add(bassNote(mtof(end.bass), 1.5, { pluck: 0.5, release: 0.45 }), beat(end.from), { bus: 'bass', gain: dB(-14) });
}

function arpeggio(mix) {
  for (const c of CHORDS.filter(ch => ch.arp)) {
    ARP.forEach((k, s) => {
      if (k < 0) return;
      const accent = s % 4 === 0 ? 0 : -3;
      mix.add(pluck(mtof(c.arp[k]), { tail: 0.26, index: 2.6, bite: 0.07 }), sixteenth(c.from, s), {
        bus: 'arp', gain: dB(ARP_LEVEL[c.from] + accent), pan: s % 2 ? 0.3 : -0.3, verb: 0.2, echo: 0.22,
      });
    });
  }
}

function drumBar(mix, bar, hitKick) {
  for (const s of [0, 8]) hitKick(sixteenth(bar, s), -10);
  for (const s of KICK_EXTRA[bar] ?? []) hitKick(sixteenth(bar, s), -15);
  const quiet = bar === 0; // de eerste maat is van het logo: nog geen klap
  if (!quiet) {
    for (const s of [4, 12]) mix.add(clap({ seed: 200 + bar + s }), sixteenth(bar, s), { bus: 'drums', gain: dB(-11), verb: 0.22 });
  }
  for (let s = 0; s < 16; s++) {
    const gain = dB((quiet ? -22 : -18) + SHAKER_ACCENT[s % 4]);
    mix.add(shaker({ seed: 300 + bar * 4 + s }), sixteenth(bar, s), { bus: 'drums', gain, pan: 0.3, verb: 0.08 });
  }
  if (bar >= 16) {
    for (const s of [2, 6, 10, 14]) mix.add(openHat({ seed: 400 + bar + s }), sixteenth(bar, s), { bus: 'drums', gain: dB(-21), pan: -0.25, verb: 0.1 });
  }
}

// Geeft de momenten van alle kicks terug, voor de sidechain.
function drums(mix) {
  const kicks = [];
  const hitKick = (t, gain, tail = 0.3) => {
    kicks.push(t);
    mix.add(kick({ tail, seed: 100 + kicks.length }), t, { bus: 'drums', gain: dB(gain), verb: 0.04 });
  };
  for (let bar = 0; bar < 24; bar += 4) drumBar(mix, bar, hitKick);
  hitKick(beat(24), -10);
  hitKick(beat(RESOLVE), -9, 0.45);
  return kicks;
}

// Omgekeerde galm van een akkoord die precies op `at` eindigt: zuigt naar de aanslag toe.
function swell(mix, notes, at, gain, seconds = 1.3) {
  const chord = new Mix(seconds);
  notes.forEach((m, k) => chord.add(pluck(mtof(m), { tail: 0.6, index: 1.5, bite: 0.08 }), 0, { pan: (k / (notes.length - 1) - 0.5) * 0.8 }));
  const dry = chord.bus('fx');
  const wet = reverb(dry, { decay: 2.6, predelay: 0.005 });
  const [l, r] = reversed([wet[0].map((x, i) => x + 0.2 * dry[0][i]), wet[1].map((x, i) => x + 0.2 * dry[1][i])]);
  const edge = Math.round(0.008 * SR); // de omgedraaide aanslag niet laten klikken
  for (let i = 0; i < edge; i++) {
    l[l.length - 1 - i] *= i / edge;
    r[r.length - 1 - i] *= i / edge;
  }
  const peak = Math.max(...[l, r].map(ch => ch.reduce((m, x) => Math.max(m, Math.abs(x)), 0)));
  mix.addStereo([l, r], at - seconds, { gain: gain / peak });
}

// ---------------------------------------------------------------------------
// effecten per scène
// ---------------------------------------------------------------------------

function intro(mix, cues) {
  [...cues.chips].sort((a, b) => a.in - b.in).forEach((c, k) => {
    mix.add(chime(mtof(SPARKLE[k]), { tail: 0.35, bright: 0.5, seed: 500 + k }), c.in + 0.02, { bus: 'keys', gain: dB(-27), pan: spread(c.x), verb: 0.35, echo: 0.25 });
  });
  [...cues.chips].sort((a, b) => a.forget - b.forget).forEach((c, k) => {
    const note = pluck(mtof(WILT[k]), { tail: 0.4, index: 0.8, bite: 0.08, bend: -1, bendTime: 0.35 });
    mix.add(note, c.forget + 0.08, { bus: 'keys', gain: dB(-26 - k * 0.3), pan: spread(c.x), verb: 0.45, echo: 0.2 });
  });
  mix.add(droplet(), cues.inkDrop, { gain: dB(-13), verb: 0.3, echo: 0.15 });
  // door de o: ruis die aanzwelt zoals de zoom versnelt, links en rechts net anders
  const from = cues.inkDrop - 0.45;
  const dur = cues.zoom[0] + cues.zoom[1] - 0.03 - from;
  for (const [seed, pan] of [[601, -0.55], [602, 0.55]]) {
    mix.add(whoosh(dur, u => u ** 2.6, { lo: 280, hi: 7500, q: 1.2, bright: true, seed }), from, { gain: dB(-13), pan, verb: 0.2 });
  }
  swell(mix, [62, 66, 69, 74, 76], ONE - 0.012, dB(-14));
}

function brand(mix, cues) {
  mix.add(boom(), ONE, { gain: dB(-9), verb: 0.15 });
  mix.add(shimmer({ tail: 1 }), ONE, { gain: dB(-22), pan: 0.2, verb: 0.3 });
  const stab = [50, 57, 62, 66, 69, 76];
  stab.forEach((m, k) => {
    mix.add(pluck(mtof(m), { tail: 0.9, index: 1.6, bite: 0.07 }), ONE + k * 0.004, { bus: 'keys', gain: dB(-22), pan: (k / (stab.length - 1) - 0.5) * 0.9, verb: 0.35, echo: 0.15 });
  });
  // de letters rollen als kaartjes in een rolodex: een tik per letter die voorbijkomt
  cues.letters.forEach((l, i) => {
    const pan = (i / (cues.letters.length - 1) - 0.5) * 0.7;
    crossings(EASE.outQuart, l.steps).forEach((u, k) => {
      const heavy = k === l.steps - 1;
      mix.add(flap({ seed: 700 + i * 16 + k, heavy }), l.start + u * l.dur, { gain: dB(heavy ? -16 : -19), pan, verb: 0.12 });
    });
  });
}

// Een rolodex die een paar kaartjes doorslaat: tikjes op de momenten dat de beweging
// een kaartje verder is, zachter naarmate het langzamer gaat, met wat lucht erbij.
// Het laatste kaartje valt met een vollere tik op zijn plek.
function riffle(mix, { at, dur, ease, cards, gain, seed, pan = -0.35 }) {
  const speed = speedOf(ease);
  crossings(ease, cards).forEach((u, k) => {
    const heavy = k === cards - 1;
    mix.add(flap({ seed: seed + k, heavy }), at + u * dur, { gain: gain * (heavy ? 0.9 : 0.4 + 0.6 * speed(u)), pan, verb: 0.12 });
  });
  mix.add(whoosh(dur, speed, { lo: 400, hi: 1800, seed }), at, { gain: gain * 0.8, pan, verb: 0.1 });
}

// Stapwissel: titel en cijfer draaien door (0,62 s, zoals stepAngle in main.js).
function stepSwitch(mix, at, seed) {
  riffle(mix, { at: at - 0.02, dur: 0.66, ease: EASE.inOutQuart, cards: 7, gain: dB(-18), seed });
}

function stepOne(mix, cues) {
  // het doek valt weg en het venster schuift van rechts in beeld: één zoef
  const fall = motion(cues.canvasFall, EASE.inOutCubic);
  const slide = motion(cues.windowIn, EASE.outExpo);
  const [w0, wd] = cues.windowIn;
  const from = cues.canvasFall[0] - 0.05;
  const dur = w0 + 0.9 - from;
  const speed = u => {
    const t = from + u * dur;
    return Math.max(0.85 * fall(t), slide(t) * clamp((t - w0) / 0.08));
  };
  const pan = t => 0.45 * (1 - EASE.outExpo(clamp((t - w0) / wd)));
  mix.add(whoosh(dur, speed, { lo: 220, hi: 2200, seed: 801 }), from, { gain: dB(-11), pan, verb: 0.15 });
  riffle(mix, { at: cues.stepFirst, dur: 0.85, ease: EASE.outCubic, cards: 5, gain: dB(-22), seed: 820 });

  // de knop verschijnt en wordt aangeklikt; Added krijgt een oplopend drieklankje met vonkjes
  const at = spread(cues.clicks[0].x);
  mix.add(pop(), cues.buttonIn + 0.01, { gain: dB(-14), pan: at, verb: 0.15 });
  [78, 83, 86].forEach((m, k) => {
    mix.add(chime(mtof(m), { tail: 0.8, seed: 830 + k }), cues.buttonAdded - 0.01 + k * 0.06, { bus: 'keys', gain: dB(-17 - k), pan: at, verb: 0.3, echo: 0.2 });
  });
  const r = rng(840);
  [98, 102, 105, 102, 110].forEach((m, k) => {
    const t = cues.buttonAdded + 0.03 + k * 0.045 + r() * 0.02;
    mix.add(chime(mtof(m), { tail: 0.25, bright: 0.4, seed: 845 + k }), t, { bus: 'keys', gain: dB(-31), pan: at + (r() - 0.5) * 0.6, verb: 0.3 });
  });
}

function stepTwo(mix, cues) {
  stepSwitch(mix, cues.stepSwitch[0], 850);
  const at = spread(cues.clicks[1].x);
  const r = rng(860);
  cues.noteKeys.forEach((t, k) => {
    const space = cues.note[k] === ' ';
    const gain = dB(-17.5 + 3 * r() - (space ? 1 : 0));
    mix.add(keystroke({ seed: 1000 + k, space }), t + 0.004, { gain, pan: at + (r() - 0.5) * 0.08, verb: 0.05 });
  });
  // opgeslagen: twee tonen, en het slotje klikt dicht als het label op zijn plek springt
  [81, 86].forEach((m, k) => {
    mix.add(chime(mtof(m), { tail: 0.7, bright: 0.8, seed: 870 + k }), cues.saved + 0.01 + k * 0.07, { bus: 'keys', gain: dB(-17 - k), pan: at, verb: 0.3, echo: 0.2 });
  });
  mix.add(latch(), cues.sticker + 0.11, { gain: dB(-12), pan: at, verb: 0.12 });
}

function stepThree(mix, cues) {
  stepSwitch(mix, cues.stepSwitch[1], 880);
  const at = spread(cues.clicks[2].x);
  mix.add(blip(), cues.popupOpen + 0.01, { gain: dB(-16), pan: at, verb: 0.2, echo: 0.1 });
  mix.add(whoosh(0.45, speedOf(EASE.outExpo), { lo: 900, hi: 4200, seed: 1101 }), cues.popupOpen, { gain: dB(-20), pan: at, verb: 0.1 });
  cues.queryKeys.forEach((t, k) => mix.add(keystroke({ seed: 1200 + k }), t + 0.004, { gain: dB(-14), pan: at, verb: 0.06 }));
  // de vier andere kaartjes klappen weg (0,4 s, 45 ms na elkaar, zoals in main.js)
  for (let j = 0; j < 4; j++) {
    const swish = whoosh(0.4, speedOf(EASE.inOutCubic), { lo: 1400, hi: 3600, q: 1, seed: 1300 + j });
    mix.add(swish, cues.listFilter + j * 0.045, { gain: dB(-24), pan: at + (j - 1.5) * 0.06, verb: 0.08 });
  }
  // gevonden: een kwart omhoog, en de markeerstift over "zeil"
  [86, 91].forEach((m, k) => {
    mix.add(chime(mtof(m), { tail: 0.9, seed: 1310 + k }), cues.hit + k * 0.08, { bus: 'keys', gain: dB(-16.5 - k), pan: at, verb: 0.32, echo: 0.22 });
  });
  mix.add(whoosh(0.34, speedOf(EASE.inOutCubic), { lo: 2600, hi: 5200, q: 1.5, grain: 0.6, seed: 1400 }), cues.mark, { gain: dB(-18), pan: at, verb: 0.05 });
}

function finale(mix, cues) {
  const { turn, expand } = cues.flip;
  mix.add(whoosh(turn[1], speedOf(EASE.inOutCubic), { lo: 320, hi: 2400, seed: 1501 }), turn[0], { gain: dB(-10), verb: 0.18 });
  mix.add(whoosh(expand[1], speedOf(EASE.inOutQuart), { lo: 140, hi: 1500, q: 0.7, seed: 1502 }), expand[0], { gain: dB(-8), verb: 0.2 });
  const at = beat(RESOLVE);
  swell(mix, [62, 66, 69, 73, 76], at - 0.012, dB(-14), 1.1);
  mix.add(boom({ from: 64, to: 37, tail: 0.8, rumble: 0.25 }), at, { gain: dB(-9), verb: 0.18 });
  mix.add(shimmer({ tail: 1.4 }), at, { gain: dB(-20), pan: -0.2, verb: 0.35 });
  // het muzikale logo, F#–A–D, terwijl het woordmerk inschuift
  [[0.5, 78], [0.75, 81], [1, 86]].forEach(([b, m], k) => {
    mix.add(chime(mtof(m), { tail: k === 2 ? 1.4 : 0.9, seed: 1600 + k }), beat(RESOLVE + b), { bus: 'keys', gain: dB(-16), pan: (k - 1) * 0.2, verb: 0.35, echo: 0.25 });
  });
  // de streep onder "naar relatie." wordt van links naar rechts getekend
  const [s0, sd] = cues.swoosh;
  const pan = t => -0.3 + 0.6 * EASE.inOutCubic(clamp((t - s0) / sd));
  mix.add(whoosh(sd, speedOf(EASE.inOutCubic), { lo: 1300, hi: 3800, q: 1.2, grain: 0.7, seed: 1701 }), s0, { gain: dB(-17), pan, verb: 0.1 });
}

function clicks(mix, cues) {
  // de klik valt als de cursor het diepst is ingedrukt, 55 ms na het begin
  cues.clicks.forEach((c, k) => mix.add(mouseClick({ seed: 900 + k }), c.at + 0.055, { gain: dB(-10.5), pan: spread(c.x), verb: 0.06 }));
}

// ---------------------------------------------------------------------------
// samenvoegen
// ---------------------------------------------------------------------------

const SENDS = new Set(['verb', 'echo']);
// iets minder sub, iets meer presence: helder op laptop- en telefoonspeakers
const MASTER_EQ = [['lowShelf', 80, -2], ['peak', 3500, 3, 0.7]];
const ECHO_RETURN = 0.5;
const VERB_RETURN = 0.6;

// Zet alle muziek en effecten op hun plek. timeline = { duration, cues } uit main.js.
export function arrange({ duration, cues }) {
  const mix = new Mix(duration);
  const kicks = drums(mix);
  pads(mix);
  bassLine(mix);
  arpeggio(mix);
  for (const scene of [intro, brand, stepOne, stepTwo, stepThree, finale, clicks]) scene(mix, cues);
  mix.filter('pad', 'high', 190); // geen modder in het laag-midden; de bas en de lage stem doen het laag
  mix.duck('pad', kicks, 0.35);
  mix.duck('bass', kicks, 0.45);
  mix.duck('arp', kicks, 0.25);
  return mix;
}

// Echo en galm op de sends, alle bussen bij elkaar en uitfaden in de laatste 0,7 s.
export function mixdown(mix) {
  const echo = pingPong(mix.bus('echo'), { time: BEAT * 0.75, feedback: 0.38 });
  const send = mix.bus('verb');
  for (let i = 0; i < mix.n; i++) {
    send[0][i] += 0.3 * echo[0][i];
    send[1][i] += 0.3 * echo[1][i];
  }
  const verb = reverb(send, { decay: 1.9, damping: 5200, predelay: 0.022 });
  const sources = [...mix.buses].filter(([name]) => !SENDS.has(name)).map(([, bus]) => [bus, 1]);
  sources.push([echo, ECHO_RETURN], [verb, VERB_RETURN]);
  const out = [new Float32Array(mix.n), new Float32Array(mix.n)];
  for (const [[l, r], g] of sources) {
    for (let i = 0; i < mix.n; i++) {
      out[0][i] += l[i] * g;
      out[1][i] += r[i] * g;
    }
  }
  const fadeFrom = mix.n - Math.round(0.7 * SR);
  for (let i = Math.max(0, fadeFrom); i < mix.n; i++) {
    const g = 0.5 + 0.5 * Math.cos((Math.PI * (i - fadeFrom)) / (mix.n - fadeFrom));
    out[0][i] *= g;
    out[1][i] *= g;
  }
  return out;
}

// De complete soundtrack: { audio: [links, rechts], lufs, limiting (dB) }.
export function soundtrack(timeline) {
  return master(mixdown(arrange(timeline)), { target: -16, ceiling: -1.5, eq: MASTER_EQ });
}
