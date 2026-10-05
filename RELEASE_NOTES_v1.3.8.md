# Rolodink v1.3.8 — Meer in je Rldnk, niets dubbel

Deze release voegt e-mail, telefoon en een leesbare export toe aan de popup,
en zorgt dat een notitie niet meer verloren gaat of dubbel in je Rldnk komt.

## Nieuw in de popup

- **E-mail en telefoon.** Je kunt ze nu invullen, bewerken en doorzoeken. Een
  e-mailadres opent je mailprogramma, een telefoonnummer belt direct; ook
  "+31 (0)6 …" belt het juiste nummer. Beide worden versleuteld opgeslagen,
  net als je notities.
- **Leesbare export.** Onder Instellingen exporteer je je connecties als JSON
  of CSV, ontsleuteld in de extensie zelf. De server ziet je notities dus nog
  steeds nooit leesbaar. De CSV opent direct in Excel: in het Nederlands met
  `;` als scheidingsteken, in het Engels met `,`.
- **Startscherm buiten een profiel.** Open je de popup op de feed of in
  zoekresultaten, dan zie je meteen je lijst. Er is ook een knop om feedback
  te sturen.

## Je notities

- **Notitie op twee plekken bewerkt?** Bewerk je dezelfde connectie in de
  popup en op een ander apparaat of tabblad, dan won tot nu toe stil de
  laatste. Nu krijg je een melding en kies je zelf: de nieuwste laden of jouw
  versie bewaren.
- **Het notitieveld staat weer in de profielkop.** Op sommige profielen
  verscheen het veld heel even en verdween het dan onder de advertenties
  rechts. Dat speelde sinds 1.3.4 en is opgelost.
- **Geen dubbele connecties meer.** Hetzelfde profiel kon twee keer in je
  Rldnk komen, bijvoorbeeld via `nl.linkedin.com` naast `www.linkedin.com`,
  of via een link met extra's erachter. Rolodink herkent nu elke variant als
  hetzelfde profiel.
- Wat je typt terwijl je doorklikt naar een ander profiel, blijft bij het
  profiel waarop je het schreef, ook als de server traag antwoordt.

## Account en beveiliging

- **Wachtwoord wijzigen controleert je huidige wachtwoord.** Bevestigen bij
  verwijderen gebeurt in de popup zelf in plaats van in een apart venster,
  dat in Firefox de popup kon sluiten.
- **Account verwijderen haalt ook je login weg.** Voorheen bleef die soms
  staan.
- De lijst in de popup hoort bij jouw account: na uitloggen of een
  accountwissel ziet niemand jouw connecties nog.

## Firefox

- **Firefox 140 of nieuwer is nodig.** Firefox vraagt bij installeren of
  bijwerken om toestemming voor de gegevens die Rolodink naar zijn eigen
  server stuurt: je login, de naam en URL van profielen die je opslaat, en je
  notities. Dat stond voorheen ten onrechte op "geen".

## Sneller en zuiniger

- De popup opent sneller: de lijst wordt pas ontsleuteld als je hem opent.
- De achtergrondwerker is half zo groot en houdt je browser niet meer wakker
  als je Rolodink niet gebruikt.
- Een profielbezoek kost één verzoek aan de server in plaats van meerdere.
