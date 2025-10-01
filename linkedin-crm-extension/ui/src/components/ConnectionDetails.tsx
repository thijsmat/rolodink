import { useState } from 'react';
// We gaan ervan uit dat NewConnectionForm deze props accepteert en deze types exporteert.
import { NewConnectionForm, ConnectionFormData } from './NewConnectionForm';
import { API_BASE_URL } from '../config';

// Het type voor een connectie-object
export type Connection = {
  id: string;
  name: string;
  title: string;
  notes?: string | null;
  // eventuele andere velden
};

type ConnectionDetailsProps = {
  initialConnection: Connection;
  onClose: () => void; // Functie om de detailweergave te sluiten
  onUpdate: (updatedConnection: Connection) => void; // Callback om de oudercomponent te informeren over een update
};

export function ConnectionDetails({
  initialConnection,
  onClose,
  onUpdate,
}: ConnectionDetailsProps) {
  const [isEditing, setIsEditing] = useState(false);
  // Lokale state voor de connectie, zodat updates onmiddellijk zichtbaar zijn.
  const [connection, setConnection] = useState(initialConnection);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleEditSubmit = async (formData: ConnectionFormData) => {
    setError(null);
    setIsSubmitting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/connections`, { // URL is nu zonder ID
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: connection.id, // Stuur de ID nu mee in de body
          ...formData
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update connection.');
      }

      const updatedConnection: Connection = await response.json();

      // Update de lokale state om de wijzigingen te tonen
      setConnection(updatedConnection);
      // Informeer de oudercomponent over de update
      onUpdate(updatedConnection);
      // Verlaat de bewerkingsmodus
      setIsEditing(false);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(errorMessage);
      console.error('Update failed:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render de bewerkingsweergave
  if (isEditing) {
    return (
      <div className="p-4 bg-white rounded-lg shadow-md">
        <NewConnectionForm
          // Geef de huidige data mee om het formulier vooraf in te vullen
          initialData={connection}
          onSubmit={handleEditSubmit}
          onCancel={() => setIsEditing(false)}
          isSubmitting={isSubmitting}
        />
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      </div>
    );
  }

  // Render de standaard weergave
  return (
    <div className="p-4 bg-white rounded-lg shadow-md space-y-3">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-xl font-bold text-gray-800">{connection.name}</h2>
          <p className="text-sm text-gray-600">{connection.title}</p>
        </div>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-800"
          aria-label="Close"
        >
          &times;
        </button>
      </div>
      <div>
        <h3 className="font-semibold text-gray-700">Notes</h3>
        <p className="mt-1 text-gray-800 whitespace-pre-wrap">
          {connection.notes || 'No notes yet.'}
        </p>
      </div>
      <div className="flex justify-end space-x-2">
        <button
          onClick={() => setIsEditing(true)}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
        >
          Edit
        </button>
      </div>
    </div>
  );
}
