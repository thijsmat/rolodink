// src/components/ConnectionView.tsx
import { useState } from 'react';
import { ConnectionForm } from './ConnectionForm';
import styles from '../App.module.css';
import { useConnection, ConnectionFormData } from '../context/ConnectionContext';

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
      <div>
        <h2>Connectie Bewerken</h2>
        <ConnectionForm
          initialData={initialData}
          onSubmit={onSubmit}
          onCancel={() => setIsEditing(false)}
          isSubmitting={isSubmitting}
          submitText="Wijzigingen Opslaan"
        />
        {error && <p style={{color: 'red'}}>{error}</p>}
      </div>
    );
  }

  return (
    <div>
      <div className={styles.headerWithButton}>
        <h2>Connectie Gevonden</h2>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => setIsEditing(true)} className={styles.button}>
            Bewerken
          </button>
          <button 
            onClick={onDelete}
            className={`${styles.button} ${styles.buttonSecondary}`}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Verwijderen...' : 'Verwijderen'}
          </button>
        </div>
      </div>
      <p><strong>Naam:</strong> {connection.name}</p>
      <p><strong>Ontmoet op:</strong> {connection.meetingPlace || 'N.v.t.'}</p>
      <p><strong>Mijn bedrijf destijds:</strong> {connection.userCompanyAtTheTime || 'N.v.t.'}</p>
      <p><strong>Notities:</strong> {connection.notes || 'Geen notities.'}</p>
      
      <div style={{ marginTop: '16px' }}>
        <a
          href={connection.linkedInUrl}
          target="_blank"
          rel="noopener noreferrer"
          title="Open LinkedIn-profiel"
          style={{ 
            color: 'var(--linkedin-blue)', 
            textDecoration: 'none', 
            fontSize: '14px',
            fontWeight: 'bold'
          }}
        >
          in
        </a>
      </div>
      
      {error && <p style={{color: 'red', marginTop: '10px'}}>{error}</p>}
    </div>
  );
}