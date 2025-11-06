# Testing Plan voor Security & Architecture Improvements

## ✅ Build & Compilatie Tests

### Voltooid
- ✅ TypeScript compilatie: Geen errors
- ✅ Turborepo build: Succesvol voor alle packages
- ✅ Linter: Backend heeft ESLint configuratie nodig (niet kritiek)

## 🔒 Security Tests

### 1. IDOR (Insecure Direct Object Reference) Tests

#### Test 1.1: GET /api/connections/[id] - Ownership Check
**Scenario**: Gebruiker A probeert connection van Gebruiker B op te halen

**Verwachte Resultaat**: 
- Status: 403 Forbidden of 404 Not Found
- Error message: "No permission to access this connection"

**Test Command** (met curl of Postman):
```bash
# Setup: Login als User A, krijg token
# Vervang {connectionId} met ID van connection die van User B is
curl -X GET "http://localhost:3000/api/connections/{connectionId}" \
  -H "Authorization: Bearer {userAToken}" \
  -H "Content-Type: application/json"
```

#### Test 1.2: DELETE /api/connections/[id] - Ownership Check
**Scenario**: Gebruiker A probeert connection van Gebruiker B te verwijderen

**Verwachte Resultaat**:
- Status: 403 Forbidden
- Error message: "No permission to delete this connection"

#### Test 1.3: PATCH /api/connections - Ownership Check
**Scenario**: Gebruiker A probeert connection van Gebruiker B te updaten

**Verwachte Resultaat**:
- Status: 403 Forbidden
- Error message: "No permission to update this connection"

### 2. Input Validatie Tests

#### Test 2.1: POST /api/connections - Invalid Data
**Scenario**: Verstuur request zonder verplichte velden

**Test Data**:
```json
{
  "name": "",
  "url": "not-a-valid-url"
}
```

**Verwachte Resultaat**:
- Status: 400 Bad Request
- Error message: Validation failed met field errors

### 3. Error Handling Tests

#### Test 3.1: DELETE /api/connections/[id] - Non-existent ID
**Scenario**: Probeer niet-bestaande connection te verwijderen

**Verwachte Resultaat**:
- Status: 404 Not Found
- Error message: "Record not found" (via Prisma error handler)

#### Test 3.2: POST /api/connections - Duplicate Connection
**Scenario**: Maak connection aan met URL die al bestaat voor deze gebruiker

**Verwachte Resultaat**:
- Status: 409 Conflict
- Error message: "Connectie bestaat al voor deze URL."

## ⚡ Performance Tests

### 4. Caching Tests

#### Test 4.1: GET /api/connections - Cache Hit
**Scenario**: 
1. Maak eerste request naar GET /api/connections
2. Maak tweede request binnen 60 seconden

**Verwachte Resultaat**:
- Eerste request: Database query uitgevoerd
- Tweede request: Cache gebruikt (sneller, geen database query)

**Verificatie**: Check response times en database logs

#### Test 4.2: Cache Invalidation - POST
**Scenario**:
1. Maak GET request (cache wordt gevuld)
2. Maak POST request om nieuwe connection aan te maken
3. Maak GET request opnieuw

**Verwachte Resultaat**:
- Derde GET request toont nieuwe connection (cache is geïnvalideerd)

#### Test 4.3: Cache Invalidation - DELETE
**Scenario**:
1. Maak GET request (cache wordt gevuld)
2. Verwijder connection via DELETE
3. Maak GET request opnieuw

**Verwachte Resultaat**:
- Derde GET request toont connection niet meer (cache is geïnvalideerd)

## 🏗️ Architecture Tests

### 5. Turborepo & Dependencies

#### Test 5.1: Centralized Dependencies
**Verificatie**:
```bash
# Check of TypeScript en ESLint in root staan
cat package.json | grep -A 5 "devDependencies"

# Check of backend/website ze niet meer hebben
cat linkedin-crm-backend/package.json | grep -E "(typescript|eslint)" || echo "OK: Not in backend"
cat website/package.json | grep -E "(typescript|eslint)" || echo "OK: Not in website"
```

#### Test 5.2: Build Outputs
**Verificatie**:
```bash
# Check of dist-* folders in .gitignore staan
grep "dist-\*" .gitignore && echo "OK: dist-* in gitignore"
```

## 📝 Manual Testing Checklist

### API Routes Testen

- [ ] GET /api/connections - Returns user's connections only
- [ ] GET /api/connections/[id] - Returns connection if owned by user
- [ ] GET /api/connections/[id] - Returns 403 if not owned by user
- [ ] POST /api/connections - Creates connection with validation
- [ ] POST /api/connections - Returns 400 for invalid data
- [ ] PATCH /api/connections - Updates connection if owned by user
- [ ] PATCH /api/connections - Returns 403 if not owned by user
- [ ] DELETE /api/connections/[id] - Deletes connection if owned by user
- [ ] DELETE /api/connections/[id] - Returns 403 if not owned by user
- [ ] DELETE /api/connections/[id] - Returns 404 for non-existent ID

### Error Handling Testen

- [ ] P2025 (Not Found) errors return 404
- [ ] P2002 (Unique Constraint) errors return 409
- [ ] P2003 (Foreign Key) errors return 400
- [ ] Generic errors return 500 with safe message

### Caching Testen

- [ ] GET requests worden gecached
- [ ] POST invalidates cache
- [ ] PATCH invalidates cache
- [ ] DELETE invalidates cache
- [ ] Cache revalidates after 60 seconds

## 🚀 Quick Test Script

Voor snelle verificatie, start de development server en test:

```bash
# Start backend
cd linkedin-crm-backend
npm run dev

# In andere terminal, test endpoints
# (Vervang met echte tokens en IDs)
curl http://localhost:3000/api/connections
```

## 📊 Test Resultaten

Documenteer hier de resultaten van de tests:

- [ ] Alle security tests geslaagd
- [ ] Alle error handling tests geslaagd
- [ ] Caching werkt correct
- [ ] Build process werkt
- [ ] Dependencies zijn gecentraliseerd

