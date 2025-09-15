// src/components/Toast.tsx
import { useEffect } from 'react';

type ToastProps = {
  message: string;
  onClose: () => void;
  duration?: number; // ms
};

export function Toast({ message, onClose, duration = 3000 }: ToastProps) {
  useEffect(() => {
    if (!message) return;
    const t = setTimeout(onClose, duration);
    return () => clearTimeout(t);
  }, [message, onClose, duration]);

  if (!message) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: '16px',
      left: '50%',
      transform: 'translateX(-50%)',
      background: 'var(--bg-surface)',
      color: 'var(--text-primary)',
      border: '1px solid var(--border-color)',
      boxShadow: 'var(--shadow-md)',
      borderRadius: 'var(--radius-md)',
      padding: '12px 16px',
      fontSize: 'var(--font-size-sm)',
      zIndex: 9999
    }}>
      {message}
    </div>
  );
}
