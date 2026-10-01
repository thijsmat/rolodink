import { useEffect, type RefObject } from 'react';

function submitUnlessBusy(form: HTMLFormElement | null, busy: boolean) {
  if (form && !busy) {
    form.requestSubmit();
  }
}

/**
 * Keyboard shortcuts for a form: Enter submits (except inside a textarea),
 * Escape cancels when not typing in a field.
 */
export function useFormShortcuts(
  formRef: RefObject<HTMLFormElement | null>,
  busy: boolean,
  onCancel?: () => void,
) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      const inField = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';
      if (inField) {
        // Allow Enter to submit when in form fields (except textarea)
        if (event.key === 'Enter' && target.tagName !== 'TEXTAREA') {
          event.preventDefault();
          submitUnlessBusy(formRef.current, busy);
        }
        return;
      }
      if (event.key === 'Escape' && onCancel) {
        event.preventDefault();
        onCancel();
      }
      if (event.key === 'Enter' && !busy) {
        event.preventDefault();
        submitUnlessBusy(formRef.current, busy);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [formRef, onCancel, busy]);
}
