# 🎨 Rolodink Extension - Gedetailleerde UI/UX Specificaties

## 📐 LAYOUT & STRUKTUR

### **Main Container**
- Width: 400px (popup default)
- Height: Variable (scrollable content)
- Background: #F5F5F5
- Font: System sans-serif, 14px
- Line height: 1.5

### **Header Bar (All Views)**
```
┌─────────────────────────────────┐
│ Rolodink                   [Buttons] │
└─────────────────────────────────┘
- Height: 56px
- Background: White
- Border-bottom: 1px #EEEEEE
- Padding: 12px 16px
- Display: Flex, space-between, align-center
```

**Left:** Logo + Title
**Right:** Context buttons (Toon alle connecties, Instellingen, Help, Logout)

---

## 📱 PAGE LAYOUTS

### **PAGE 1: LOGIN VIEW**

```
┌─────────────────────────────────┐
│                                 │
│    ░  ROLODINK                  │
│    =========================================│
│    Beheer je LinkedIn connecties│
│    op één plek met Rolodink     │
│                                 │
│    ┌──────────────────────────┐ │
│    │ Email                    │ │
│    │ je@email.com             │ │
│    └──────────────────────────┘ │
│                                 │
│    ┌──────────────────────────┐ │
│    │ Wachtwoord               │ │
│    │ ••••••••                 │ │
│    └──────────────────────────┘ │
│                                 │
│    ┌────────┐  ┌─────────────┐ │
│    │Inloggen│  │ Registreren │ │
│    └────────┘  └─────────────┘ │
│                                 │
│    Message: "Bezig met inloggen"│
│                                 │
│    Wat kun je doen?             │
│    ✓ Voeg LinkedIn profielen toe│
│    ✓ Bewaar notities            │
│    ✓ Bekijk connecties          │
│                                 │
└─────────────────────────────────┘
```

**Color:** 
- Logo: #0066CC
- Links: #0066CC
- Text: #1F1F1F
- Buttons: Primary blue, Secondary gray

---

### **PAGE 2: NEW CONNECTION FORM**

```
┌─────────────────────────────────┐
│ Rolodink    [Toon alle][Instell]│
├─────────────────────────────────┤
│                                 │
│ Nieuwe Connectie                │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ 📍 Ontmoet op              │ │
│ │ bijv. LinkedIn event...     │ │
│ └─────────────────────────────┘ │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ 🏢 Mijn bedrijf destijds    │ │
│ │ bijv. Google, StartupX      │ │
│ └─────────────────────────────┘ │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ 📝 Notities                │ │
│ │ Bijzonderheden, vervolgst..│ │
│ │                             │ │
│ │                             │ │
│ │                    0/500    │ │
│ └─────────────────────────────┘ │
│                                 │
│ ┌────────────┐  ┌──────────┐   │
│ │Opslaan     │  │Annuleren │   │
│ └────────────┘  └──────────┘   │
│                                 │
└─────────────────────────────────┘
```

**Form Features:**
- Placeholder text for guidance
- Character counter (Notes: 0/500)
- Enter key submits form
- Escape key cancels
- Textarea supports multi-line

---

### **PAGE 3: CONNECTION DETAILS**

```
┌─────────────────────────────────┐
│ Rolodink    [Toon alle][Instell]│
├─────────────────────────────────┤
│                                 │
│ Connectie Details  [✏️ Bewerken]│
│                    [🗑️ Delete] │
│                                 │
│ ┌───────────────────────────┐   │
│ │ Jan de Vries              │   │
│ │ ✓ Verified   🔗 LinkedIn  │   │
│ │                           │   │
│ │ 📍 Ontmoet op              │   │
│ │    LinkedIn Event Amsterdam│   │
│ │                           │   │
│ │ 🏢 Mijn bedrijf destijds    │   │
│ │    Google                 │   │
│ │                           │   │
│ │ 📝 Notities                │   │
│ │    Amazing person, follow-up│   │
│ │    planned for next week   │   │
│ │                           │   │
│ └───────────────────────────┘   │
│                                 │
└─────────────────────────────────┘
```

**Details:**
- Profile name (heading 18px)
- Verified badge with checkmark
- LinkedIn link button opens in new tab
- Detail rows with icons
- Notes show if present

---

### **PAGE 4: ALL CONNECTIONS LIST**

```
┌─────────────────────────────────┐
│ Rolodink    [Instell][Help][⏏]  │
├─────────────────────────────────┤
│ Alle Connecties                 │
│                                 │
│ ┌──────────────────────────────┐│
│ │ 🔍 Zoek connecties...        ││
│ └──────────────────────────────┘│
│                                 │
│ [Alle] [Met notities] [Recent]  │
│                                 │
│ Statistieken:                   │
│ 42 connecties | 28 met notities │
│                                 │
│ ┌──────────────────────────────┐│
│ │ Jan de Vries                 ││
│ │ 📍 LinkedIn Event Amsterdam  ││
│ │ 🏢 Google                    ││
│ │ 📝 Amazing person, follow-up ││
│ └──────────────────────────────┘│
│                                 │
│ ┌──────────────────────────────┐│
│ │ Marie Johnson                ││
│ │ 📍 Conference Paris          ││
│ │ 🏢 Stripe                    ││
│ └──────────────────────────────┘│
│                                 │
│ ┌──────────────────────────────┐│
│ │ Peter Müller                 ││
│ │ 📍 Networking event          ││
│ │ 🏢 Amazon                    ││
│ │ 📝 Wants to collaborate      ││
│ └──────────────────────────────┘│
│                                 │
└─────────────────────────────────┘
```

**Features:**
- Search bar with Ctrl+F focus
- Filter tabs (All / With Notes / Recent)
- Stats bar with quick info
- Connection cards clickable
- Search highlighting
- Hover effect on cards

---

### **PAGE 5: SETTINGS**

```
┌─────────────────────────────────┐
│ Rolodink    [Help][Back]        │
├─────────────────────────────────┤
│                                 │
│ Instellingen                    │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ Profiel                     │ │
│ │ Email: user@email.com       │ │
│ │ User ID: 12345              │ │
│ └─────────────────────────────┘ │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ Statistieken                │ │
│ │ Totaal: 42 connecties       │ │
│ │ Met notities: 28            │ │
│ └─────────────────────────────┘ │
│                                 │
│ ┌────────────────────────────┐  │
│ │ 🚪 Logout                  │  │
│ └────────────────────────────┘  │
│                                 │
│ Data wordt veilig opgeslagen    │
│ op onze servers.                │
│                                 │
└─────────────────────────────────┘
```

---

### **PAGE 6: HELP**

```
┌─────────────────────────────────┐
│ Rolodink    [Back]              │
├─────────────────────────────────┤
│                                 │
│ Help & Ondersteuning            │
│                                 │
│ Veelgestelde Vragen:            │
│                                 │
│ Q: Hoe voeg ik een connectie toe│
│ A: Ga naar een LinkedIn profiel,│
│    klik op Rolodink, vul het    │
│    formulier in.                │
│                                 │
│ Q: Zijn mijn notities veilig?   │
│ A: Ja! Alles wordt versleuteld  │
│    opgeslagen.                  │
│                                 │
│ Keyboard Shortcuts:             │
│ Escape    - Terug/Sluiten       │
│ Ctrl+F    - Zoeken activeren    │
│ Enter     - Formulier versturen │
│ Alt+L     - Logout              │
│                                 │
│ Voor ondersteuning:             │
│ 📧 support@rolodink.app         │
│                                 │
└─────────────────────────────────┘
```

---

## 🎨 COMPONENT STYLES

### **Button Variants**

**Primary Button:**
```
Background: #0066CC
Text: White, 14px, bold
Padding: 10px 16px
Border-radius: 6px
Hover: opacity 0.9
Active: background #0052A3
```

**Secondary Button:**
```
Background: #F5F5F5
Text: #1F1F1F, 14px
Border: 1px #EEEEEE
Padding: 10px 16px
Border-radius: 6px
Hover: background #EEEEEE
```

**Danger Button:**
```
Background: #D32F2F
Text: White
Padding: 10px 16px
Border-radius: 6px
Hover: opacity 0.9
```

### **Form Inputs**

```
Border: 1px #EEEEEE
Background: White
Padding: 10px 12px
Border-radius: 6px
Font: 14px
Focus: border-color #0066CC, outline none

Placeholder: #999999, italic

Disabled: background #F5F5F5, color #CCCCCC
```

### **Cards**

```
Background: White
Border: 1px #EEEEEE
Border-radius: 8px
Padding: 16px
Margin: 12px 0
Box-shadow: 0 1px 3px rgba(0,0,0,0.1)
Hover: box-shadow 0 4px 6px rgba(0,0,0,0.1)
```

### **Icons**

**Current:** Emoji (📍, 🏢, 📝, ✏️, 🗑️, etc.)

**Recommended:** Custom SVG icons for Figma redesign

---

## 🎬 ANIMATIONS & TRANSITIONS

### **Page Transitions**
```
Fade In: 200ms
Fade Out: 150ms
Easing: ease-in-out
```

### **Button Click**
```
Active state: immediate
Hover effect: 150ms
Ripple: 300ms (optional)
```

### **Form Validation**
```
Error shake: 200ms
Error color: #D32F2F
Error message fade in: 150ms
```

### **Toast Notification**
```
Slide in from right: 200ms
Display: 3 seconds
Slide out left: 200ms
Position: bottom-right, margin: 16px
```

### **Loading Skeleton**
```
Pulse animation: 1.5s loop
Color: #E0E0E0 → #F0F0F0
```

---

## 📏 SPACING & DIMENSIONS

### **Padding & Margins**
```
xs: 4px
sm: 8px
md: 12px
lg: 16px
xl: 24px
```

### **Border Radius**
```
Small: 4px
Medium: 6px
Large: 8px
Full: 50% (circles)
```

### **Typography Scale**
```
Heading 1: 20px, bold
Heading 2: 18px, bold
Heading 3: 16px, semibold
Body: 14px, regular
Small: 12px, regular
Caption: 11px, regular
```

---

## 🎯 INTERACTION STATES

### **Hover States**
- Buttons: opacity 0.9 or background shift
- Cards: box-shadow increase, slight scale
- Links: underline
- Icons: color shift

### **Active States**
- Buttons: different background color
- Tabs/Filters: underline or highlight
- Selected items: highlight background

### **Disabled States**
- Opacity: 0.5
- Cursor: not-allowed
- Text: lighter color

### **Focus States**
- Inputs: blue outline, border highlight
- Links: underline
- Buttons: outline or shadow

### **Loading States**
- Button text: "Bezig..." 
- Icon: spinner
- Form: disabled inputs
- List: skeleton loaders

---

## 🌑 DARK MODE (Recommended Addition)

### **Color Adjustments**
```
Background: #1F1F1F
Surface: #2A2A2A
Text primary: #FFFFFF
Text secondary: #CCCCCC
Border: #444444
```

---

## 📊 RESPONSIVE BEHAVIOR

### **Desktop (400px+)**
- Full width content
- 2-column where applicable
- Normal font sizes

### **Mobile (320px-400px)**
- Single column
- Stacked buttons
- Slightly smaller font
- Reduced padding

### **Landscape**
- Horizontal scroll if needed
- Side navigation option

---

## ✅ CHECKLIST FOR FIGMA DESIGN

- [ ] Create 6 main page frames
- [ ] Design all button variants
- [ ] Create form input states
- [ ] Design connection cards
- [ ] Add hover/focus states
- [ ] Create loading skeletons
- [ ] Design error messages
- [ ] Create toast notifications
- [ ] Add animation specs
- [ ] Create color library
- [ ] Design typography scale
- [ ] Add spacing/grid system

---

**Ready for Figma Make handoff!**
Date: 2025-10-21
