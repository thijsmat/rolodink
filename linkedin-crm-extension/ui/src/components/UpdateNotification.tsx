import styles from './UpdateNotification.module.css';
import { useUpdate } from '../context/UpdateContext';

export function UpdateNotification() {
  const { versionInfo, updateDismissed, dismissUpdate } = useUpdate();

  // Don't show if no update available or dismissed
  if (!versionInfo?.updateAvailable || updateDismissed) {
    return null;
  }

  const handleDownload = () => {
    // Open download URL in new tab
    window.open(versionInfo.downloadUrl, '_blank');
  };

  const getUpdateTypeIcon = () => {
    switch (versionInfo.updateType) {
      case 'major':
        return '🚀';
      case 'minor':
        return '✨';
      case 'patch':
        return '🔧';
      default:
        return '📦';
    }
  };

  const getUpdateTypeLabel = () => {
    switch (versionInfo.updateType) {
      case 'major':
        return 'Nieuwe hoofdversie';
      case 'minor':
        return 'Nieuwe functies';
      case 'patch':
        return 'Updates';
      default:
        return 'Update';
    }
  };

  return (
    <div className={styles.updateNotification}>
      <div className={styles.updateHeader}>
        <div className={styles.updateIcon}>
          {getUpdateTypeIcon()}
        </div>
        <div className={styles.updateTitle}>
          <h3>{getUpdateTypeLabel()} beschikbaar!</h3>
          <p>Versie {versionInfo.latest} is nu beschikbaar</p>
        </div>
        <button 
          className={styles.closeButton}
          onClick={dismissUpdate}
          title="Sluit deze notificatie"
        >
          ✕
        </button>
      </div>

      <div className={styles.updateContent}>
        <p className={styles.updateDescription}>
          {versionInfo.releaseNotes}
        </p>

        {versionInfo.features.length > 0 && (
          <div className={styles.updateSection}>
            <h4>🆕 Nieuwe functies:</h4>
            <ul className={styles.featureList}>
              {versionInfo.features.map((feature, index) => (
                <li key={index}>{feature}</li>
              ))}
            </ul>
          </div>
        )}

        {versionInfo.bugFixes.length > 0 && (
          <div className={styles.updateSection}>
            <h4>🐛 Verbeteringen:</h4>
            <ul className={styles.featureList}>
              {versionInfo.bugFixes.map((fix, index) => (
                <li key={index}>{fix}</li>
              ))}
            </ul>
          </div>
        )}

        {versionInfo.breakingChanges.length > 0 && (
          <div className={styles.updateSection}>
            <h4>⚠️ Belangrijke wijzigingen:</h4>
            <ul className={styles.featureList}>
              {versionInfo.breakingChanges.map((change, index) => (
                <li key={index}>{change}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className={styles.updateActions}>
        <button 
          className={styles.downloadButton}
          onClick={handleDownload}
        >
          📥 Download Update
        </button>
        <button 
          className={styles.laterButton}
          onClick={dismissUpdate}
        >
          Later
        </button>
      </div>
    </div>
  );
}
