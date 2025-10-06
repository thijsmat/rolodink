// src/components/ConnectionForm.tsx
import { useState, useEffect, useRef } from 'react';
import styles from './ConnectionForm.module.css';
import { useConnection, ConnectionFormData } from '../context/ConnectionContext';
import { SkeletonForm } from './Skeleton';

export function ConnectionForm({ initialData, onSubmit, onCancel, isSubmitting, submitText }: {
  initialData?: ConnectionFormData;
  onSubmit?: (data: ConnectionFormData) => void;
  onCancel?: () => void;
  isSubmitting?: boolean;
  submitText?: string;
}) {
  const { handleCreateConnection } = useConnection();
  const [meetingPlace, setMeetingPlace] = useState('');
  const [userCompany, setUserCompany] = useState('');
  const [notes, setNotes] = useState('');
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (initialData) {
      setMeetingPlace(initialData.meetingPlace || '');
      setUserCompany(initialData.userCompanyAtTheTime || '');
      setNotes(initialData.notes || '');
    }
  }, [initialData]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Prevent shortcuts when typing in inputs/textarea
      const target = event.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        // Allow Enter to submit when in form fields (except textarea)
        if (event.key === 'Enter' && target.tagName !== 'TEXTAREA') {
          event.preventDefault();
          if (formRef.current && !isSubmitting) {
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
      
      if (event.key === 'Enter' && !isSubmitting) {
        event.preventDefault();
        if (formRef.current) {
          formRef.current.requestSubmit();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onCancel, isSubmitting]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const payload: ConnectionFormData = { meetingPlace, userCompanyAtTheTime: userCompany, notes };
    if (onSubmit) {
      onSubmit(payload);
    } else {
      await handleCreateConnection(payload);
    }
  };

  const isEditMode = !!initialData;
  const notesLength = notes.length;
  const maxNotesLength = 500;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>
          {isEditMode ? 'Connectie Bewerken' : 'Nieuwe Connectie'}
        </h1>
        <p className={styles.subtitle}>
          {isEditMode 
            ? 'Wijzig de details van deze connectie' 
            : 'Voeg extra informatie toe aan deze connectie'
          }
        </p>
      </div>

      <div className={styles.content}>
        {isSubmitting ? (
          <SkeletonForm />
        ) : (
          <form ref={formRef} onSubmit={handleSubmit} className={styles.form}>
          <fieldset className={styles.fieldset}>
            <legend className={styles.legend}>Ontmoetingsdetails</legend>
            
            <div className={styles.formGroup}>
              <label htmlFor="meetingPlace" className={styles.label}>
                Waar hebben jullie elkaar ontmoet?
              </label>
              <input
                id="meetingPlace"
                type="text"
                value={meetingPlace}
                onChange={(e) => setMeetingPlace(e.target.value)}
                className={styles.input}
                placeholder="Bijv. LinkedIn event, conferentie, via-via..."
              />
              <div className={styles.helpText}>
                Dit helpt je later te herinneren waar je deze persoon hebt leren kennen
              </div>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="userCompany" className={styles.label}>
                Mijn bedrijf destijds
              </label>
              <input
                id="userCompany"
                type="text"
                value={userCompany}
                onChange={(e) => setUserCompany(e.target.value)}
                className={styles.input}
                placeholder="Bijv. Acme Corp, Freelancer, Student..."
              />
              <div className={styles.helpText}>
                Waar werkte je toen je deze persoon ontmoette?
              </div>
            </div>
          </fieldset>

          <div className={styles.formGroup}>
            <label htmlFor="notes" className={styles.label}>
              Notities
            </label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className={`${styles.input} ${styles.textarea}`}
              placeholder="Voeg hier extra notities toe over deze persoon, jullie gesprek, of andere relevante informatie..."
              maxLength={maxNotesLength}
            />
            <div className={`${styles.characterCount} ${
              notesLength > maxNotesLength * 0.9 ? styles.characterCountWarning : ''
            } ${
              notesLength >= maxNotesLength ? styles.characterCountError : ''
            }`}>
              {notesLength}/{maxNotesLength} karakters
            </div>
          </div>

          <div className={styles.tips}>
            <div className={styles.tipsTitle}>💡 Tips voor goede notities</div>
            <div className={styles.tipsList}>
              <div className={styles.tip}>
                <span className={styles.tipIcon}>•</span>
                <span>Noteer wat jullie bespraken of waar jullie over spraken</span>
              </div>
              <div className={styles.tip}>
                <span className={styles.tipIcon}>•</span>
                <span>Voeg contactgegevens toe die je later nodig hebt</span>
              </div>
              <div className={styles.tip}>
                <span className={styles.tipIcon}>•</span>
                <span>Noteer follow-up acties of beloftes</span>
              </div>
            </div>
          </div>

          <div className={styles.buttonGroup}>
            <button
              type="submit"
              disabled={!!isSubmitting}
              className={`${styles.button} ${styles.buttonPrimary}`}
            >
              {isSubmitting ? (
                <div className={styles.loading}>
                  <span>⏳</span>
                  <span>Bezig...</span>
                </div>
              ) : (
                <>
                  <span>💾</span>
                  <span>{submitText || (isEditMode ? 'Wijzigingen Opslaan' : 'Connectie Opslaan')}</span>
                </>
              )}
            </button>
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className={`${styles.button} ${styles.buttonSecondary}`}
                disabled={isSubmitting}
              >
                <span>❌</span>
                <span>Annuleren</span>
              </button>
            )}
          </div>
        </form>
        )}
      </div>
    </div>
  );
}