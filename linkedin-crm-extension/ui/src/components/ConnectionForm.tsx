// src/components/ConnectionForm.tsx
import { useState, useRef } from 'react';
import styles from './ConnectionForm.module.css';
import { useConnection, type ConnectionFormData } from '../context/ConnectionContext';
import { SkeletonForm } from './Skeleton';
import { useExtensionTranslation } from '../hooks/useExtensionTranslation';
import { FormField } from './FormField';
import { contactFieldEdits, isUnreadableValue } from '../utils/connectionUpdate';
import { isOddEmail } from '../utils/contactLinks';
import { useFormShortcuts } from '../hooks/useFormShortcuts';

const MAX_EMAIL_LENGTH = 254;
const MAX_PHONE_LENGTH = 40;

/**
 * What the form offers after a save was refused because the connection
 * changed elsewhere. The typed text stays in the form until one is chosen.
 */
export type ConflictChoice = {
  /** Starts the form over from the stored version; what was typed is dropped. */
  onLoadLatest: () => void;
  /** Saves what is in the form over the stored version. */
  onOverwrite: (data: ConnectionFormData) => void | Promise<void>;
};

/** The text each field starts with: the stored value, or empty. */
function initialFields(data?: ConnectionFormData) {
  return {
    meetingPlace: data?.meetingPlace ?? '',
    userCompany: data?.userCompanyAtTheTime ?? '',
    notes: data?.notes ?? '',
    email: data?.email ?? '',
    phone: data?.phone ?? '',
  };
}

/** Title, subtitle and save label for a new versus an edited connection. */
function formTexts(t: (key: string) => string, isEditMode: boolean, submitText?: string) {
  if (isEditMode) {
    return {
      title: t('connection_form_edit_title'),
      subtitle: t('connection_form_edit_subtitle'),
      submit: submitText || t('button_save_changes'),
    };
  }
  return {
    title: t('connection_form_new_title'),
    subtitle: t('connection_form_new_subtitle'),
    submit: submitText || t('button_save_connection'),
  };
}

/** The notes counter turns amber near the limit and red at it. */
function characterCountClass(length: number, max: number): string {
  const classes = [styles.characterCount];
  if (length > max * 0.9) classes.push(styles.characterCountWarning);
  if (length >= max) classes.push(styles.characterCountError);
  return classes.join(' ');
}

export function ConnectionForm({ initialData, onSubmit, onCancel, isSubmitting, submitText, error, conflict }: Readonly<{
  initialData?: ConnectionFormData;
  onSubmit?: (data: ConnectionFormData) => void | Promise<void>;
  onCancel?: () => void;
  isSubmitting?: boolean;
  submitText?: string;
  error?: string | null;
  conflict?: ConflictChoice | null;
}>) {
  const { t } = useExtensionTranslation();
  const { handleCreateConnection, connection } = useConnection();
  // initialData is read once, when the form mounts. It used to be copied in
  // again on every new object, and any re-render upstream (a toast, a token
  // refresh) replaced it and wiped what the user had typed. To start over for
  // another connection, the parent gives the form a new key.
  const start = initialFields(initialData);
  const [meetingPlace, setMeetingPlace] = useState(start.meetingPlace);
  const [userCompany, setUserCompany] = useState(start.userCompany);
  const [notes, setNotes] = useState(start.notes);
  const [email, setEmail] = useState(start.email);
  const [phone, setPhone] = useState(start.phone);
  // The format hint waits until the user leaves the field, so it does not
  // flash while an address is still being typed. It never blocks the save.
  const [emailBlurred, setEmailBlurred] = useState(false);
  const emailWarning = emailBlurred && !isUnreadableValue(email) && isOddEmail(email) ? t('warning_email_format') : null;
  // Only used when the form creates a connection itself (no onSubmit from a
  // parent): its progress and failure stay inside the form.
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const busy = !!isSubmitting || isCreating;
  const shownError = error ?? createError;
  const formRef = useRef<HTMLFormElement>(null);

  useFormShortcuts(formRef, busy, onCancel);

  // Email and phone go along only when changed (see contactFieldEdits), so
  // saving the other fields can never clear them.
  const currentData = (): ConnectionFormData => ({
    meetingPlace,
    userCompanyAtTheTime: userCompany,
    notes,
    ...contactFieldEdits(initialData, { email, phone }),
  });

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const payload = currentData();
    if (onSubmit) {
      await onSubmit(payload);
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
  const texts = formTexts(t, isEditMode, submitText);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>
          {texts.title}
        </h1>
        {/* Zonder de naam weet je bij het bewerken niet wiens gegevens je aanpast.
            De naam staat alleen in de context, niet in de formulierdata. */}
        {isEditMode && connection?.name ? (
          <p className={styles.connectionName}>{connection.name}</p>
        ) : (
          <p className={styles.subtitle}>
            {texts.subtitle}
          </p>
        )}
      </div>

      <div className={styles.content}>
        {busy ? (
          <SkeletonForm />
        ) : (
          <div className={styles.formCard}>
            {/* noValidate: a type="email" field would otherwise make the browser
                refuse the save. The format hint under the field only warns. */}
            <form ref={formRef} onSubmit={handleSubmit} className={styles.form} noValidate>
              <div className={styles.formSection}>
                <div className={styles.sectionHeader}>
                  <span className={styles.sectionIcon}>📍</span>
                  <h2 className={styles.sectionTitle}>{t('section_meeting_details')}</h2>
                </div>

                <FormField
                  id="meetingPlace"
                  icon="📍"
                  label={t('label_meeting_place')}
                  value={meetingPlace}
                  onChange={setMeetingPlace}
                  placeholder={t('placeholder_meeting_place')}
                  help={t('help_meeting_place')}
                />

                <FormField
                  id="userCompany"
                  icon="🏢"
                  label={t('label_user_company')}
                  value={userCompany}
                  onChange={setUserCompany}
                  placeholder={t('placeholder_user_company')}
                  help={t('help_user_company')}
                />
              </div>

              <div className={styles.formSection}>
                <div className={styles.sectionHeader}>
                  <span className={styles.sectionIcon}>📇</span>
                  <h2 className={styles.sectionTitle}>{t('section_contact')}</h2>
                </div>

                {/* autoComplete off: these are someone else's details, and the
                    browser would offer the user's own address and number. */}
                <FormField
                  id="email"
                  type="email"
                  icon="✉️"
                  label={t('label_email')}
                  value={email}
                  onChange={setEmail}
                  onBlur={() => setEmailBlurred(true)}
                  placeholder={t('placeholder_email')}
                  help={t('help_contact_private')}
                  autoComplete="off"
                  maxLength={MAX_EMAIL_LENGTH}
                  warning={emailWarning}
                />

                <FormField
                  id="phone"
                  type="tel"
                  icon="📞"
                  label={t('label_phone')}
                  value={phone}
                  onChange={setPhone}
                  placeholder={t('placeholder_phone')}
                  autoComplete="off"
                  maxLength={MAX_PHONE_LENGTH}
                />
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
                  <div className={characterCountClass(notesLength, maxNotesLength)}>
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

              {conflict && (
                <div className={styles.conflict} role="alert">
                  <p className={styles.conflictMessage}>{t('connection_conflict_message')}</p>
                  <div className={styles.conflictActions}>
                    <button
                      type="button"
                      className={`${styles.button} ${styles.buttonSecondary}`}
                      onClick={conflict.onLoadLatest}
                    >
                      {t('connection_conflict_load_latest')}
                    </button>
                    <button
                      type="button"
                      className={`${styles.button} ${styles.buttonPrimary}`}
                      onClick={() => void conflict.onOverwrite(currentData())}
                    >
                      {t('connection_conflict_overwrite')}
                    </button>
                  </div>
                </div>
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
                      <span>{texts.submit}</span>
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