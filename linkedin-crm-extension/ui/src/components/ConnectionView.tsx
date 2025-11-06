// src/components/ConnectionView.tsx
import { useState } from 'react';
import { ConnectionForm } from './ConnectionForm';
import styles from './ConnectionView.module.css';
import { useConnection, type ConnectionFormData } from '../context/ConnectionContext';

export function ConnectionView() {
  const { connection, handleUpdate, handleDelete } = useConnection();
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!connection) return null;

  const onSubmit = async (formData: ConnectionFormData) => {
    setIsSubmitting(true);
    setError(null);
    try {
      await handleUpdate(formData);
      setIsEditing(false);
    } catch (e: any) {
      setError(e?.message || 'Kon de connectie niet bijwerken');
    } finally {
      setIsSubmitting(false);
    }
  };

  const onDelete = async () => {
    if (!window.confirm('Weet je zeker dat je deze connectie wilt verwijderen?')) return;
    setIsSubmitting(true);
    setError(null);
    try {
      await handleDelete();
    } catch (e) {
      setError('Kon de connectie niet verwijderen.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isEditing) {
    const initialData: ConnectionFormData = {
      meetingPlace: connection.meetingPlace || undefined,
      userCompanyAtTheTime: connection.userCompanyAtTheTime || undefined,
      notes: connection.notes || undefined
    };

    return (
      <ConnectionForm
        initialData={initialData}
        onSubmit={onSubmit}
        onCancel={() => setIsEditing(false)}
        isSubmitting={isSubmitting}
        submitText="Wijzigingen Opslaan"
      />
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <h1 className={styles.title}>Connectie Details</h1>
          <div className={styles.headerActions}>
            <button 
              onClick={() => setIsEditing(true)} 
              className={`${styles.button} ${styles.buttonPrimary}`}
              disabled={isSubmitting}
            >
              <span className={styles.buttonIcon}>✏️</span>
              Bewerken
            </button>
            <button 
              onClick={onDelete}
              className={`${styles.button} ${styles.buttonDanger}`}
              disabled={isSubmitting}
            >
              <span className={styles.buttonIcon}>
                {isSubmitting ? '⏳' : '🗑️'}
              </span>
              {isSubmitting ? 'Verwijderen...' : 'Verwijderen'}
            </button>
          </div>
        </div>
      </div>

      <div className={styles.content}>
        <div className={styles.profileCard}>
          <div className={styles.profileHeader}>
            <div className={styles.profileInfo}>
              <div className={styles.nameSection}>
                <h2 className={styles.profileName}>
                  {connection.name}
                </h2>
                <span className={styles.verifiedBadge}>
                  <span className={styles.badgeIcon}>✓</span>
                  Verified
                </span>
              </div>
              <button
                className={styles.linkedinLink}
                title="Open LinkedIn-profiel"
                onClick={async () => {
                  try {
                    await chrome.tabs.update({ url: connection.linkedInUrl });
                  } catch (error) {
                    console.error('Failed to navigate to LinkedIn profile:', error);
                  }
                }}
              >
                <span className={styles.linkIcon}>🔗</span>
                Bekijk op LinkedIn
              </button>
            </div>
          </div>

          <div className={styles.connectionDetails}>
            <div className={styles.detailRow}>
              <span className={styles.detailIcon}>📍</span>
              <div className={styles.detailContent}>
                <span className={styles.detailLabel}>Ontmoet op</span>
                <span className={connection.meetingPlace ? styles.detailValue : styles.detailValueEmpty}>
                  {connection.meetingPlace || 'Niet opgegeven'}
                </span>
              </div>
            </div>

            <div className={styles.detailRow}>
              <span className={styles.detailIcon}>🏢</span>
              <div className={styles.detailContent}>
                <span className={styles.detailLabel}>Mijn bedrijf destijds</span>
                <span className={connection.userCompanyAtTheTime ? styles.detailValue : styles.detailValueEmpty}>
                  {connection.userCompanyAtTheTime || 'Niet opgegeven'}
                </span>
              </div>
            </div>

            {connection.notes && (
              <div className={styles.notesSection}>
                <div className={styles.notesHeader}>
                  <span className={styles.notesIcon}>📝</span>
                  <span className={styles.notesLabel}>Notities</span>
                </div>
                <div className={styles.notesContent}>
                  {connection.notes}
                </div>
              </div>
            )}
          </div>
        </div>

        {error && (
          <div className={styles.error}>
            <span className={styles.errorIcon}>⚠️</span>
            <span className={styles.errorMessage}>{error}</span>
          </div>
        )}
      </div>
    </div>
  );
}