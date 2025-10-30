## Rolodink Extension Artifacts Verification (v1.0.3)

| Filename | Size | Manifest version | Browser target | Key differences |
|---|---:|---:|---|---|
| linkedin-crm-extension/rolodink-v1.0.3-chrome.zip | 149K | 3 | Chrome | Uses MV3 action + host_permissions |
| Rolodink-Edge-v1.0.3.zip | 149K | 3 | Edge | Uses MV3 action + host_permissions |
| Rolodink-Firefox-1.0.3.zip | 149K | 2 | Firefox | MV2 browser_action; AMO data collection block: collects_data=true |

### Per-artifact details

#### Chrome - `linkedin-crm-extension/rolodink-v1.0.3-chrome.zip`

- **Size**: 149K
- **Manifest version**: 3
- **Version**: 1.0.3

- **Included files**:

```
Archive:  linkedin-crm-extension/rolodink-v1.0.3-chrome.zip
  Length      Date    Time    Name
---------  ---------- -----   ----
      821  2025-10-29 15:09   manifest.json
     4221  2025-10-29 15:09   icon.png
        0  2025-10-29 15:09   icons/
    22977  2025-10-29 15:09   icons/icon128.png
      727  2025-10-29 15:09   icons/icon16.png
     2065  2025-10-29 15:09   icons/icon32.png
     4221  2025-10-29 15:09   icons/icon48.png
    10728  2025-10-29 15:09   content.js
        0  2025-10-29 15:09   ui/
        0  2025-10-29 15:09   ui/dist/
        0  2025-10-29 15:09   ui/dist/assets/
    53760  2025-10-29 15:09   ui/dist/assets/index-BJKNzSnL.css
   208005  2025-10-29 15:09   ui/dist/assets/index-DQF18KNs.js
   149093  2025-10-29 15:09   ui/dist/assets/index-ioCaJVX_.js
      458  2025-10-29 15:09   ui/dist/index.html
     1497  2025-10-29 15:09   ui/dist/vite.svg
---------                     -------
   458573                     16 files
```

- **Development artifacts check**:
```
No dev files detected
```

#### Edge - `Rolodink-Edge-v1.0.3.zip`

- **Size**: 149K
- **Manifest version**: 3
- **Version**: 1.0.3

- **Included files**:

```
Archive:  Rolodink-Edge-v1.0.3.zip
  Length      Date    Time    Name
---------  ---------- -----   ----
      821  2025-10-29 15:09   manifest.json
     4221  2025-10-29 15:09   icon.png
        0  2025-10-29 15:09   icons/
    22977  2025-10-29 15:09   icons/icon128.png
      727  2025-10-29 15:09   icons/icon16.png
     2065  2025-10-29 15:09   icons/icon32.png
     4221  2025-10-29 15:09   icons/icon48.png
    10728  2025-10-29 15:09   content.js
        0  2025-10-29 15:09   ui/
        0  2025-10-29 15:09   ui/dist/
        0  2025-10-29 15:09   ui/dist/assets/
    53760  2025-10-29 15:09   ui/dist/assets/index-BJKNzSnL.css
   208005  2025-10-29 15:09   ui/dist/assets/index-DQF18KNs.js
   149093  2025-10-29 15:09   ui/dist/assets/index-ioCaJVX_.js
      458  2025-10-29 15:09   ui/dist/index.html
     1497  2025-10-29 15:09   ui/dist/vite.svg
---------                     -------
   458573                     16 files
```

- **Development artifacts check**:
```
No dev files detected
```

#### Firefox - `Rolodink-Firefox-1.0.3.zip`

- **Size**: 149K
- **Manifest version**: 2
- **Version**: 1.0.3
- **Data collection**: collects_data=true; types=[browsing_activity]; purpose="Store LinkedIn profile information in user's personal CRM database"

- **Included files**:

```
Archive:  Rolodink-Firefox-1.0.3.zip
  Length      Date    Time    Name
---------  ---------- -----   ----
        0  2025-10-30 14:19   ui/
        0  2025-10-30 14:09   ui/dist/
     1497  2025-10-30 14:09   ui/dist/vite.svg
        0  2025-10-30 14:09   ui/dist/assets/
    53760  2025-10-30 14:09   ui/dist/assets/index-BJKNzSnL.css
   208005  2025-10-30 14:09   ui/dist/assets/index-DQF18KNs.js
   149093  2025-10-30 14:09   ui/dist/assets/index-ioCaJVX_.js
      458  2025-10-30 14:09   ui/dist/index.html
        0  2025-10-21 09:52   icons/
    22977  2025-10-21 09:52   icons/icon128.png
      727  2025-10-21 09:52   icons/icon16.png
     2065  2025-10-21 09:52   icons/icon32.png
     4221  2025-10-21 09:52   icons/icon48.png
     4221  2025-10-30 14:19   icon.png
    10739  2025-10-30 14:19   content.js
     1239  2025-10-30 14:19   manifest.json
---------                     -------
   459002                     16 files
```

- **Development artifacts check**:
```
No dev files detected
```

\n> Note: Chrome and Edge reuse the same MV3 codebase; Firefox uses MV2 with AMO-required fields.
