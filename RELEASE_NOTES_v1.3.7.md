# Rolodink v1.3.7 — Je notities blijven staan

Deze release gaat over één ding: wat je typt, blijft staan waar je het
neerzet, en blijft versleuteld waar het bewaard wordt.

## Het notitieveld overschrijft niets meer

Kon het notitieveld je bestaande notitie niet ophalen, omdat de server het
druk had, je sessie was verlopen of er iets misging? Dan ging het veld toch
open, en leeg. Wat je dan typte, verving je opgeslagen notitie.

Dat kan niet meer. Het veld gaat pas open als Rolodink weet wat er staat: je
notitie, of dat dit profiel nog niet in je Rldnk staat. Anders blijft het
dicht, zegt het waarom, en staat er een knop **Retry**.

## Je notitie blijft bij het juiste profiel

Klikte je door naar het volgende profiel terwijl je notitie nog werd
opgeslagen, dan kon die op dat volgende profiel belanden. Het notitieveld
onthoudt nu bij welk profiel het hoort. Het slaat ook op voordat je de pagina
verlaat of van tabblad wisselt.

## In de popup

- **Bewerken wiste e-mail en telefoon.** Het formulier heeft daar geen velden
  voor en stuurde ze leeg mee. Die blijven nu staan.
- **Een notitie die niet te ontsleutelen was, werd overschreven.** De popup
  toonde "🔒 [Encrypted - Passphrase Required]" en sloeg die tekst bij het
  bewerken op in plaats van je notitie. Zo'n veld blijft nu ongemoeid.
- **Na het verwijderen van een connectie stonden je notities onversleuteld in
  de opslag van je browser.** Die blijven nu versleuteld.
- **Je account verwijderen lukte niet in het Engels.** De extensie vroeg om
  "DELETE" en accepteerde alleen "VERWIJDER". Beide werken nu, met hoofd- of
  kleine letters.

## Minder rechten

De extensie vraagt het recht `tabs` niet meer, en stelt geen eigen bestanden
meer open voor webpagina's (`web_accessible_resources`). Ze had geen van beide
nodig.

## Onder de motorkap

- De achtergrondwerker gebruikt overal de browseronafhankelijke API. Hij zet
  je toegangstoken niet meer apart in de extensieopslag, en schrijft de
  inloglink van OAuth niet meer naar het debuglog.
- Wat het notitieveld beslist bij laden, opnieuw proberen en opslaan staat in
  een eigen module, getest tegen echte pagina-elementen. Bewerken en
  verwijderen in de popup worden getest tegen een nep-server.
