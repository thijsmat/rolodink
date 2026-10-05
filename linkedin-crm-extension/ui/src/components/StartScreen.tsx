// src/components/StartScreen.tsx
import { useEffect, useState } from 'react';
import styles from './StartScreen.module.css';
import { useConnection } from '../context/ConnectionContext';
import { useExtensionTranslation } from '../hooks/useExtensionTranslation';

/**
 * What the popup shows when the open tab is not a LinkedIn profile. For a new
 * user this is usually the first screen they see, so it explains what to do
 * instead of reporting an error.
 */
export function StartScreen() {
  const { allConnections, fetchAllConnections, showListView } = useConnection();
  const { t } = useExtensionTranslation();
  // Until the popup has asked the server, an empty list only means an empty
  // cache (a new device, say), not a user without connections.
  const [hasChecked, setHasChecked] = useState(allConnections.length > 0);

  useEffect(() => {
    if (hasChecked) return;
    void fetchAllConnections(true)
      .catch(console.error)
      .finally(() => setHasChecked(true));
  }, [hasChecked, fetchAllConnections]);

  // The "not a profile" state stays set underneath: App shows the list over
  // it and comes back here when the list closes, not to a new-connection form.
  const openList = () => {
    void showListView();
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>{t('start_title')}</h2>
      <p className={styles.description}>{t('start_description')}</p>
      <button type="button" className={styles.button} onClick={openList}>
        {t('show_all_connections_button')}
      </button>
      {hasChecked && allConnections.length === 0 && (
        <p className={styles.hint} data-testid="start-first-step">{t('start_first_step_hint')}</p>
      )}
    </div>
  );
}
