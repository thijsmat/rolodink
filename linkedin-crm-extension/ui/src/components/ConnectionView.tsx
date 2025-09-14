// src/components/ConnectionView.tsx
import { useState } from 'react';
import { ConnectionForm, ConnectionFormData } from './ConnectionForm';
import styles from '../App.module.css';

const API_BASE_URL = 'https://linkedin-crm-backend-matthijs-goes-projects.vercel.app';

interface Connection {
  id: string;
  name: string;
  meetingPlace?: string;
  userCompanyAtTheTime?: string;
  notes?: string;
}

type Props = {
  connection: Connection;
  onConnectionUpdate: (updatedConnection: Connection) => void;
  onConnectionDeleted: () => void;
};

export function ConnectionView({ connection, onConnectionUpdate, onConnectionDeleted }: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpdate = async (formData: ConnectionFormData) => {
    setIsSubmitting(true);
    setError(null);
    try {
      const { supabaseAccessToken } = await chrome.storage.local.get('supabaseAccessToken');
      if (!supabaseAccessToken) throw new Error('Niet ingelogd');

      // Validate that we have a connection ID
      if (!connection.id) {
        throw new Error('Connection ID is missing');
      }

      // Validate connection object structure
      console.log('Connection object:', connection);
      console.log('Form data:', formData);

      // Ensure all fields are properly formatted for the API
      const updatePayload = {
        id: connection.id,
        meetingPlace: formData.meetingPlace || null,
        userCompanyAtTheTime: formData.userCompanyAtTheTime || null,
        notes: formData.notes || null
      };

      // Debug logging
      console.log('Updating connection with payload:', updatePayload);
      console.log('Payload JSON:', JSON.stringify(updatePayload));

      const response = await fetch(`${API_BASE_URL}/api/connections`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseAccessToken}`
        },
        body: JSON.stringify(updatePayload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Update failed with response:', response.status, errorData);
        throw new Error(errorData.error || `HTTP ${response.status}: Update mislukt`);
      }
      
      const updatedConnection = await response.json();
      console.log('Update successful, received:', updatedConnection);
      onConnectionUpdate(updatedConnection);
      setIsEditing(false);

    } catch (e) {
      console.error("Fout bij bijwerken:", e);
      setError(`Kon de connectie niet bijwerken: ${e instanceof Error ? e.message : 'Onbekende fout'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    const confirmed = window.confirm('Weet je zeker dat je deze connectie wilt verwijderen? Deze actie kan niet ongedaan worden gemaakt.');
    
    if (!confirmed) return;

    setIsSubmitting(true);
    setError(null);
    try {
      const { supabaseAccessToken } = await chrome.storage.local.get('supabaseAccessToken');
      if (!supabaseAccessToken) throw new Error('Niet ingelogd');

      const response = await fetch(`${API_BASE_URL}/api/connections/${connection.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${supabaseAccessToken}`
        },
      });

      if (!response.ok) throw new Error('Verwijderen mislukt');
      
      // Notify parent component that connection was deleted
      onConnectionDeleted();

    } catch (e) {
      console.error("Fout bij verwijderen:", e);
      setError("Kon de connectie niet verwijderen.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isEditing) {
    return (
      <div>
        <h2>Connectie Bewerken</h2>
        <ConnectionForm
          initialData={connection}
          onSubmit={handleUpdate}
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
            onClick={handleDelete} 
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
      {error && <p style={{color: 'red', marginTop: '10px'}}>{error}</p>}
    </div>
  );
}