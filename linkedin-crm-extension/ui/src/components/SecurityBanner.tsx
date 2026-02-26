// src/components/SecurityBanner.tsx
import { useState, useEffect } from 'react';
import styles from './SecurityBanner.module.css';

interface SecurityBannerProps {
    readonly onGoToSettings: () => void;
}

export function SecurityBanner({ onGoToSettings }: SecurityBannerProps) {
    const [passphraseActive, setPassphraseActive] = useState<boolean | null>(null);
    const [dismissed, setDismissed] = useState(false);

    useEffect(() => {
        if (typeof chrome !== 'undefined' && chrome.runtime) {
            chrome.runtime.sendMessage({ type: 'CHECK_PASSPHRASE' })
                .then((res: { active?: boolean } | undefined) => {
                    setPassphraseActive(res?.active === true);
                })
                .catch(() => setPassphraseActive(false));
        }
    }, []);

    // Don't render until we know the state, or if dismissed, or if passphrase is active
    if (passphraseActive === null || passphraseActive === true || dismissed) {
        return null;
    }

    return (
        <div className={styles.banner} role="alert">
            <span className={styles.text}>
                🔒 <strong>Nieuw:</strong> Bescherm je netwerk met end-to-end encryptie.
            </span>
            <button className={styles.ctaButton} onClick={onGoToSettings}>
                Stel nu in →
            </button>
            <button
                className={styles.dismissButton}
                onClick={() => setDismissed(true)}
                aria-label="Sluit melding"
            >
                ✕
            </button>
        </div>
    );
}
