# Firefox Add-ons (AMO) Submission — Rolodink v1.0.3

This document contains everything needed to submit Rolodink to Firefox Add-ons (AMO).

---

## 1) Verify Source Code Is Ready for Review

- Build instructions (README excerpts)
  - UI (Vite + React):
    ```bash
    cd linkedin-crm-extension/ui
    npm install
    npm run build
    ```
  - Package Firefox build (MV2 bundle used by AMO):
    ```bash
    # Minimal clean package already prepared as Rolodink-Firefox-1.0.3.zip
    # To rebuild locally without rsync:
    #  - Copy icons/, icon.png, content-firefox.js → content.js, manifest-firefox.json → manifest.json
    #  - Copy ui/dist/ (built assets)
    #  - Zip into Rolodink-Firefox-1.0.3.zip
    ```
- Dependencies
  - Runtime: Chrome/Firefox WebExtension APIs, React 18
  - Build-time: Node.js 18+, Vite 5, TypeScript 5, ESLint
  - See `linkedin-crm-extension/ui/package.json` for full dependency list
- Minification/transpilation
  - Vite builds the UI into `ui/dist/` with ES module bundling and minification
  - No source maps or TypeScript sources are shipped in the final ZIP
  - Content script is plain JS (`content.js`)

---

## 2) Listing Content (EN + NL)

### EN
- Name: Rolodink — LinkedIn Notes CRM
- Summary (≤250 chars): Add private notes to LinkedIn profiles. Your modern Rolodex for networking. Notes are stored securely and visible only to you.
- Description:
  - Add, edit, and view private notes directly on LinkedIn profile pages
  - Keep context on people you meet, and never forget follow-ups
  - Fast, privacy-first, and minimal permissions
  - Works with your Rolodink account; your data remains yours
- Privacy Policy URL: https://rolodink.app/privacy

### NL
- Naam: Rolodink — LinkedIn Notities CRM
- Samenvatting (≤250 tekens): Voeg privé‑notities toe aan LinkedIn‑profielen. Jouw moderne rolodex. Notities worden veilig opgeslagen en zijn alleen zichtbaar voor jou.
- Beschrijving:
  - Voeg privé‑notities toe op LinkedIn‑profielen
  - Bewaar context en onthoud acties/afspraken
  - Privacy‑eerst met minimale permissies
  - Werkt met je Rolodink‑account; jouw data blijft van jou
- Privacy Policy URL: https://rolodink.app/privacy

---

## 3) Review Timeline (AMO)
- Human review required
- Typical review time: 3–7 days

---

## 4) Common Review Questions — Prepared Answers

- Why does it need LinkedIn permissions?
  - The extension runs only on `https://www.linkedin.com/in/*` to add a small UI and enable saving user notes for that profile. No other LinkedIn pages are accessed.

- What data is collected and where is it stored?
  - The extension may read basic profile context on visible pages to attach your notes to the correct person. Notes you create are sent to the Rolodink backend (`https://api.rolodink.app`) under your authenticated user account and are only accessible to you.

- How is user privacy protected?
  - Minimal permissions (`activeTab`, `storage`, `tabs`) and restricted host access (LinkedIn profiles + Rolodink API)
  - No third‑party data sharing
  - Clear privacy policy: https://rolodink.app/privacy
  - Firefox‑specific disclosure is included in `manifest.json` under `browser_specific_settings.data_collection_permissions`:
    - collects_data: true
    - data_types: ["browsing_activity"] (limited to LinkedIn profile context)
    - purpose: "Store LinkedIn profile information in user's personal CRM database"

---

## 5) Submission Steps (AMO)
1) Sign in to AMO Developer Hub
2) Create a New Add‑on (listed)
3) Upload `Rolodink-Firefox-1.0.3.zip` (unsigned)
4) Fill listing (EN + NL): name, summary, description, category, privacy policy URL
5) Verify `manifest.json` has `browser_action` and data collection disclosure in `browser_specific_settings`
6) Submit for review and monitor review progress

---

## 6) Included Assets Checklist
- Icons: 16, 32, 48, 128 (PNG) — present in `linkedin-crm-extension/icons/`
- Extension icon: `linkedin-crm-extension/icon.png`
- Screenshots (EN + NL recommended): popup UI, settings, example note on profile
- No promotional video required; optional

---

## 7) Post‑Approval
- Upload signed `.xpi` (if provided) to GitHub release for convenience
- Update website/download links to include the AMO listing URL

