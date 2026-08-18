# DOM fixtures

Real markup, captured from a live LinkedIn page, kept so the injection logic can
be tested without a browser.

Capturing a new one: open a profile, and in the page console run

```js
const naam = 'Achternaam';
const hit = [...document.querySelectorAll('body *')]
  .filter(el => el.children.length === 0 && el.textContent.trim().includes(naam))[0];
let box = hit;
for (let i = 0; i < 7 && box && box.parentElement; i++) box = box.parentElement;
copy(box.outerHTML);
```

Name the file after the date it was captured. Do not rewrite an old fixture in
place: the point of keeping them is to see what changed, and an old capture
still documents what the code used to face.

The class names in these files are per-build hashes and mean nothing. Any test
that matches on them is testing LinkedIn's bundler, not our code.

Strip our own injected `#crm-add-button` before saving. A fixture should be the
markup we face, not the markup we left behind.

## What the captures say

| file | profile | notable |
|---|---|---|
| `profile-header-2026-08-11.html` | Paul Christian Gevaerts | first capture after the August 2026 redesign |
| `profile-header-2026-08-17.html` | Emmely Wildeboer | second profile, captured to check the first was not a one-off |

Two captures rather than one on purpose. A single sample cannot distinguish
"this is how LinkedIn builds profile headers" from "this is how it built that
one page", and the whole point of matching on meaning instead of class names is
that it should hold across both. Every anchor test runs against both.

**Neither capture contains the connection degree** - and both captures are of
the *sticky header*, which is the whole reason. A live measurement on
2026-08-18 found "Tim Jansen · 1st" in the hero card, which neither fixture
covers.

An earlier version of this note claimed LinkedIn had stopped rendering the
degree altogether. That was wrong, and wrong in an instructive way: every probe
and capture behind it had only ever seen the sticky header, because
findProfileHeader returned the first candidate in document order and that is
the sticky one. A conclusion about "LinkedIn" was really a conclusion about the
one card the code happened to look at.

The `.dist-value` gate is still gone, and that decision stands on its own - it
was dropped deliberately, not because the degree was unavailable. Reinstating
it would now be possible against the hero.

**Still wanted: a capture of the hero card.** Two attempts produced the sticky
header instead. Until then the hero is covered by the synthetic document in
header-choice.test.ts, which is labelled as synthetic precisely because it is
not a capture.
