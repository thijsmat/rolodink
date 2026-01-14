
// src/components/HelpView.tsx
import styles from './HelpView.module.css';
import { useExtensionTranslation } from '../hooks/useExtensionTranslation';

export function HelpView() {
  const { t } = useExtensionTranslation();

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>{t('help_title')}</h1>
        <p className={styles.subtitle}>{t('help_subtitle')}</p>
      </div>

      <div className={styles.content}>
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>{t('section_what_is_title')}</h2>
          <div className={styles.textContent}>
            <p>
              {t('section_what_is_p1')}
            </p>
            <p>
              <strong>{t('section_what_is_why_bold')}</strong> {t('section_what_is_p2')}
            </p>
          </div>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>{t('section_how_works_title')}</h2>
          <div className={styles.stepsList}>
            <div className={styles.step}>
              <div className={styles.stepNumber}>1</div>
              <div className={styles.stepContent}>
                <h3>{t('step_1_title')}</h3>
                <p>{t('step_1_desc')}</p>
              </div>
            </div>
            <div className={styles.step}>
              <div className={styles.stepNumber}>2</div>
              <div className={styles.stepContent}>
                <h3>{t('step_2_title')}</h3>
                <p>{t('step_2_desc')}</p>
              </div>
            </div>
            <div className={styles.step}>
              <div className={styles.stepNumber}>3</div>
              <div className={styles.stepContent}>
                <h3>{t('step_3_title')}</h3>
                <p>{t('step_3_desc')}</p>
              </div>
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>{t('section_features_title')}</h2>
          <div className={styles.featuresGrid}>
            <div className={styles.feature}>
              <div className={styles.featureIcon}>📝</div>
              <h3>{t('feature_notes_title')}</h3>
              <p>{t('feature_notes_desc')}</p>
            </div>
            <div className={styles.feature}>
              <div className={styles.featureIcon}>📍</div>
              <h3>{t('feature_location_title')}</h3>
              <p>{t('feature_location_desc')}</p>
            </div>
            <div className={styles.feature}>
              <div className={styles.featureIcon}>🏢</div>
              <h3>{t('feature_company_title')}</h3>
              <p>{t('feature_company_desc')}</p>
            </div>
            <div className={styles.feature}>
              <div className={styles.featureIcon}>🔍</div>
              <h3>{t('feature_search_title')}</h3>
              <p>{t('feature_search_desc')}</p>
            </div>
            <div className={styles.feature}>
              <div className={styles.featureIcon}>🏷️</div>
              <h3>{t('feature_filter_title')}</h3>
              <p>{t('feature_filter_desc')}</p>
            </div>
            <div className={styles.feature}>
              <div className={styles.featureIcon}>⚙️</div>
              <h3>{t('feature_settings_title')}</h3>
              <p>{t('feature_settings_desc')}</p>
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>{t('section_tips_title')}</h2>
          <div className={styles.tipsList}>
            <div className={styles.tip}>
              <div className={styles.tipIcon}>💭</div>
              <div className={styles.tipContent}>
                <h3>{t('tip_effective_title')}</h3>
                <p>{t('tip_effective_desc')}</p>
              </div>
            </div>
            <div className={styles.tip}>
              <div className={styles.tipIcon}>🔄</div>
              <div className={styles.tipContent}>
                <h3>{t('tip_update_title')}</h3>
                <p>{t('tip_update_desc')}</p>
              </div>
            </div>
            <div className={styles.tip}>
              <div className={styles.tipIcon}>🎯</div>
              <div className={styles.tipContent}>
                <h3>{t('tip_quality_title')}</h3>
                <p>{t('tip_quality_desc')}</p>
              </div>
            </div>
            <div className={styles.tip}>
              <div className={styles.tipIcon}>📅</div>
              <div className={styles.tipContent}>
                <h3>{t('tip_followup_title')}</h3>
                <p>{t('tip_followup_desc')}</p>
              </div>
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>{t('section_faq_title')}</h2>
          <div className={styles.faqList}>
            <div className={styles.faq}>
              <h3>{t('faq_button_title')}</h3>
              <p>{t('faq_button_desc')}</p>
            </div>
            <div className={styles.faq}>
              <h3>{t('faq_export_title')}</h3>
              <p>{t('faq_export_desc')}</p>
            </div>
            <div className={styles.faq}>
              <h3>{t('faq_security_title')}</h3>
              <p>{t('faq_security_desc')}</p>
            </div>
            <div className={styles.faq}>
              <h3>{t('faq_multiple_title')}</h3>
              <p>{t('faq_multiple_desc')}</p>
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>{t('section_contact_title')}</h2>
          <div className={styles.contactInfo}>
            <p>
              {t('contact_intro')}
            </p>
            <div className={styles.contactMethods}>
              <div className={styles.contactMethod}>
                <div className={styles.contactIcon}>📧</div>
                <div>
                  <strong>{t('contact_email_title')}</strong>
                  <p>{t('contact_email_desc')}</p>
                </div>
              </div>
              <div className={styles.contactMethod}>
                <div className={styles.contactIcon}>🐛</div>
                <div>
                  <strong>{t('contact_bug_title')}</strong>
                  <p>{t('contact_bug_desc')}</p>
                </div>
              </div>
              <div className={styles.contactMethod}>
                <div className={styles.contactIcon}>💡</div>
                <div>
                  <strong>{t('contact_feature_title')}</strong>
                  <p>{t('contact_feature_desc')}</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
