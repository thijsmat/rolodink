// src/components/NewConnectionForm.tsx
import { useState, useEffect } from 'react';
import styles from '../App.module.css';

export type ConnectionFormData = {
  meetingPlace: string;
  userCompanyAtTheTime: string;
  notes: string;
};

type NewConnectionFormProps = {
  initialData?: any;
  onSubmit: (formData: ConnectionFormData) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
};

export function NewConnectionForm({ initialData, onSubmit, onCancel, isSubmitting }: NewConnectionFormProps) {
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
    onSubmit({
      meetingPlace,
      userCompanyAtTheTime: userCompany,
      notes,
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className={styles.formGroup}>
        <label htmlFor="meetingPlace">Waar ontmoet?</label>
        <input
          id="meetingPlace"
          type="text"
          value={meetingPlace}
          onChange={(e) => setMeetingPlace(e.target.value)}
          placeholder="bv. TechBeurs 2025"
        />
      </div>
      <div className={styles.formGroup}>
        <label htmlFor="userCompany">Mijn bedrijf destijds</label>
        <input
          id="userCompany"
          type="text"
          value={userCompany}
          onChange={(e) => setUserCompany(e.target.value)}
          placeholder="bv. Mijn Startup"
        />
      </div>
      <div className={styles.formGroup}>
        <label htmlFor="notes">Notities</label>
        <textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Notities over deze persoon..."
        />
      </div>
      <div style={{ display: 'flex', gap: '10px', marginTop: '1rem' }}>
         <button type="submit" disabled={isSubmitting} className={styles.button}>
          {isSubmitting ? 'Opslaan...' : 'Wijzigingen Opslaan'}
        </button>
        <button type="button" onClick={onCancel} className={styles.button} style={{ backgroundColor: '#6c757d' }}>
          Annuleren
        </button>
      </div>
    </form>
  );
}