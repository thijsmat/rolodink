// src/components/FormField.tsx
import styles from './ConnectionForm.module.css';

type FormFieldProps = Readonly<{
  id: string;
  icon: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  placeholder: string;
  help?: string;
  /** Shown under the field without blocking the save. */
  warning?: string | null;
  type?: 'text' | 'email' | 'tel';
  autoComplete?: string;
  maxLength?: number;
}>;

/** One labelled single-line input of the connection form, with its help text. */
export function FormField({
  id, icon, label, value, onChange, onBlur, placeholder, help, warning, type = 'text', autoComplete, maxLength,
}: FormFieldProps) {
  const helpId = `${id}-help`;
  const warningId = `${id}-warning`;
  const describedBy = [help ? helpId : '', warning ? warningId : ''].filter(Boolean).join(' ');

  return (
    <div className={styles.formGroup}>
      <label htmlFor={id} className={styles.label}>
        <span className={styles.labelIcon}>{icon}</span>
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        className={styles.input}
        placeholder={placeholder}
        autoComplete={autoComplete}
        maxLength={maxLength}
        spellCheck={type === 'text'}
        aria-describedby={describedBy || undefined}
      />
      {help && (
        <div id={helpId} className={styles.helpText}>
          {help}
        </div>
      )}
      {warning && (
        <div id={warningId} className={styles.fieldWarning} aria-live="polite">
          {warning}
        </div>
      )}
    </div>
  );
}
