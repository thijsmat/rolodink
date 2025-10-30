# Releases Strategy

This repository hosts both the website and the browser extension. To avoid confusion, we follow these guidelines.

## Current State (as of v1.0.3)
- v1.0.3: Extension — first official multi‑browser release (Chrome, Edge, Firefox)
- v1.0.2: Extension — marked as Pre‑release and deprecated in favor of v1.0.3
- v1.0.9 / v1.0.10 / v1.0.11: Website releases (left as-is)

## Short‑Term Rules
- Keep v1.0.3 as the Latest release (extension)
- Leave v1.0.9 / v1.0.10 / v1.0.11 intact (website)
- v1.0.2 is pre‑release with a deprecation notice

## Long‑Term Naming (to be adopted going forward)
- Extension releases: ext-vX.Y.Z (e.g., ext-v1.1.0)
- Website releases: web-vX.Y.Z (e.g., web-v1.2.0)

This avoids collisions when both products evolve independently.

## Notes
- Do not retroactively rename existing tags for now (risk of breaking links)
- When creating a new release, clearly mention whether it is Website or Extension in the title and notes
- Attach packaged artifacts only to Extension releases
