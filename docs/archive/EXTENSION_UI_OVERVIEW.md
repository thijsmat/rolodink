# 📱 Rolodink Extension UI/UX - Compleet Overzicht

## 🎯 Project Overzicht

**Rolodink** is een Chrome extension die gebruikers helpt hun LinkedIn connecties te beheren met persoonlijke notities. De extension fungeert als een "Rolodex" (digitale contactenkaartjes) voor LinkedIn.

**Tech Stack:**
- React + TypeScript
- Vite (bundler)
- CSS Modules (styling)
- Chrome Storage API
- Supabase Authentication

**Folder Structuur:**
```
linkedin-crm-extension/ui/src/
├── App.tsx (Main app with routing)
├── components/ (All UI components)
├── context/ (State management)
├── styles/ (CSS variables & global styles)
└── config.ts (API configuration)
```

---

## 📋 Alle Pagina's & Components

### **1️⃣ LOGIN VIEW / Inlogpagina**

**Locatie:** `components/LoginView.tsx`

**Functionaliteit:**
- Email/wachtwoord authenticatie
- Sign-in en Sign-up functionaliteit
- Foutmeldingen en validatie
- Feature-highlight sectie met 3 benefits

**Elementen:**
- Logo badge ("in" - LinkedIn stijl)
- Branding: "Rolodink" titel + ondertitel
- Form fields:
  - Email input
  - Wachtwoord input
- Buttons:
  - Inloggen (primary)
  - Registreren (secondary)
- Feedback:
  - Succes/fout meldingen
  - Loading state
- Feature list:
  - ✓ Voeg LinkedIn profielen toe
  - ✓ Bewaar notities
  - ✓ Bekijk alle connecties

**Interacties:**
- Email & password validatie
- Sign-in flow → Supabase auth
- Sign-up flow → Email verification
- Loading states tijdens auth

---

### **2️⃣ CONNECTION VIEW / Profiel Details**

**Locatie:** `components/ConnectionView.tsx`

**Functionaliteit:**
- Toont gedetailleerde informatie van 1 contact
- Kan notities bewerken
- Kan contact verwijderen
- Link naar LinkedIn profiel

**Elementen:**
- Header met titel "Connectie Details"
- Profile Card met:
  - Naam van contact
  - "Verified" badge (✓)
  - LinkedIn profiel link (🔗)
- Detail Rows met icons:
  - 📍 "Ontmoet op" (Locatie/Context)
  - 🏢 "Mijn bedrijf destijds"
  - 📝 Notities sectie (als aanwezig)
- Action Buttons:
  - ✏️ Bewerken (primary)
  - 🗑️ Verwijderen (danger)

**Interacties:**
- Click "Bewerken" → Connection Form openen
- Click LinkedIn link → Open LinkedIn in new tab
- Click "Verwijderen" → Confirm dialog → Delete
- Edit mode → Form mode met "Wijzigingen Opslaan" button

---

### **3️⃣ CONNECTION FORM / Formulier**

**Locatie:** `components/ConnectionForm.tsx`

**Functionaliteit:**
- Form voor het toevoegen/bewerken van contacten
- Wordt gebruikt voor:
  - Nieuwe contacten toevoegen
  - Bestaande contacten bewerken

**Form Fields:**
- **Ontmoet op** (text input)
  - Placeholder: "bijv. LinkedIn event Amsterdam"
  - Icon: 📍
  
- **Mijn bedrijf destijds** (text input)
  - Placeholder: "bijv. Google, StartupX"
  - Icon: 🏢
  
- **Notities** (textarea)
  - Placeholder: "Bijzonderheden, vervolgstappen..."
  - Icon: 📝
  - Supports multi-line text

**Buttons:**
- Submit (Nieuwe Connectie / Wijzigingen Opslaan)
- Cancel / Back

**Validatie:**
- Vereist minstens 1 veld ingevuld
- Character limits waar nodig

---

### **4️⃣ ALL CONNECTIONS VIEW / Alle Connecties Overzicht**

**Locatie:** `components/AllConnectionsView.tsx`

**Functionaliteit:**
- Toont alle opgeslagen contacten in een lijst/grid
- Search & filtering
- Statistieken
- Click contact → ConnectionView openen

**Elementen:**

**Search Bar:**
- Search input (Ctrl+F focus)
- Escape toets om te clearen
- Real-time highlighting van zoekresultaten

**Filter Tabs:**
- Alle connecties (default)
- Met notities
- Recente connecties (top 10)

**Statistics:**
- Totaal aantal contacten
- Aantal met notities
- Aantal recente

**Connection List Items:**
- Naam (heading)
- Ontmoet op (subtitle)
- Bedrijf (subtitle)
- Notitie preview
- Click → Select connection

**Styling:**
- Card-based layout
- Hover effect
- Alternating row colors
- Search highlight styling

---

### **5️⃣ SETTINGS VIEW / Instellingen**

**Locatie:** `components/SettingsView.tsx`

**Functionaliteit:**
- Gebruiker instellingen beheren
- Profiel informatie
- Logout functie
- Gebruiksstatistieken

**Elementen:**
- Titel "Instellingen"
- Profile section:
  - Email display
  - User ID
- Statistics:
  - Totaal connections
  - Connections met notities
- Actions:
  - Logout button
- Disclaimer/Help text

---

### **6️⃣ HELP VIEW / Help & Documentatie**

**Locatie:** `components/HelpView.tsx`

**Functionaliteit:**
- FAQ en documentatie
- Keyboard shortcuts
- Feature explanations
- Contact/support info

**Elementen:**
- Help titel
- FAQ section
- Keyboard shortcuts guide:
  - Escape: Back/Close
  - Alt+L: Logout (in some views)
  - Ctrl+F: Search
- Feature descriptions
- Support links

---

### **7️⃣ ERROR HANDLING**

**Error Message Component:** `components/ErrorMessage.tsx`

**Error Types:**
- Generic errors (try/catch)
- Offline errors
- API errors
- Validation errors

**UI Elements:**
- Error container
- ⚠️ Icon
- Error message text
- Retry button
- Dismiss button

**Offline Error Specifiek:**
- Shows offline status
- Retry/Refresh option
- Clear messaging

---

### **8️⃣ UPDATE NOTIFICATION**

**Locatie:** `components/UpdateNotification.tsx`

**Functionaliteit:**
- Notifies user van extension updates
- Auto-dismiss na delay
- Shows update info

---

### **9️⃣ TOAST NOTIFICATION**

**Locatie:** `components/Toast.tsx`

**Functionaliteit:**
- Temporary notifications
- Success/error messages
- Auto-dismiss
- Position: bottom-right

**Triggers:**
- Connection saved
- Connection deleted
- Search completed
- Error occurred

---

### **🔟 SKELETON LOADER**

**Locatie:** `components/Skeleton.tsx`

**Functionaliteit:**
- Loading placeholders
- Smooth UX during data fetching
- Animate pulse effect

---

## 🎨 Design System

### **Colors (CSS Variables):**
```css
--primary: #0066CC (LinkedIn Blue)
--primary-dark: #0052A3
--secondary: #1B2951 (Azure - accent)
--background: #F5F5F5
--surface: #FFFFFF
--text-primary: #1F1F1F
--text-secondary: #666666
--border: #EEEEEE
--error: #D32F2F
--success: #388E3C
--warning: #F57C00
```

### **Typography:**
- Headings: Sans-serif (Inter/System)
- Body: Sans-serif 14px
- Small: 12px

### **Spacing:**
- Default gap: 8px
- Sections: 16px
- Cards: 12px padding

### **Buttons:**
- Primary: Blue background, white text
- Secondary: Gray border, dark text
- Danger: Red background, white text
- Hover states: opacity/shadow changes

---

## 🔄 User Workflows

### **Workflow 1: New User Onboarding**
```
1. Extension opens → LoginView
2. User enters email + password
3. Click "Registreren" → Create account
4. Receive email verification
5. Confirm email
6. Auto-login → Dashboard
```

### **Workflow 2: Adding a Connection**
```
1. User on LinkedIn profile page
2. Extension icon click → App opens
3. App detects LinkedIn profile (via context)
4. Shows ConnectionForm
5. User fills: Ontmoet op, Bedrijf, Notities
6. Click "Nieuwe Connectie"
7. Toast: "Connectie opgeslagen"
8. Connection added to AllConnections
```

### **Workflow 3: Viewing Connection**
```
1. User clicks "Toon alle connecties"
2. AllConnectionsView opens
3. Search/filter connecties
4. Click connection → ConnectionView
5. View all details
6. Click "Bewerken" → Edit form
7. Save or Delete
```

### **Workflow 4: Managing Settings**
```
1. Click "⚙️ Instellingen"
2. SettingsView opens
3. View profile info
4. See usage stats
5. Click "Logout" → LoginView
```

---

## 🎯 Key Features

### **Feature 1: Context-Based Entry**
- Extension detects current LinkedIn profile
- Auto-shows form for that person
- No manual name entry needed

### **Feature 2: Search & Filter**
- Real-time search (debounced 300ms)
- Search by: Name, Meeting Place, Company, Notes
- Filter: All / With Notes / Recent
- Keyboard shortcuts (Ctrl+F)

### **Feature 3: Rich Notes**
- Multi-line text support
- Meeting context tracking
- Company history tracking
- Free-form notes field

### **Feature 4: Data Persistence**
- Chrome Storage API (local)
- Supabase backend sync
- Offline support

### **Feature 5: Auth & Security**
- Email + password auth
- Supabase authentication
- Access token storage
- Session management

---

## 🚀 Interactions & Animations

### **Button Interactions:**
- Hover: Opacity change + shadow
- Click: Active state
- Disabled: Grayed out

### **Loading States:**
- Skeleton loaders for lists
- Spinner for buttons
- "Bezig..." text updates

### **Form Validation:**
- Real-time feedback
- Error messages
- Field highlighting

### **Transitions:**
- Page transitions: Fade in
- Modal opens: Slide/Fade
- Toast appears: Slide from right

---

## 📊 Data Model

### **Connection Object:**
```typescript
{
  id: string;
  name: string;
  linkedInUrl: string;
  meetingPlace?: string;
  userCompanyAtTheTime?: string;
  notes?: string;
  createdAt: timestamp;
  updatedAt: timestamp;
}
```

### **User Object:**
```typescript
{
  id: string;
  email: string;
  createdAt: timestamp;
  lastLogin: timestamp;
}
```

---

## 🔌 API Endpoints

**Base URL:** `${API_BASE_URL}` (from config)

### **Authentication:**
- `POST /api/auth/signin` - Login
- `POST /api/auth/signup` - Register

### **Connections:**
- `GET /api/connections` - Fetch all
- `POST /api/connections` - Create
- `PUT /api/connections/:id` - Update
- `DELETE /api/connections/:id` - Delete

### **User:**
- `GET /api/user/profile` - Get profile
- `GET /api/user/stats` - Get statistics

---

## 🎬 Next Steps for Figma Design

### **Recommended Improvements:**
1. **Visual Hierarchy:** Better card layouts, typography scale
2. **Color Palette:** More modern, better contrast
3. **Icons:** Custom SVG icons instead of emoji
4. **Animations:** Smooth transitions between views
5. **Mobile:** Optimize for smaller popup sizes
6. **Dark Mode:** Dark theme support
7. **Accessibility:** Better color contrast, larger touch targets
8. **Micro-interactions:** Hover effects, loading animations

---

## 📐 Extension Dimensions

**Chrome Extension Popup:**
- Width: 400px (typical)
- Height: 600px (typical)
- Resizable

**Responsive Breakpoints:**
- Mobile: 320px-500px
- Tablet: 500px-800px
- Desktop: 800px+

---

**Document Generated:** 2025-10-21
**Version:** 1.0
**Status:** Ready for Figma Design Handoff
