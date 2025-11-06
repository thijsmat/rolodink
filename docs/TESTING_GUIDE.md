# Testing Guide

## Snelle Start

### 1. ESLint Testen
```bash
# Test alle packages
npm run lint

# Test alleen backend
cd linkedin-crm-backend && npm run lint
```

### 2. Build Testen
```bash
# Build alle packages
npm run build

# Build alleen backend
cd linkedin-crm-backend && npm run build
```

### 3. API Tests Uitvoeren

#### Stap 1: Start de backend server
```bash
cd linkedin-crm-backend
npm run dev
```

#### Stap 2: In een andere terminal, voer tests uit
```bash
cd linkedin-crm-backend

# Met authenticatie (volledige tests)
TEST_EMAIL="your-email@example.com" TEST_PASSWORD="your-password" npm run test:api

# Zonder authenticatie (basis tests)
npm run test:api
```

## Test Scenarios

### Manual Testing Checklist

#### Security Tests
- [ ] **IDOR Test**: Probeer connection van andere gebruiker op te halen → Moet 403/404 geven
- [ ] **Unauthorized Access**: GET /api/connections zonder token → Moet 401 geven
- [ ] **Ownership Verification**: DELETE/PATCH van andere gebruiker → Moet 403 geven

#### Validation Tests
- [ ] **Invalid Input**: POST met lege naam → Moet 400 geven
- [ ] **Invalid URL**: POST met ongeldige URL → Moet 400 geven
- [ ] **Missing Fields**: POST zonder verplichte velden → Moet 400 geven

#### Error Handling Tests
- [ ] **Not Found**: GET/DELETE niet-bestaande ID → Moet 404 geven
- [ ] **Duplicate**: POST duplicate connection → Moet 409 geven
- [ ] **Foreign Key**: POST met ongeldige referentie → Moet 400 geven

#### Caching Tests
- [ ] **Cache Hit**: Twee GET requests snel na elkaar → Tweede moet sneller zijn
- [ ] **Cache Invalidation**: POST → Volgende GET moet nieuwe data tonen
- [ ] **Cache Invalidation**: DELETE → Volgende GET moet data niet meer tonen

## Test Resultaten Verifiëren

### 1. Check Console Output
Het test script toont:
- ✅ Geslaagde tests in groen
- ❌ Gefaalde tests in rood
- 📊 Samenvatting aan het einde

### 2. Check Server Logs
Tijdens tests, check de backend server logs voor:
- Database queries (zouden gecached moeten zijn)
- Error messages
- Cache invalidation logs

### 3. Check Database
Verifieer in de database:
- Connections zijn correct aangemaakt
- Ownership is correct (ownerId matches user)
- Data is correct opgeslagen

## Troubleshooting

### Tests Falen

#### "Could not sign in"
- Controleer credentials
- Check of gebruiker bestaat
- Verify backend server draait

#### "Connection refused"
- Start backend server: `npm run dev`
- Check poort (default: 3000)
- Verify API_BASE_URL

#### "401 Unauthorized"
- Check of token correct is
- Verify authentication werkt
- Check CORS settings

### Build Fails

#### ESLint Errors
```bash
# Fix automatisch waar mogelijk
npm run lint -- --fix
```

#### TypeScript Errors
```bash
# Check type errors
cd linkedin-crm-backend
npx tsc --noEmit
```

## Continuous Testing

### Pre-commit
Voeg toe aan pre-commit hook:
```bash
npm run lint
npm run test:api
```

### CI/CD
Voeg toe aan GitHub Actions:
```yaml
- name: Run Tests
  run: |
    npm run lint
    npm run build
    npm run test:api
```

## Performance Testing

### Cache Performance
```bash
# Test cache hit rate
time curl http://localhost:3000/api/connections -H "Authorization: Bearer $TOKEN"
time curl http://localhost:3000/api/connections -H "Authorization: Bearer $TOKEN"
# Tweede request zou sneller moeten zijn
```

### Load Testing
Gebruik tools zoals:
- Apache Bench (ab)
- k6
- Artillery

## Test Data

### Voor Productie-achtige Tests
1. Maak test gebruiker aan
2. Maak meerdere connections
3. Test met verschillende gebruikers
4. Test edge cases

### Test Users
```
Email: test-user-1@example.com
Password: test-password-123

Email: test-user-2@example.com  
Password: test-password-456
```

## Success Criteria

Alle tests moeten:
- ✅ Geen errors geven
- ✅ Correcte HTTP status codes retourneren
- ✅ Proper error messages geven
- ✅ Security checks afdwingen
- ✅ Cache correct gebruiken

