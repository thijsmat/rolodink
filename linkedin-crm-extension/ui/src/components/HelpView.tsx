// src/components/HelpView.tsx
import styles from './HelpView.module.css';

export function HelpView() {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Rolodink Help</h1>
        <p className={styles.subtitle}>Alles wat je moet weten over de Rolodink extensie</p>
      </div>

      <div className={styles.content}>
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>🎯 Wat is Rolodink?</h2>
          <div className={styles.textContent}>
            <p>
              Rolodink is een Chrome extensie die je helpt om je LinkedIn connecties beter te beheren. 
              In plaats van verloren te gaan in een lange lijst van connecties, kun je nu gemakkelijk 
              notities toevoegen, contactmomenten bijhouden en je netwerk effectief onderhouden.
            </p>
            <p>
              <strong>Waarom Rolodink?</strong> LinkedIn heeft geweldige tools voor netwerken, maar geen 
              ingebouwde CRM-functionaliteit. Deze extensie vult die leemte op door je te helpen om 
              waardevolle informatie over je connecties op te slaan en te beheren.
            </p>
          </div>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>🚀 Hoe werkt het?</h2>
          <div className={styles.stepsList}>
            <div className={styles.step}>
              <div className={styles.stepNumber}>1</div>
              <div className={styles.stepContent}>
                <h3>Voeg connecties toe</h3>
                <p>Ga naar een LinkedIn profiel en klik op de "Voeg toe aan CRM" knop die automatisch verschijnt.</p>
              </div>
            </div>
            <div className={styles.step}>
              <div className={styles.stepNumber}>2</div>
              <div className={styles.stepContent}>
                <h3>Voeg details toe</h3>
                <p>Geef aan waar je deze persoon hebt ontmoet en voeg notities toe over jullie gesprek.</p>
              </div>
            </div>
            <div className={styles.step}>
              <div className={styles.stepNumber}>3</div>
              <div className={styles.stepContent}>
                <h3>Beheer je netwerk</h3>
                <p>Bekijk alle connecties, zoek door notities en houd je netwerk up-to-date.</p>
              </div>
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>✨ Functies overzicht</h2>
          <div className={styles.featuresGrid}>
            <div className={styles.feature}>
              <div className={styles.featureIcon}>📝</div>
              <h3>Notities bijhouden</h3>
              <p>Voeg persoonlijke notities toe over gesprekken, afspraken en follow-ups.</p>
            </div>
            <div className={styles.feature}>
              <div className={styles.featureIcon}>📍</div>
              <h3>Ontmoetingslocatie</h3>
              <p>Houd bij waar je elke connectie hebt ontmoet (conferentie, event, etc.).</p>
            </div>
            <div className={styles.feature}>
              <div className={styles.featureIcon}>🏢</div>
              <h3>Bedrijfscontext</h3>
              <p>Noteer bij welk bedrijf je werkte toen je deze persoon ontmoette.</p>
            </div>
            <div className={styles.feature}>
              <div className={styles.featureIcon}>🔍</div>
              <h3>Slim zoeken</h3>
              <p>Zoek snel door al je connecties en notities met de ingebouwde zoekfunctie.</p>
            </div>
            <div className={styles.feature}>
              <div className={styles.featureIcon}>🏷️</div>
              <h3>Filtering</h3>
              <p>Filter connecties op notities, recente toevoegingen en meer.</p>
            </div>
            <div className={styles.feature}>
              <div className={styles.featureIcon}>⚙️</div>
              <h3>Instellingen</h3>
              <p>Beheer je account, wijzig je wachtwoord en gebruik extra tools.</p>
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>💡 Tips & Tricks</h2>
          <div className={styles.tipsList}>
            <div className={styles.tip}>
              <div className={styles.tipIcon}>💭</div>
              <div className={styles.tipContent}>
                <h3>Effectieve notities</h3>
                <p>Noteer concrete details: wat jullie bespraken, follow-up acties, en contactgegevens die je later nodig hebt.</p>
              </div>
            </div>
            <div className={styles.tip}>
              <div className={styles.tipIcon}>🔄</div>
              <div className={styles.tipContent}>
                <h3>Regelmatig bijwerken</h3>
                <p>Voeg notities toe direct na een ontmoeting terwijl de details nog vers zijn in je geheugen.</p>
              </div>
            </div>
            <div className={styles.tip}>
              <div className={styles.tipIcon}>🎯</div>
              <div className={styles.tipContent}>
                <h3>Focus op kwaliteit</h3>
                <p>Het is beter om een kleiner netwerk te hebben met rijke informatie dan veel connecties zonder context.</p>
              </div>
            </div>
            <div className={styles.tip}>
              <div className={styles.tipIcon}>📅</div>
              <div className={styles.tipContent}>
                <h3>Follow-up plannen</h3>
                <p>Gebruik je notities om follow-up gesprekken te plannen en je netwerk warm te houden.</p>
              </div>
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>🔧 Problemen oplossen</h2>
          <div className={styles.faqList}>
            <div className={styles.faq}>
              <h3>De "Voeg toe aan CRM" knop verschijnt niet</h3>
            <p>Zorg ervoor dat je ingelogd bent in de extensie en dat je op een LinkedIn profielpagina bent. Ververs de pagina als de knop niet verschijnt.</p>
            </div>
            <div className={styles.faq}>
              <h3>Kan ik mijn data exporteren?</h3>
              <p>Ja, de export functionaliteit is beschikbaar in de instellingen. Je kunt je connecties exporteren naar CSV of Excel.</p>
            </div>
            <div className={styles.faq}>
              <h3>Is mijn data veilig?</h3>
              <p>Absoluut. Alle data wordt veilig opgeslagen en versleuteld. Je hebt volledige controle over je eigen informatie.</p>
            </div>
            <div className={styles.faq}>
              <h3>Kan ik de extensie op meerdere computers gebruiken?</h3>
              <p>Ja, je kunt inloggen op verschillende computers en hebt overal toegang tot je connecties en notities.</p>
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>📞 Contact & Support</h2>
          <div className={styles.contactInfo}>
            <p>
              Heb je vragen of problemen met de Rolodink extensie? We helpen je graag!
            </p>
            <div className={styles.contactMethods}>
              <div className={styles.contactMethod}>
                <div className={styles.contactIcon}>📧</div>
                <div>
                  <strong>E-mail Support</strong>
                  <p>Stuur een e-mail naar support@linkedincrm.com</p>
                </div>
              </div>
              <div className={styles.contactMethod}>
                <div className={styles.contactIcon}>🐛</div>
                <div>
                  <strong>Bug Reports</strong>
                  <p>Rapporteer problemen via GitHub Issues</p>
                </div>
              </div>
              <div className={styles.contactMethod}>
                <div className={styles.contactIcon}>💡</div>
                <div>
                  <strong>Feature Requests</strong>
                  <p>Heb je ideeën voor nieuwe functies? We horen ze graag!</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
