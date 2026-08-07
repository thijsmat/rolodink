# Scripts Status Documentation

Dit document beschrijft de status van scripts in de `scripts/` folder na de migratie naar Turborepo.

## Status Overzicht

### ✅ Actief & Nodig

Deze scripts worden nog gebruikt en moeten behouden blijven:

#### `prepare-firefox-source.sh`
- **Status**: Actief
- **Gebruik**: Voorbereiden van Firefox AMO submission
- **Waarom nodig**: Vereist voor Firefox publishing workflow
- **Aanbeveling**: Behoud

#### `switch_backend.sh`
- **Status**: Actief
- **Gebruik**: Switchen tussen staging en production backend URLs
- **Waarom nodig**: Development workflow voor testing
- **Aanbeveling**: Behoud

#### `validate-extension.mjs`
- **Status**: Actief
- **Gebruik**: Validatie van extension manifest en bestanden
- **Waarom nodig**: Quality assurance voor publishing
- **Aanbeveling**: Behoud

#### `verify-artifacts.sh`
- **Status**: Actief
- **Gebruik**: Verificatie van build artifacts
- **Waarom nodig**: Quality assurance voor publishing
- **Aanbeveling**: Behoud

#### `setup-branch-protection.sh`
- **Status**: Actief
- **Gebruik**: GitHub branch protection setup
- **Waarom nodig**: Repository management
- **Aanbeveling**: Behoud

#### `create-github-release-v1.0.3.sh`
- **Status**: Actief (versie-specifiek)
- **Gebruik**: GitHub release creation
- **Waarom nodig**: Release management
- **Aanbeveling**: Behoud, maar overweeg generieke versie

### ⚠️ Legacy / Mogelijk Verouderd

Deze scripts zijn mogelijk verouderd na de Turborepo migratie:

#### `package_extension.sh`
- **Status**: Legacy
- **Gebruik**: Extension packaging met backend URL switching
- **Probleem**: Functionaliteit overlapt met `build.js` en `switch_backend.sh`
- **Aanbeveling**: 
  - Evalueren of functionaliteit volledig vervangen is door `build.js` + `switch_backend.sh`
  - Als niet meer nodig: verwijderen
  - Als nog nodig: documenteren waarom en wanneer te gebruiken

## Turborepo Migratie

### Wat is vervangen door Turborepo?

- **Build process**: Nu via `turbo run build` in plaats van individuele shell scripts
- **Extension build**: Nu via `npm run build` in `linkedin-crm-extension/` (gebruikt `build.js`)
- **Dependency management**: Nu via Turborepo pipeline

### Wat blijft nodig?

- **Multi-browser builds**: `linkedin-crm-extension/build.js chrome|edge|firefox` — hetzelfde script dat `release.yml` gebruikt
- **Publishing workflows**: Scripts voor store submissions
- **Development utilities**: Backend switching, validation, etc.

### Verwijderd

- **`build-extension.sh`** — werd door geen enkele workflow of npm-script
  aangeroepen en was bovendien kapot: het zette `ui/dist/index.html` nooit in de
  pakketroot terwijl het manifest `"default_popup": "index.html"` declareert.
  Dit document noemde het eerder "Actief"; dat was onjuist en heeft minstens één
  keer geleid tot verificatie van releases tegen het verkeerde script. De echte
  release-build is `linkedin-crm-extension/build.js`.
- **`linkedin-crm-extension/build-production.js`** — zelfde categorie: alleen in
  documentatie genoemd, nooit aangeroepen, en het bevatte een
  command-injection-patroon (`execSync` met geïnterpoleerde bestandsnaam).
- **`ui/remove-block-comments.cjs`** — werd door niets aangeroepen; alleen
  meegekopieerd in het AMO-bronarchief, waar het ook niets deed.

## Aanbevelingen

1. **Behoud actieve scripts**: Scripts die nog gebruikt worden moeten behouden blijven
2. **Documenteer gebruik**: Zorg dat elk script duidelijk gedocumenteerd is
3. **Migreer waar mogelijk**: Overweeg om functionaliteit naar Turborepo tasks te migreren waar zinvol
4. **Verwijder legacy**: Verwijder scripts die volledig vervangen zijn door Turborepo

## Toekomstige Verbeteringen

- Maak generieke release script in plaats van versie-specifieke scripts
- Centraliseer build logica in Turborepo waar mogelijk

