import styles from './SettingsView.module.css';
import type { ExportProgress } from '../hooks/useReadableExport';
import type { ReadableExportFormat } from '../utils/readableExport';

type Translate = (key: string, substitutions?: string | string[]) => string;

const FORMATS: ReadonlyArray<{ format: ReadableExportFormat; labelKey: string }> = [
    { format: 'csv', labelKey: 'readable_export_csv_button' },
    { format: 'json', labelKey: 'readable_export_json_button' },
];

function progressText(t: Translate, progress: ExportProgress | null): string {
    if (!progress) return t('readable_export_fetching');
    return t('readable_export_progress', [String(progress.done), String(progress.total)]);
}

/** The "readable export" row in Settings: a warning, two formats and progress. */
export function ReadableExportSetting({ t, exportingFormat, progress, onExport }: Readonly<{
    t: Translate;
    exportingFormat: ReadableExportFormat | null;
    progress: ExportProgress | null;
    onExport: (format: ReadableExportFormat) => void;
}>) {
    const busy = exportingFormat !== null;
    return (
        <div className={styles.settingItem}>
            <div className={styles.settingInfo}>
                <h4 className={styles.settingName}>{t('readable_export_title')}</h4>
                <p className={styles.settingDescription}>{t('readable_export_description')}</p>
                <p className={styles.exportWarning}>{t('readable_export_warning')}</p>
            </div>
            <div className={styles.buttonRow}>
                {FORMATS.map(({ format, labelKey }) => (
                    <button
                        key={format}
                        type="button"
                        className={styles.actionButton}
                        onClick={() => onExport(format)}
                        disabled={busy}
                    >
                        {exportingFormat === format ? t('exporting_button') : t(labelKey)}
                    </button>
                ))}
            </div>
            {busy && (
                <output className={styles.exportProgress} aria-live="polite">
                    {progressText(t, progress)}
                </output>
            )}
        </div>
    );
}
