// src/components/ConnectionForm.tsx
import { useState, useEffect } from 'react';
import styles from '../App.module.css';

export type ConnectionFormData = {
  meetingPlace?: string;
  userCompanyAtTheTime?: string;
  notes?: string;
};

type Props = {
  initialData?: ConnectionFormData;
  onSubmit: (formData: ConnectionFormData) => void;
  onCancel?: () => void;
  isSubmitting: boolean;
  submitText: string;
};

export function ConnectionForm({ initialData, onSubmit, onCancel, isSubmitting, submitText }: Props) {
  const [meetingPlace, setMeetingPlace] = useState('');
  const [userCompany, setUserCompany] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (initialData) {
      setMeetingPlace(initialData.meetingPlace || '');
      setUserCompany(initialData.userCompanyAtTheTime || '');
      setNotes(initialData.notes || '');
    }
  }, [initialData]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    onSubmit({ meetingPlace, userCompanyAtTheTime: userCompany, notes });
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className={styles.formGroup}>
        <label htmlFor="meetingPlace">Waar ontmoet?</label>
        <input id="meetingPlace" type="text" value={meetingPlace} onChange={(e) => setMeetingPlace(e.target.value)} />
      </div>
      <div className={styles.formGroup}>
        <label htmlFor="userCompany">Mijn bedrijf destijds</label>
        <input id="userCompany" type="text" value={userCompany} onChange={(e) => setUserCompany(e.target.value)} />
      </div>
      <div className={styles.formGroup}>
        <label htmlFor="notes">Notities</label>
        <textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
      </div>
      <div className={styles.buttonGroup}>
        <button type="submit" disabled={isSubmitting} className={styles.button}>
          {isSubmitting ? 'Bezig...' : submitText}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} className={`${styles.button} ${styles.buttonSecondary}`}>
            Annuleren
          </button>
        )}
      </div>
    </form>
  );
}