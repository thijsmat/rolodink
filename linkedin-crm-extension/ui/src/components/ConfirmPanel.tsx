// src/components/ConfirmPanel.tsx
import { useId, useState } from 'react';
import styles from './ConfirmPanel.module.css';

/**
 * An inline "are you sure?" in place of window.confirm and prompt(). In a
 * Firefox popup the native dialogs can open as a separate window, which takes
 * focus and closes the popup, so the question was lost along with the answer.
 *
 * With `typedConfirmation` the confirm button stays disabled until what the
 * user typed passes `isValid`, and the typed text is handed to onConfirm.
 */
export type ConfirmPanelProps = {
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: (typed: string) => void;
  onCancel: () => void;
  busy?: boolean;
  typedConfirmation?: {
    label: string;
    isValid: (typed: string) => boolean;
  };
};

export function ConfirmPanel({
  message,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
  busy = false,
  typedConfirmation,
}: Readonly<ConfirmPanelProps>) {
  const [typed, setTyped] = useState('');
  const messageId = useId();
  const canConfirm = !busy && (!typedConfirmation || typedConfirmation.isValid(typed));

  return (
    <div className={styles.panel} role="alertdialog" aria-describedby={messageId}>
      <p id={messageId} className={styles.message}>{message}</p>
      {typedConfirmation && (
        <input
          type="text"
          className={styles.input}
          aria-label={typedConfirmation.label}
          placeholder={typedConfirmation.label}
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          autoComplete="off"
          autoFocus
        />
      )}
      <div className={styles.actions}>
        <button type="button" className={styles.cancelButton} onClick={onCancel} disabled={busy}>
          {cancelLabel}
        </button>
        <button
          type="button"
          className={styles.confirmButton}
          onClick={() => onConfirm(typed)}
          disabled={!canConfirm}
          data-confirm="true"
        >
          {confirmLabel}
        </button>
      </div>
    </div>
  );
}
