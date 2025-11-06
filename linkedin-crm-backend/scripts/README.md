# API Test Script

## Overview

Het `test-api.ts` script test de belangrijkste API endpoints voor security fixes en functionaliteit.

## Setup

1. Installeer dependencies:
```bash
npm install
```

2. Start de development server:
```bash
npm run dev
```

3. **Stel test credentials in** (zie opties hieronder)

## Test Credentials Instellen

### Optie 1: Via Environment Variables (Inline) - Aanbevolen voor één keer testen

```bash
TEST_EMAIL="your-test@email.com" TEST_PASSWORD="your-password" npm run test:api
```

### Optie 2: Via .env.test Bestand - Aanbevolen voor herhaald gebruik

1. **Maak .env.test bestand**:
```bash
cp test-credentials.example .env.test
```

2. **Vul je credentials in**:
```bash
nano .env.test
# Of gebruik je favoriete editor
```

3. **Voer tests uit met het helper script**:
```bash
npm run test:api:env
```

Of handmatig:
```bash
source .env.test && npm run test:api
```

### Optie 3: Export in Terminal Session

```bash
export TEST_EMAIL="your-test@email.com"
export TEST_PASSWORD="your-password"
export API_BASE_URL="http://localhost:3000/api"  # Optioneel
npm run test:api
```

## Gebruik

### Volledige test suite (met authenticatie):
```bash
# Optie 1: Inline
TEST_EMAIL="test@example.com" TEST_PASSWORD="password123" npm run test:api

# Optie 2: Met .env.test bestand
npm run test:api:env

# Optie 3: Na export
export TEST_EMAIL="test@example.com"
export TEST_PASSWORD="password123"
npm run test:api
```

### Basis tests (zonder authenticatie):
```bash
npm run test:api
```

## Test Credentials Aanmaken

Als je nog geen test gebruiker hebt:

1. **Via de API signup endpoint**:
```bash
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test-password"}'
```

2. **Of via Supabase Dashboard**:
   - Ga naar je Supabase project
   - Authentication → Users
   - Maak een nieuwe gebruiker aan

## Test Coverage

Het script test de volgende functionaliteit:

### Security Tests
- ✅ Unauthorized access (401)
- ✅ GET /api/connections/[id] ownership check
- ✅ DELETE /api/connections/[id] ownership check
- ✅ PATCH /api/connections ownership check

### Validation Tests
- ✅ Input validation (400 errors)
- ✅ Invalid data handling

### Error Handling Tests
- ✅ 404 Not Found (P2025)
- ✅ 409 Conflict (P2002)
- ✅ Proper error messages

### CRUD Tests
- ✅ Create connection (POST)
- ✅ Read connections (GET)
- ✅ Read single connection (GET /[id])
- ✅ Update connection (PATCH)
- ✅ Delete connection (DELETE)

## Output

Het script geeft kleurgecodeerde output:
- 🟢 Groen: Test geslaagd
- 🔴 Rood: Test gefaald
- 🟡 Geel: Waarschuwing
- 🔵 Blauw: Informatie

Aan het einde wordt een samenvatting getoond met het aantal geslaagde en gefaalde tests.

## Troubleshooting

### "Could not sign in"
- Controleer of TEST_EMAIL en TEST_PASSWORD correct zijn ingesteld
- Controleer of de backend server draait
- Controleer of de gebruiker bestaat in de database
- Verify credentials met: `curl -X POST http://localhost:3000/api/auth/signin -H "Content-Type: application/json" -d '{"email":"...","password":"..."}'`

### "Connection refused"
- Zorg ervoor dat de backend server draait op de juiste poort (default: 3000)
- Check de API_BASE_URL environment variable

### ".env.test not found"
```bash
# Maak het bestand aan
cp .env.test.example .env.test
nano .env.test  # Vul credentials in
```

### TypeScript errors
- Zorg dat alle dependencies geïnstalleerd zijn: `npm install`
- Controleer of tsx is geïnstalleerd: `npm list tsx`

### Permission denied voor test-api-with-env.sh
```bash
chmod +x scripts/test-api-with-env.sh
```
