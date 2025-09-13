import React, { useState, FormEvent, ChangeEvent } from 'react';

/**
 * De datastructuur voor het formulier.
 * Dit type kan worden geïmporteerd door andere componenten die dit formulier gebruiken.
 */
export type ConnectionFormData = {
  name: string;
  title: string;
  notes: string;
  meetingPlace: string;
  userCompanyAtTheTime: string;
};

type NewConnectionFormProps = {
  // Optionele initiële data om het formulier vooraf in te vullen (voor bewerken)
  initialData?: Partial<ConnectionFormData>;
  // Callback die wordt aangeroepen bij het succesvol submitten van het formulier
  onSubmit: (data: ConnectionFormData) => void;
  // Callback die wordt aangeroepen als op de "Cancel" knop wordt geklikt
  onCancel: () => void;
  // Boolean om aan te geven of het formulier bezig is met submitten
  isSubmitting: boolean;
};

export function NewConnectionForm({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting,
}: NewConnectionFormProps) {
  const [formData, setFormData] = useState<ConnectionFormData>({
    name: initialData?.name || '',
    title: initialData?.title || '',
    notes: initialData?.notes || '',
    meetingPlace: initialData?.meetingPlace || '',
    userCompanyAtTheTime: initialData?.userCompanyAtTheTime || '',
  });

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const inputStyle =
    'mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:bg-gray-100';
  const labelStyle = 'block text-sm font-medium text-gray-700';

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="name" className={labelStyle}>
          Name
        </label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          className={inputStyle}
          disabled={isSubmitting}
          required
        />
      </div>

      <div>
        <label htmlFor="title" className={labelStyle}>
          Title
        </label>
        <input
          type="text"
          id="title"
          name="title"
          value={formData.title}
          onChange={handleChange}
          className={inputStyle}
          disabled={isSubmitting}
        />
      </div>

      <div>
        <label htmlFor="notes" className={labelStyle}>
          Notes
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={4}
          value={formData.notes}
          onChange={handleChange}
          className={inputStyle}
          disabled={isSubmitting}
        />
      </div>

      <div className="flex justify-end space-x-2 pt-2">
        <button type="button" onClick={onCancel} disabled={isSubmitting} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300">
          Cancel
        </button>
        <button type="submit" disabled={isSubmitting} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-blue-300">
          {isSubmitting ? 'Saving...' : 'Save'}
        </button>
      </div>
    </form>
  );
}