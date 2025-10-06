# Staging Environment Setup

## Probleem
De staging backend (`linkedin-crm-staging-k21f8gwio-matthijs-goes-projects.vercel.app`) geeft 401 Unauthorized errors omdat de Supabase environment variabelen niet correct zijn ingesteld.

## Huidige Status
- ✅ **Production Backend**: Werkt correct
- ❌ **Staging Backend**: Niet geconfigureerd (401 errors)
- 🔧 **Extension**: Gebruikt tijdelijk production backend

## Oplossing

### Optie 1: Vercel Dashboard (Aanbevolen)
1. Ga naar https://vercel.com/dashboard
2. Zoek het project `linkedin-crm-staging` 
3. Ga naar Settings → Environment Variables
4. Voeg de volgende variabelen toe:

```
NEXT_PUBLIC_SUPABASE_URL=your_staging_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_staging_supabase_anon_key
DATABASE_URL=your_staging_database_url
DIRECT_URL=your_staging_direct_database_url
```

### Optie 2: Script Gebruiken
```bash
# Switch naar staging (na configuratie)
./scripts/switch_backend.sh staging

# Switch naar production
./scripts/switch_backend.sh production
```

### Optie 3: Handmatig Configureren
1. Edit `linkedin-crm-extension/ui/src/config.ts`
2. Uncomment de staging URL en comment de production URL
3. Rebuild: `cd linkedin-crm-extension/ui && npm run build`

## Test Staging
Na configuratie, test de staging URL:
```bash
curl -X POST https://linkedin-crm-staging-k21f8gwio-matthijs-goes-projects.vercel.app/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test"}'
```

## Database Setup
Voor staging database:
1. Maak een nieuwe Supabase project voor staging
2. Run Prisma migrations: `npx prisma migrate deploy`
3. Configureer environment variables in Vercel

## Fallback Plan
Als staging setup te complex is:
- ✅ Gebruik production backend voor alle development
- ✅ Maak aparte `staging` branch voor testen
- ✅ Gebruik lokale development voor feature testing
