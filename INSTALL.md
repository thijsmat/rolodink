# Install Rolodink from GitHub Releases

Rolodink is pending Chrome Web Store approval. You can install it manually from GitHub Releases in the meantime.

## Download
- Go to the Releases page of this repository.
- Download the asset named like `Rolodink-X.Y.Z.zip` (the highest version is recommended).

## Install (Chrome)
1. Extract the ZIP to a folder on your computer (e.g., `~/Rolodink-X.Y.Z`).
2. Open Chrome and navigate to `chrome://extensions`.
3. Enable "Developer mode" (top-right).
4. Click "Load unpacked".
5. Select the extracted folder.

## Security warnings
- Chrome may warn about developer mode—this is expected when sideloading.
- Ensure you only install from trusted sources. Verify the repository owner and release signatures.

## Verify installation
- You should see "Rolodink" listed on `chrome://extensions`.
- Click the extension icon; the popup should show the Rolodink UI.
- Version should match the release you downloaded.

## Updating
- Remove or disable the old loaded folder in `chrome://extensions`.
- Download the new `Rolodink-X.Y.Z.zip`, extract, and "Load unpacked" again.
- Alternatively, keep the same folder path and replace its contents, then click "Update" in `chrome://extensions`.

## Uninstalling
- Go to `chrome://extensions`.
- Find Rolodink and click "Remove".

## Troubleshooting
- "Edge: kan niet laden": open `edge://extensions`, zet "Developer mode" aan, kies "Load unpacked" en selecteer de map met `manifest.json`.
- Firefox (tijdelijk laden): ga naar `about:debugging#/runtime/this-firefox` → "Load Temporary Add-on" → kies `manifest.json`.

## Install (Edge)
1. Pak de ZIP uit.
2. Open `edge://extensions`.
3. Zet "Developer mode" aan.
4. Klik "Load unpacked" en kies de uitgepakte map (`manifest.json` zichtbaar).

## Install (Firefox - handmatig / tijdelijk)
1. Pak de ZIP uit of gebruik de signed `.xpi` uit de release.
2. Tijdelijk laden (dev/testing): `about:debugging#/runtime/this-firefox` → "Load Temporary Add-on" → selecteer `manifest.json`.
3. Of installeer de signed `.xpi`: open de `.xpi` in Firefox en volg de prompts.

- "Manifest version not supported": update Chrome to the latest stable.
- "Manifest is invalid": re-download and re-extract the ZIP.
- Popup not opening on LinkedIn: refresh the page, disable script blockers, ensure permissions include linkedin.com.
- Icons missing: confirm you selected the extracted folder root (containing `manifest.json`).


