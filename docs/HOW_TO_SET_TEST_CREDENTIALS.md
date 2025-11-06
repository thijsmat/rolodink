# Test Credentials Instellen - Stap voor Stap

## Snelstart (Aanbevolen)

### Stap 1: Maak .env.test bestand
```bash
cd linkedin-crm-backend
cp test-credentials.example .env.test
```

### Stap 2: Vul je credentials in
Open het bestand in je editor:
```bash
nano .env.test
# Of in VS Code: code .env.test
```

Vul in:
```
TEST_EMAIL=je-echte-email@example.com
TEST_PASSWORD=je-echte-wachtwoord
API_BASE_URL=http://localhost:3000/api
```

### Stap 3: Voer tests uit
```bash
npm run test:api:env
```

## Test Gebruiker Aanmaken

Als je nog geen test gebruiker hebt, maak er een aan:

### Via API Signup
```bash
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "test-password-123"
  }'
```

### Via Supabase Dashboard
1. Ga naar je Supabase project dashboard
2. Navigeer naar **Authentication** → **Users**
3. Klik op **Add User** → **Create new user**
4. Vul email en password in
5. Gebruik deze credentials in `.env.test`

## Bestandsstructuur

```
linkedin-crm-backend/
├── .env.test.example          # Template (mag gecommit worden)
├── .env.test                  # Jouw credentials (NIET committen!)
└── scripts/
    ├── test-api.ts            # Test script
    └── test-api-with-env.sh   # Helper script voor .env.test
```

## Veiligheid

⚠️ **Belangrijk**: 
- `.env.test` staat al in `.gitignore` - wordt niet gecommit
- Gebruik **geen productie credentials** voor tests
- Maak een aparte test gebruiker aan
- Deel `.env.test` niet publiekelijk

## Troubleshooting

### "Could not sign in"
```bash
# Test of credentials werken
curl -X POST http://localhost:3000/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email":"jouw-email","password":"jouw-wachtwoord"}'
```

### ".env.test not found"
```bash
# Maak het bestand aan
cp .env.test.example .env.test
nano .env.test
```

### "Permission denied" bij test-api-with-env.sh
```bash
chmod +x scripts/test-api-with-env.sh
```

## Voorbeelden

### Volledige workflow
```bash
# 1. Maak test gebruiker aan
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test123"}'

# 2. Maak .env.test
cd linkedin-crm-backend
cp .env.test.example .env.test
nano .env.test  # Vul in: TEST_EMAIL=test@test.com, TEST_PASSWORD=test123

# 3. Voer tests uit
npm run test:api:env
```

### Direct zonder bestand
```bash
TEST_EMAIL="test@test.com" TEST_PASSWORD="test123" npm run test:api
```

