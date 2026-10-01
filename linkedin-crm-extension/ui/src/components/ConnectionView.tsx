// src/components/ConnectionView.tsx
import { useState } from 'react';
import { ConnectionForm } from './ConnectionForm';
import { ConfirmPanel } from './ConfirmPanel';
import styles from './ConnectionView.module.css';
import { useConnection, type Connection, type ConnectionFormData } from '../context/ConnectionContext';
import { useExtensionTranslation } from '../hooks/useExtensionTranslation';
import { ConnectionChangedElsewhereError } from '../utils/connectionUpdate';

function toFormData(connection: Connection): ConnectionFormData {
  return {
    meetingPlace: connection.meetingPlace || undefined,
    userCompanyAtTheTime: connection.userCompanyAtTheTime || undefined,
    notes: connection.notes || undefined
  };
}

/** The baseline for another connection: its own data if an edit was open, else none. */
function baselineFor(openEdit: ConnectionFormData | null, next: Connection | null): ConnectionFormData | null {
  return openEdit && next ? toFormData(next) : null;
}

export function ConnectionView() {
  const { connection, handleUpdate, handleDelete } = useConnection();
  const { t } = useExtensionTranslation();
  // What the edit form starts from, taken once when editing begins. The
  // connection object is replaced by unrelated updates (a toast, a token
  // refresh), and a form that followed it lost what the user had typed.
  // Only another connection (a different id) starts the form over.
  const [editBaseline, setEditBaseline] = useState<ConnectionFormData | null>(null);
  const [baselineId, setBaselineId] = useState(connection?.id);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // The version the edit is based on, taken with the baseline. Sent with the
  // save, so a newer save from the note card or another device is not
  // overwritten without asking. Not connection.updatedAt at save time: that
  // follows whatever the popup loaded since, the edit does not.
  const [editVersion, setEditVersion] = useState(connection?.updatedAt);
  // The stored row after a save was refused as a conflict, until the user
  // chooses: load it (the form starts over from it) or overwrite it.
  const [conflict, setConflict] = useState<Connection | null>(null);
  // Bumped to start the form over from a new baseline for the same id.
  const [formGeneration, setFormGeneration] = useState(0);

  if (connection?.id !== baselineId) {
    setBaselineId(connection?.id);
    setEditBaseline(baselineFor(editBaseline, connection));
    setEditVersion(connection?.updatedAt);
    setConflict(null);
  }

  if (!connection) return null;

  const startEditing = () => {
    setEditBaseline(toFormData(connection));
    setEditVersion(connection.updatedAt);
  };
  const stopEditing = () => {
    setEditBaseline(null);
    setError(null);
    setConflict(null);
  };

  const save = async (formData: ConnectionFormData, version: string | undefined) => {
    setIsSubmitting(true);
    setError(null);
    setConflict(null);
    try {
      await handleUpdate(formData, version);
      setEditBaseline(null);
    } catch (e) {
      // The form stays open with the typed text; the user can try again, or
      // choose between the two versions.
      if (e instanceof ConnectionChangedElsewhereError) {
        setConflict(e.current as Connection);
      } else {
        setError(t('connection_update_failed'));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const onSubmit = (formData: ConnectionFormData) => save(formData, editVersion);

  const conflictChoice = conflict && {
    onLoadLatest: () => {
      setEditBaseline(toFormData(conflict));
      setEditVersion(conflict.updatedAt);
      setConflict(null);
      setFormGeneration(n => n + 1);
    },
    onOverwrite: (formData: ConnectionFormData) => {
      setEditVersion(conflict.updatedAt);
      return save(formData, conflict.updatedAt);
    },
  };

  // The one confirmation for deleting a connection. handleDelete no longer
  // asks itself; it used to, so the user was asked twice.
  const onDelete = async () => {
    setIsConfirmingDelete(false);
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

  if (editBaseline) {
    return (
      <ConnectionForm
        key={`${connection.id}:${formGeneration}`}
        initialData={editBaseline}
        onSubmit={onSubmit}
        conflict={conflictChoice}
        onCancel={stopEditing}
        isSubmitting={isSubmitting}
        submitText="Wijzigingen Opslaan"
        error={error}
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
              onClick={startEditing}
              className={`${styles.button} ${styles.buttonPrimary}`}
              disabled={isSubmitting}
            >
              <span className={styles.buttonIcon}>✏️</span>
              Bewerken
            </button>
            <button 
              onClick={() => setIsConfirmingDelete(true)}
              className={`${styles.button} ${styles.buttonDanger}`}
              disabled={isSubmitting || isConfirmingDelete}
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
        {isConfirmingDelete && (
          <ConfirmPanel
            message={t('confirm_delete_connection_message')}
            confirmLabel={t('confirm_delete_connection_button')}
            cancelLabel={t('cancel_button')}
            onConfirm={() => void onDelete()}
            onCancel={() => setIsConfirmingDelete(false)}
          />
        )}
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