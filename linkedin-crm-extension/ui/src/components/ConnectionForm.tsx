// src/components/ConnectionForm.tsx
import { useState, useEffect, useRef } from 'react';
import styles from './ConnectionForm.module.css';
import { useConnection, type ConnectionFormData } from '../context/ConnectionContext';
import { SkeletonForm } from './Skeleton';
import { useExtensionTranslation } from '../hooks/useExtensionTranslation';

export function ConnectionForm({ initialData, onSubmit, onCancel, isSubmitting, submitText, error }: {
  initialData?: ConnectionFormData;
  onSubmit?: (data: ConnectionFormData) => void;
  onCancel?: () => void;
  isSubmitting?: boolean;
  submitText?: string;
  error?: string | null;
}) {
  const { t } = useExtensionTranslation();
  const { handleCreateConnection, connection } = useConnection();
  // initialData is read once, when the form mounts. It used to be copied in
  // again on every new object, and any re-render upstream (a toast, a token
  // refresh) replaced it and wiped what the user had typed. To start over for
  // another connection, the parent gives the form a new key.
  const [meetingPlace, setMeetingPlace] = useState(initialData?.meetingPlace || '');
  const [userCompany, setUserCompany] = useState(initialData?.userCompanyAtTheTime || '');
  const [notes, setNotes] = useState(initialData?.notes || '');
  // Only used when the form creates a connection itself (no onSubmit from a
  // parent): its progress and failure stay inside the form.
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const busy = !!isSubmitting || isCreating;
  const shownError = error ?? createError;
  const formRef = useRef<HTMLFormElement>(null);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Prevent shortcuts when typing in inputs/textarea
      const target = event.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        // Allow Enter to submit when in form fields (except textarea)
        if (event.key === 'Enter' && target.tagName !== 'TEXTAREA') {
          event.preventDefault();
          if (formRef.current && !busy) {
            formRef.current.requestSubmit();
          }
        }
        return;
      }

      // Global shortcuts
      if (event.key === 'Escape' && onCancel) {
        event.preventDefault();
        onCancel();
      }

      if (event.key === 'Enter' && !busy) {
        event.preventDefault();
        if (formRef.current) {
          formRef.current.requestSubmit();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onCancel, busy]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const payload: ConnectionFormData = { meetingPlace, userCompanyAtTheTime: userCompany, notes };
    if (onSubmit) {
      onSubmit(payload);
      return;
    }
    setIsCreating(true);
    setCreateError(null);
    try {
      await handleCreateConnection(payload);
    } catch {
      // The typed text is still in this form's state; say so and let the
      // user try again.
      setCreateError(t('connection_create_failed'));
    } finally {
      setIsCreating(false);
    }
  };

  const isEditMode = !!initialData;
  const notesLength = notes.length;
  const maxNotesLength = 500;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>
          {isEditMode ? t('connection_form_edit_title') : t('connection_form_new_title')}
        </h1>
        {/* Zonder de naam weet je bij het bewerken niet wiens gegevens je aanpast.
            De naam staat alleen in de context, niet in de formulierdata. */}
        {isEditMode && connection?.name ? (
          <p className={styles.connectionName}>{connection.name}</p>
        ) : (
          <p className={styles.subtitle}>
            {isEditMode
              ? t('connection_form_edit_subtitle')
              : t('connection_form_new_subtitle')
            }
          </p>
        )}
      </div>

      <div className={styles.content}>
        {busy ? (
          <SkeletonForm />
        ) : (
          <div className={styles.formCard}>
            <form ref={formRef} onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.formSection}>
                <div className={styles.sectionHeader}>
                  <span className={styles.sectionIcon}>📍</span>
                  <h2 className={styles.sectionTitle}>{t('section_meeting_details')}</h2>
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="meetingPlace" className={styles.label}>
                    <span className={styles.labelIcon}>📍</span>
                    {t('label_meeting_place')}
                  </label>
                  <input
                    id="meetingPlace"
                    type="text"
                    value={meetingPlace}
                    onChange={(e) => setMeetingPlace(e.target.value)}
                    className={styles.input}
                    placeholder={t('placeholder_meeting_place')}
                  />
                  <div className={styles.helpText}>
                    {t('help_meeting_place')}
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="userCompany" className={styles.label}>
                    <span className={styles.labelIcon}>🏢</span>
                    {t('label_user_company')}
                  </label>
                  <input
                    id="userCompany"
                    type="text"
                    value={userCompany}
                    onChange={(e) => setUserCompany(e.target.value)}
                    className={styles.input}
                    placeholder={t('placeholder_user_company')}
                  />
                  <div className={styles.helpText}>
                    {t('help_user_company')}
                  </div>
                </div>
              </div>

              <div className={styles.formSection}>
                <div className={styles.sectionHeader}>
                  <span className={styles.sectionIcon}>📝</span>
                  <h2 className={styles.sectionTitle}>{t('section_notes')}</h2>
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="notes" className={styles.label}>
                    <span className={styles.labelIcon}>💭</span>
                    {t('label_notes')}
                  </label>
                  <textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className={`${styles.input} ${styles.textarea}`}
                    placeholder={t('placeholder_notes')}
                    maxLength={maxNotesLength}
                  />
                  <div className={`${styles.characterCount} ${notesLength > maxNotesLength * 0.9 ? styles.characterCountWarning : ''
                    } ${notesLength >= maxNotesLength ? styles.characterCountError : ''
                    }`}>
                    {t('chars_remaining', [notesLength.toString(), maxNotesLength.toString()])}
                  </div>
                </div>
              </div>

              <div className={styles.tips}>
                <div className={styles.tipsHeader}>
                  <span className={styles.tipsIcon}>💡</span>
                  <span className={styles.tipsTitle}>{t('tips_title')}</span>
                </div>
                <div className={styles.tipsList}>
                  <div className={styles.tip}>
                    <span className={styles.tipIcon}>•</span>
                    <span>{t('tip_1')}</span>
                  </div>
                  <div className={styles.tip}>
                    <span className={styles.tipIcon}>•</span>
                    <span>{t('tip_2')}</span>
                  </div>
                  <div className={styles.tip}>
                    <span className={styles.tipIcon}>•</span>
                    <span>{t('tip_3')}</span>
                  </div>
                </div>
              </div>

              {shownError && (
                <div className={styles.error} role="alert">{shownError}</div>
              )}

              <div className={styles.buttonGroup}>
                <button
                  type="submit"
                  disabled={busy}
                  className={`${styles.button} ${styles.buttonPrimary}`}
                >
                  {busy ? (
                    <>
                      <span className={styles.buttonIcon}>⏳</span>
                      <span>{t('button_saving')}</span>
                    </>
                  ) : (
                    <>
                      <span className={styles.buttonIcon}>💾</span>
                      <span>{submitText || (isEditMode ? t('button_save_changes') : t('button_save_connection'))}</span>
                    </>
                  )}
                </button>
                {onCancel && (
                  <button
                    type="button"
                    onClick={onCancel}
                    className={`${styles.button} ${styles.buttonSecondary}`}
                    disabled={busy}
                  >
                    <span className={styles.buttonIcon}>❌</span>
                    <span>{t('cancel_button')}</span>
                  </button>
                )}
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}