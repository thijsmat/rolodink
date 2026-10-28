# Mijn LinkedIn CRM Project Werkwijze

## Normale Ontwikkeling
1.  Werk altijd op een `feature`-branch die is afgetakt van `develop`.
2.  Test op de `staging`-omgeving.
3.  Merge naar `develop`, dan naar `main`.

## Een Productie-versie Maken voor Testers
*Dit script zorgt ervoor dat de extensie met de **productie**-database praat.*

1.  Zorg dat alle wijzigingen op de `main`-branch staan.
2.  Voer het volgende commando uit in de terminal vanuit de `LinkedinCRM`-hoofdmap:
    ```bash
    bash scripts/package_extension.sh
    ```
3.  Het `.zip`-bestand staat nu klaar in de hoofdmap.