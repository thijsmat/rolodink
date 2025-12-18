# Rolodink Extension v1.0.10

## 🔧 Bug Fixes

### Context Field Authentication
- **Fixed**: "Not logged in" message appearing incorrectly in context field
- **Fixed**: Context field now correctly recognizes authenticated users
- **Improved**: Access token syncing between UI and content script

### Code Quality
- **Fixed**: Duplicate conditional branches (SonarQube Major Bug)
- **Fixed**: Missing accessible label on toggle switch
- **Fixed**: React anti-pattern with async operations
- **Improved**: Token sync scope narrowed to Supabase keys only
- **Cleaned**: Removed all commented-out debug logs (38 instances)

## 🎨 UI Changes
- Updated button text from "Add to CRM" to "Add to Rldnk"

## 📦 Downloads

- **Chrome**: `Rolodink-Chrome-1.0.10.zip`
- **Edge**: `Rolodink-Edge-1.0.10.zip`
- **Firefox**: `Rolodink-Firefox-1.0.10.zip`
- **Source Code** (for Firefox review): `rolodink-source-v1.0.10.zip`

## 🔄 Upgrade Instructions

1. Download the appropriate ZIP for your browser
2. For Chrome/Edge: Upload to respective web stores
3. For Firefox: Submit to AMO with source code ZIP

## ✅ Quality Gate
- All SonarQube issues resolved
- Build verification passed
- No breaking changes
