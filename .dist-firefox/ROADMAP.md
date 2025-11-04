# Rolodink Chrome Extension - Roadmap

> **Status:** Ready for testing and deployment  
> **Current Version:** 1.0.2  
> **Next Release:** 1.0.3 (Production launch)

---

## 📊 HUIDIGE STATUS

### ✅ Wat is er al

**Extensie Basis:**
- ✅ Chrome Extension Manifest V3 (v1.0.2)
- ✅ React 18 + TypeScript UI
- ✅ Vite build system
- ✅ Vanilla CSS + CSS Modules (LinkedIn design)
- ✅ Supabase backend integratie
- ✅ Content script voor LinkedIn injectie

**UI Components:**
- ✅ LoginView (Supabase auth)
- ✅ ConnectionView (detail view)
- ✅ ConnectionForm (add/edit notes)
- ✅ AllConnectionsView (list van connecties)
- ✅ SettingsView
- ✅ HelpView
- ✅ Error handling (online/offline)
- ✅ Toast notifications
- ✅ Update notifications
- ✅ Keyboard shortcuts (Esc, Alt+L)

**Features:**
- ✅ "Add to CRM" button op LinkedIn profielen
- ✅ Notities toevoegen aan connecties
- ✅ Alle connecties bekijken
- ✅ Connectie details bekijken/bewerken
- ✅ Context-aware (detecteert huidig LinkedIn profiel)

**Documentatie:**
- ✅ README.md (UI architecture)
- ✅ STYLING.md (CSS architecture)
- ✅ Monorepo STYLING.md (overview beide projecten)

---

## 🎯 FASE 1: TESTING & DEPLOYMENT

**Prioriteit:** 🔴 **HOOG**  
**Geschatte tijd:** 1-2 weken  
**Status:** 📋 Ready to start

### 1.1 Lokaal Testen

**Doel:** Verifieer alle functionaliteit werkt correct

**Stappen:**
```bash
# Build extensie
cd /home/matthijsgoes/Projecten/LinkedinCRM/linkedin-crm-extension/ui
npm run build

# Laad in Chrome
# 1. Chrome → chrome://extensions/
# 2. Enable "Developer mode"
# 3. Click "Load unpacked"
# 4. Select: /home/matthijsgoes/Projecten/LinkedinCRM/linkedin-crm-extension/
```

**Test Checklist:**
- [ ] Extensie laadt zonder console errors
- [ ] Manifest v3 permissions correct
- [ ] Icon zichtbaar in Chrome toolbar
- [ ] Popup opent met correcte dimensions (380px × 500-600px)

**LinkedIn Integratie:**
- [ ] Ga naar LinkedIn profiel (https://linkedin.com/in/*)
- [ ] "Add to CRM" button verschijnt in profile header
- [ ] Button styling matcht LinkedIn design
- [ ] Click op button opent popup met profiel data

**Auth Flow:**
- [ ] Login view toont bij eerste gebruik
- [ ] Supabase login werkt (email + password)
- [ ] Session wordt opgeslagen (blijft ingelogd)
- [ ] Logout functionaliteit werkt (Alt+L shortcut)

**CRUD Operaties:**
- [ ] Nieuwe notitie toevoegen aan profiel
- [ ] Notitie wordt opgeslagen in Supabase
- [ ] Alle connecties view toont opgeslagen connecties
- [ ] Connectie details view toont correcte data
- [ ] Notitie bewerken werkt
- [ ] Notitie verwijderen werkt

**UI/UX:**
- [ ] Toast notifications tonen bij acties
- [ ] Error messages tonen bij failures
- [ ] Loading states correct
- [ ] Offline detection werkt
- [ ] Keyboard shortcuts werken (Esc, Alt+L)

**Edge Cases:**
- [ ] Geen internet connectie (offline mode)
- [ ] LinkedIn profile zonder naam
- [ ] Lange notities (>500 characters)
- [ ] Speciale characters in notities
- [ ] Snel achter elkaar klikken (race conditions)

---

### 1.2 Browser Compatibility Testing

**Doel:** Test in alle target browsers

**Chrome (Primary):**
```bash
cd /home/matthijsgoes/Projecten/LinkedinCRM/linkedin-crm-extension/ui
npm run build
# Test in Chrome
```

**Firefox (Secondary):**
```bash
# Gebruik Firefox manifest
cp manifest-firefox.json manifest.json
npm run build
# about:debugging → Load Temporary Add-on
```

**Edge (Secondary):**
```bash
# Edge gebruikt Chrome manifest
npm run build
# edge://extensions/ → Load unpacked
```

**Test Checklist:**
- [ ] Chrome: Alle features werken
- [ ] Firefox: Alle features werken (inclusief manifest-firefox.json aanpassingen)
- [ ] Edge: Alle features werken
- [ ] Safari: Evalueer of dit nodig is (vereist extra conversie)

**LinkedIn Layout Variaties:**
- [ ] Desktop layout (standaard)
- [ ] LinkedIn Recruiter layout
- [ ] LinkedIn Sales Navigator
- [ ] Verschillende talen (EN, NL, DE)

---

### 1.3 Backend Setup Verificatie

**Doel:** Verifieer backend is production-ready

**API Endpoints Testen:**
```bash
# Health check
curl https://api.rolodink.app/health

# Auth test (vervang TOKEN)
curl -H "Authorization: Bearer TOKEN" \
  https://api.rolodink.app/api/connections

# Create connection
curl -X POST https://api.rolodink.app/api/connections \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","url":"https://linkedin.com/in/test","notes":"Test note"}'
```

**Checklist:**
- [ ] API is deployed op `api.rolodink.app`
- [ ] HTTPS certificaat is geldig
- [ ] CORS headers toegestaan voor Chrome extensie (`chrome-extension://`)
- [ ] Rate limiting is geconfigureerd
- [ ] Error responses zijn consistent
- [ ] Supabase connection pool is optimaal

**Vercel Deployment:**
- [ ] Vercel project is linked
- [ ] Environment variables zijn ingesteld
- [ ] Deploy from main branch werkt
- [ ] Logs zijn toegankelijk

**Database:**
- [ ] Supabase project is production-ready
- [ ] Row Level Security (RLS) policies zijn actief
- [ ] Backup strategie is geconfigureerd
- [ ] Connection limits zijn voldoende

---

## 🎯 FASE 2: PRODUCTIE RELEASE

**Prioriteit:** 🔴 **HOOG**  
**Geschatte tijd:** 1 week  
**Status:** ⏳ Waiting for Phase 1

### 2.1 Pre-Release Checklist

**Manifest Updates:**
- [ ] Update versienummer: `1.0.2` → `1.0.3`
- [ ] Controleer `permissions` (minimaal noodzakelijk)
- [ ] Controleer `host_permissions` (alleen LinkedIn + API)
- [ ] Voeg `homepage_url` toe (https://rolodink.app)
- [ ] Voeg privacy policy URL toe
- [ ] Voeg terms of service URL toe

**Beschrijvingen:**
- [ ] Extension naam: "Rolodink - LinkedIn CRM Notes"
- [ ] Korte beschrijving (132 chars max): "Add personal notes to LinkedIn profiles. Remember why every connection matters."
- [ ] Lange beschrijving schrijven (Engels + Nederlands?)
- [ ] Feature list maken voor store listing

**Visuals:**
- [ ] Screenshots maken (1280×800 of 640×400):
  - Screenshot 1: LinkedIn profiel met "Add to CRM" button
  - Screenshot 2: Popup met notitie form
  - Screenshot 3: Alle connecties view
  - Screenshot 4: Connectie details met notities
  - Screenshot 5: Settings view
- [ ] Promotional tile maken (440×280)
- [ ] Small tile maken (128×128 - optioneel)
- [ ] Marquee promotional tile (1400×560)

**Legal:**
- [ ] Privacy policy schrijven (gebruik template)
- [ ] Terms of service schrijven
- [ ] Publiceren op https://rolodink.app/privacy
- [ ] Publiceren op https://rolodink.app/terms

---

### 2.2 Build voor Productie

**Chrome Build:**
```bash
cd /home/matthijsgoes/Projecten/LinkedinCRM/linkedin-crm-extension

# Ensure manifest is correct
cp manifest.json manifest-backup.json

# Build UI
cd ui
npm run build
cd ..

# Create ZIP (exclude dev files)
zip -r rolodink-v1.0.3-chrome.zip \
  manifest.json \
  content.js \
  icon.png \
  icons/ \
  ui/dist/ \
  -x "*.DS_Store" \
  -x "ui/dist/*.map"

# Verify ZIP contents
unzip -l rolodink-v1.0.3-chrome.zip
```

**Firefox Build:**
```bash
# Use Firefox manifest
cp manifest-firefox.json manifest.json

# Build UI (same as Chrome)
cd ui
npm run build
cd ..

# Create ZIP for Firefox
zip -r rolodink-v1.0.3-firefox.zip \
  manifest.json \
  content-firefox.js \
  icon.png \
  icons/ \
  ui/dist/ \
  -x "*.DS_Store" \
  -x "ui/dist/*.map"

# Restore Chrome manifest
cp manifest-backup.json manifest.json
```

**Edge Build:**
```bash
# Edge uses same as Chrome
cp rolodink-v1.0.3-chrome.zip rolodink-v1.0.3-edge.zip
```

**Checklist:**
- [ ] Source maps zijn excluded uit production build
- [ ] Bundle size is acceptabel (<10MB)
- [ ] Alle assets zijn included
- [ ] Geen dev dependencies in bundle
- [ ] ZIP test: extract en test lokaal

---

### 2.3 Store Submissions

#### Chrome Web Store

**Account Setup:**
- [ ] Registreer Chrome Web Store developer account
- [ ] Betaal $5 eenmalige registratiefee
- [ ] Verifieer email address

**Submission:**
1. Ga naar [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
2. Click "New Item"
3. Upload `rolodink-v1.0.3-chrome.zip`
4. Vul store listing in:
   - Product name: "Rolodink - LinkedIn CRM Notes"
   - Summary (132 chars)
   - Description (uitgebreid)
   - Category: Productivity
   - Language: English (+ Dutch optioneel)
5. Upload screenshots (1280×800)
6. Upload promotional images
7. Privacy practices:
   - Data collection: Yes (user notes)
   - Privacy policy URL: https://rolodink.app/privacy
8. Submit for review

**Review Process:**
- [ ] Submit voor review
- [ ] Wait 1-3 business days
- [ ] Address any review feedback
- [ ] Approved: note extension URL
- [ ] Update website `NEXT_PUBLIC_EXTENSION_URL`

**Post-Approval:**
- [ ] Test installatie via Web Store
- [ ] Monitor reviews
- [ ] Setup email alerts voor reviews

---

#### Firefox Add-ons (AMO)

**Account Setup:**
- [ ] Registreer op [addons.mozilla.org](https://addons.mozilla.org)
- [ ] Verifieer email (gratis, geen fee)

**Submission:**
1. Ga naar [Developer Hub](https://addons.mozilla.org/developers/)
2. Click "Submit a New Add-on"
3. Upload `rolodink-v1.0.3-firefox.zip`
4. Vul listing in:
   - Name: "Rolodink - LinkedIn CRM Notes"
   - Summary (250 chars)
   - Description (uitgebreid)
   - Categories: Productivity, Social & Communication
5. Upload screenshots (1280×800)
6. Privacy policy URL: https://rolodink.app/privacy
7. Submit for review

**Review Process:**
- [ ] Submit voor review
- [ ] Wait 1-7 days (manual review)
- [ ] Address any feedback
- [ ] Approved: note extension URL

---

#### Edge Add-ons

**Account Setup:**
- [ ] Registreer op [Microsoft Partner Center](https://partner.microsoft.com/dashboard)
- [ ] Verifieer account (gratis)

**Submission:**
1. Ga naar Edge Add-ons dashboard
2. Upload `rolodink-v1.0.3-edge.zip` (Chrome build werkt)
3. Vul listing in (similar to Chrome)
4. Submit for review

**Review Process:**
- [ ] Submit voor review
- [ ] Wait 1-3 business days
- [ ] Address feedback
- [ ] Approved: note extension URL

---

#### Safari (Optioneel - Later)

Safari extensies vereisen:
- Xcode conversion (Safari Web Extension)
- Apple Developer account ($99/jaar)
- macOS voor development

**Beslissing:** Skip voor nu, evalueer na 1000+ Chrome users

---

## 🎯 FASE 3: FEATURES & IMPROVEMENTS

**Prioriteit:** 🟡 **MEDIUM**  
**Geschatte tijd:** 4-8 weken  
**Status:** 💡 Backlog

### 3.1 UX Verbeteringen

#### Quick Add Note
**Probleem:** Popup openen is extra stap  
**Oplossing:** Inline notitie toevoegen op LinkedIn page

- [ ] Design inline note widget
- [ ] Implementeer als content script overlay
- [ ] Auto-save on blur
- [ ] Keyboard shortcut (Alt+N)

#### Search & Filter
**Probleem:** Moeilijk om specifieke connectie te vinden  
**Oplossing:** Search functionality in All Connections view

- [ ] Search input component
- [ ] Fuzzy search op naam, bedrijf, notities
- [ ] Filter op tags (zie 3.1.3)
- [ ] Sort opties (recent, alfabetisch, etc.)

#### Tags System
**Probleem:** Geen manier om connecties te categoriseren  
**Oplossing:** Tag system voor organisatie

- [ ] Tag model in database
- [ ] Tag input component (multi-select)
- [ ] Tag badges in UI
- [ ] Filter op tags
- [ ] Predefined tags (Client, Lead, Colleague, etc.)

#### Export Function
**Probleem:** Data lock-in, geen backup  
**Oplossing:** Export functionaliteit

- [ ] Export to CSV
- [ ] Export to JSON
- [ ] Include timestamps
- [ ] Privacy: exclude sensitive fields option

#### More Keyboard Shortcuts
**Huidige:** Esc (close), Alt+L (logout)  
**Toevoegen:**
- [ ] Alt+N: New note (quick add)
- [ ] Alt+S: Search connections
- [ ] Alt+A: View all connections
- [ ] Cmd/Ctrl+K: Command palette

#### Dark Mode
**Probleem:** Bright UI in dark LinkedIn theme  
**Oplossing:** Dark mode support

- [ ] Detect LinkedIn theme preference
- [ ] Dark mode CSS variables
- [ ] Toggle in settings
- [ ] Persist preference
- [ ] Update icons for dark mode

---

### 3.2 LinkedIn Integratie Uitbreiden

#### Connection Requests
**Feature:** Add note when sending connection request

- [ ] Inject note field in connection modal
- [ ] Save note with pending connection
- [ ] Update when connection accepted

#### Messages
**Feature:** Show CRM info in LinkedIn messages sidebar

- [ ] Detect active conversation
- [ ] Show compact note widget in sidebar
- [ ] Quick edit notes
- [ ] Last interaction timestamp

#### Search Results
**Feature:** CRM indicator in LinkedIn search results

- [ ] Inject icon/badge in search result cards
- [ ] Show if person has notes
- [ ] Quick preview on hover

#### Company Pages
**Feature:** Notes for companies (not just people)

- [ ] Support linkedin.com/company/* URLs
- [ ] Company notes model
- [ ] Company view in popup
- [ ] Link employees to companies

#### Events
**Feature:** Notes for LinkedIn events

- [ ] Support linkedin.com/events/* URLs
- [ ] Event notes (who you met, key takeaways)
- [ ] Link people to events

---

### 3.3 Data & Sync

#### Offline Mode
**Current:** Partial offline support  
**Goal:** Full offline mode with sync

- [ ] IndexedDB for local storage
- [ ] Sync queue for offline changes
- [ ] Conflict resolution strategy
- [ ] Background sync when online
- [ ] Offline indicator in UI

#### Import from LinkedIn
**Feature:** Import connections from LinkedIn CSV export

- [ ] CSV parser
- [ ] Map LinkedIn fields to Rolodink
- [ ] Bulk import UI
- [ ] Preview before import
- [ ] Deduplicate existing connections

#### Backup & Restore
**Feature:** Automated backups

- [ ] Export to Google Drive (OAuth)
- [ ] Export to Dropbox (OAuth)
- [ ] Scheduled auto-backups
- [ ] Restore from backup
- [ ] Backup history

#### Multi-device Sync
**Current:** Sync via Supabase (manual refresh)  
**Goal:** Real-time sync

- [ ] Supabase Realtime subscriptions
- [ ] Push updates to all devices
- [ ] Optimistic UI updates
- [ ] Conflict resolution

#### Version History
**Feature:** Track note changes over time

- [ ] Note history table in DB
- [ ] Show edit history in UI
- [ ] Restore previous version
- [ ] Show who edited (if team feature)

---

## 🎯 FASE 4: ANALYTICS & MONITORING

**Prioriteit:** 🟡 **MEDIUM**  
**Geschatte tijd:** 1-2 weken  
**Status:** 💡 Backlog

### 4.1 Error Tracking

#### Sentry Integration
```bash
cd ui
npm install @sentry/react @sentry/browser
```

**Setup:**
- [ ] Create Sentry project
- [ ] Add Sentry DSN to config
- [ ] Wrap app in ErrorBoundary
- [ ] Track unhandled errors
- [ ] Track API errors
- [ ] Add breadcrumbs for debugging

**Monitoring:**
- [ ] Extension errors
- [ ] Content script errors
- [ ] API call failures
- [ ] Auth failures
- [ ] Performance issues

**Alerts:**
- [ ] Email on critical errors
- [ ] Slack integration
- [ ] Weekly error digest

---

### 4.2 Usage Analytics

#### Privacy-First Analytics
**Tool:** Plausible / Fathom (GDPR-friendly)

**Metrics to Track:**
- [ ] Daily active users (DAU)
- [ ] Weekly active users (WAU)
- [ ] Monthly active users (MAU)
- [ ] Notes created per day
- [ ] Average notes per user
- [ ] Feature usage (All Connections, Settings, etc.)
- [ ] Retention rate (D1, D7, D30)

**Events:**
- [ ] Extension installed
- [ ] User logged in
- [ ] Note created
- [ ] Note edited
- [ ] Note deleted
- [ ] Connection viewed
- [ ] All connections viewed
- [ ] Export data
- [ ] Feature X used

**Implementation:**
```bash
npm install @plausible/tracker
```

**Privacy:**
- [ ] No personal data tracked
- [ ] No IP tracking
- [ ] Anonymous user IDs
- [ ] GDPR compliant
- [ ] Privacy policy updated

---

### 4.3 A/B Testing

**For future feature rollouts:**

- [ ] Feature flags system
- [ ] Split testing framework
- [ ] Metrics comparison
- [ ] Gradual rollouts

---

## 🎯 FASE 5: MARKETING & GROWTH

**Prioriteit:** 🟢 **LOW** (after launch)  
**Geschatte tijd:** Ongoing  
**Status:** 💡 Backlog

### 5.1 Product Hunt Launch

**Preparation:**
- [ ] Create Product Hunt account
- [ ] Build hunter relationships
- [ ] Prepare launch post (title, tagline, description)
- [ ] Make demo video (60-90 seconds)
- [ ] Create promotional images
- [ ] Plan launch date (Tuesday-Thursday optimal)

**Launch Day:**
- [ ] Post at 12:01am PST
- [ ] Share in communities
- [ ] Reply to all comments
- [ ] Tweet about launch
- [ ] LinkedIn post

**Follow-up:**
- [ ] Thank supporters
- [ ] Implement feedback
- [ ] Share results

---

### 5.2 Content Marketing

#### Blog Posts
- [ ] "How to Remember Every LinkedIn Connection"
- [ ] "The Modern Rolodex: LinkedIn + Personal Notes"
- [ ] "Why CRM Tools Are Overkill for Personal Networking"
- [ ] "5 Tips for Better Professional Relationships"

#### Video Content
- [ ] 60-second feature demo
- [ ] Tutorial: How to use Rolodink
- [ ] Use case videos (recruiter, salesperson, networker)

#### Social Media
- [ ] LinkedIn posts (weekly)
- [ ] Twitter threads about networking
- [ ] Reddit posts in r/LinkedIn, r/productivity

---

### 5.3 User Feedback & Community

#### Feedback Channels
- [ ] In-app feedback button
- [ ] Chrome Web Store reviews monitoring
- [ ] Email support (support@rolodink.app)
- [ ] GitHub Issues (public roadmap)

#### Community Building
- [ ] Discord server? (optional)
- [ ] Newsletter for updates
- [ ] Beta testing program
- [ ] Feature voting

---

## 🎯 FASE 6: BACKEND IMPROVEMENTS

**Prioriteit:** 🟢 **LOW**  
**Geschatte tijd:** 2-4 weken  
**Status:** 💡 Backlog

### 6.1 API Enhancements

#### Versioning
```
Current: /api/connections
New: /api/v1/connections
```

- [ ] Implement API versioning
- [ ] Backward compatibility
- [ ] Deprecation notices
- [ ] Migration guide

#### Rate Limiting
- [ ] Implement rate limiting (per user)
- [ ] 100 requests per minute per user
- [ ] 1000 requests per hour per user
- [ ] Response headers (X-RateLimit-*)

#### Webhooks
- [ ] Webhook system for real-time updates
- [ ] Webhook subscriptions
- [ ] Retry logic
- [ ] Webhook logs

#### Analytics Endpoint
- [ ] GET /api/v1/stats (user stats)
- [ ] Connection count
- [ ] Notes count
- [ ] Activity timeline

---

### 6.2 Database Optimizations

#### Indexing
- [ ] Add indexes for common queries
- [ ] Index on user_id + url (unique connections)
- [ ] Index on user_id + created_at (recent connections)
- [ ] Full-text search index on notes

#### Connection Pool
- [ ] Optimize Supabase connection pool
- [ ] Monitor pool usage
- [ ] Adjust limits based on load

#### Backup Strategy
- [ ] Daily automated backups
- [ ] Weekly full backups
- [ ] Point-in-time recovery
- [ ] Test restore process

#### Data Retention
- [ ] Policy for deleted accounts
- [ ] Soft delete vs hard delete
- [ ] GDPR compliance (right to be forgotten)
- [ ] Data export for users

---

## 📅 TIMELINE OVERVIEW

### Week 1-2: Testing & Deployment Prep
- Fase 1.1: Lokaal testen
- Fase 1.2: Browser compatibility
- Fase 1.3: Backend verificatie
- Fase 2.1: Pre-release checklist

### Week 3: Production Release
- Fase 2.2: Production builds
- Fase 2.3: Store submissions (Chrome, Firefox, Edge)
- Wait for approvals

### Week 4-5: Initial Launch
- Monitor reviews
- Fix critical bugs
- Gather user feedback
- Product Hunt launch

### Week 6-10: Feature Development
- Fase 3: Implement top requested features
- Fase 4: Setup analytics & monitoring

### Week 11+: Growth & Iteration
- Fase 5: Marketing & community building
- Fase 6: Backend improvements
- Continuous iteration based on feedback

---

## 📊 SUCCESS METRICS

### Launch Goals (Month 1)
- [ ] 100 users
- [ ] 4.0+ star rating on Chrome Web Store
- [ ] <5% crash rate
- [ ] <1 second popup load time

### Growth Goals (Month 3)
- [ ] 1,000 users
- [ ] 10,000+ notes created
- [ ] 50% D7 retention
- [ ] 25% MAU/Install ratio

### Long-term Goals (Month 6)
- [ ] 10,000 users
- [ ] 100,000+ notes created
- [ ] Product Hunt featured
- [ ] Profitable (if monetization)

---

## 🚀 QUICK REFERENCE

### Build Commands
```bash
# Development
cd ui && npm run dev

# Production build
cd ui && npm run build

# Create distribution ZIP
cd .. && zip -r rolodink-v1.0.3-chrome.zip manifest.json content.js icon.png icons/ ui/dist/
```

### Test Commands
```bash
# Lint
npm run lint

# Type check
npx tsc --noEmit

# Test backend
curl https://api.rolodink.app/health
```

### Deployment URLs
- **Website:** https://rolodink.app
- **API:** https://api.rolodink.app
- **Supabase:** https://app.supabase.com
- **Chrome Store:** (pending)
- **Firefox AMO:** (pending)

---

**Last Updated:** 2025-10-29  
**Maintainer:** Matthijs Goes (@thijsmat)  
**Version:** 1.0 (Living document - update as we progress)

