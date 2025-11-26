## Backlog (Nog niet uitvoeren)
Ik wil een Feedback & Issue Systeem bouwen geïntegreerd met Linear.

De Architectuur: Gebruik een Supabase Edge Function als veilige proxy tussen de gebruiker en Linear.

Stap 1: De Backend (Supabase Edge Function)

Maak een nieuwe functie: supabase/functions/submit-issue/index.ts.

Deze functie ontvangt POST requests met { title, description, type, pageUrl, userEmail }.

Gebruik de Linear SDK (of fetch) om een issue aan te maken in mijn Linear 'Triage' team.

Voeg labels toe op basis van de input (bijv. 'Bug' of 'Feature').

Haal de LINEAR_API_KEY uit de environment variables.

Stap 2: De Frontend (Extensie & Website)

Maak een herbruikbaar component src/components/FeedbackForm.tsx.

Velden: Onderwerp, Type (Bug/Wens), Omschrijving.

Logica: Roep de Edge Function aan via supabase.functions.invoke('submit-issue', ...).

Integratie: Voeg een knop 'Feedback' toe in het instellingen-menu van de extensie en in de footer van de website.

Stap 3: Known Issues (Optioneel)

Maak een tweede Edge Function (of breid de eerste uit) om issues op te halen die de tag 'Public Known Issue' hebben in Linear.

Toon deze lijst op de /help pagina van de website.

Begin met Stap 1. Vertel me welke Env Vars ik moet instellen in Supabase.