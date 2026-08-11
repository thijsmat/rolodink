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
