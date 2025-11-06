# Scripts Status Documentation

Dit document beschrijft de status van scripts in de `scripts/` folder na de migratie naar Turborepo.

## Status Overzicht

### ✅ Actief & Nodig

Deze scripts worden nog gebruikt en moeten behouden blijven:

#### `build-extension.sh`
- **Status**: Actief
- **Gebruik**: Multi-browser extension builds (Chrome, Firefox, Edge)
- **Waarom nodig**: Turborepo gebruikt `build.js` voor de build, maar dit script biedt extra functionaliteit voor multi-target builds
- **Aanbeveling**: Behoud, maar overweeg migratie naar Turborepo task in de toekomst

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

- **Multi-browser builds**: `build-extension.sh` biedt extra functionaliteit
- **Publishing workflows**: Scripts voor store submissions
- **Development utilities**: Backend switching, validation, etc.

## Aanbevelingen

1. **Behoud actieve scripts**: Scripts die nog gebruikt worden moeten behouden blijven
2. **Documenteer gebruik**: Zorg dat elk script duidelijk gedocumenteerd is
3. **Migreer waar mogelijk**: Overweeg om functionaliteit naar Turborepo tasks te migreren waar zinvol
4. **Verwijder legacy**: Verwijder scripts die volledig vervangen zijn door Turborepo

## Toekomstige Verbeteringen

- Migreer `build-extension.sh` functionaliteit naar Turborepo task
- Maak generieke release script in plaats van versie-specifieke scripts
- Centraliseer build logica in Turborepo waar mogelijk

