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

**Neither capture contains the connection degree.** No `1st`, no `1e`, no
separator dot - not in text, not in an aria-label. Two page-wide console probes
found nothing either. The note card's old `.dist-value` gate is therefore not
merely broken but unimplementable from the header, which is why it was dropped
rather than repaired.
