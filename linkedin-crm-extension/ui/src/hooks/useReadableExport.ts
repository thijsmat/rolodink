import { useCallback, useRef, useState } from 'react';
import { API_BASE_URL } from '../config';
import { supabase } from '../services/supabase';
import { getBrowserAPI } from '../utils/browser';
import { decryptWithMemo, type MessageRuntime } from '../utils/decryptField';
import { downloadBlob } from '../utils/download';
import {
    buildReadableExport,
    readableExportFilename,
    toExportBlob,
    type DecryptFn,
    type ReadableExportFormat,
} from '../utils/readableExport';

type Translate = (key: string, substitutions?: string | string[]) => string;

export type ExportProgress = { done: number; total: number };

function getRuntime(): MessageRuntime | null {
    try {
        return getBrowserAPI()?.runtime ?? null;
    } catch {
        // No extension API at all (a plain page in development).
        return null;
    }
}

function decrypterFor(ownerId: string): DecryptFn {
    const runtime = getRuntime();
    if (!runtime) return async () => null;
    return ciphertext => decryptWithMemo(runtime, ownerId, ciphertext);
}

/** Fetch every connection fresh, decrypt it here, and download it readable. */
export function useReadableExport(t: Translate, setToastMessage: (message: string) => void) {
    const [exportingFormat, setExportingFormat] = useState<ReadableExportFormat | null>(null);
    const [progress, setProgress] = useState<ExportProgress | null>(null);
    const busy = useRef(false);

    const exportReadable = useCallback(async (format: ReadableExportFormat) => {
        if (busy.current) return;
        busy.current = true;
        setExportingFormat(format);
        setProgress(null);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.access_token) {
                setToastMessage(t('msg_not_logged_in_export'));
                return;
            }
            // Fresh from the API: the list in the popup is only loaded once
            // its view has been opened, so it may be empty or stale here.
            const response = await fetch(`${API_BASE_URL}/api/connections`, {
                headers: { 'Authorization': `Bearer ${session.access_token}` },
            });
            const connections: unknown = response.ok ? await response.json() : null;
            if (!Array.isArray(connections)) {
                setToastMessage(t('msg_export_failed'));
                return;
            }

            // Progress in whole percents, so a long list re-renders at most a hundred times.
            let shownPercent = -1;
            const { rows, undecryptableCount } = await buildReadableExport(
                connections,
                decrypterFor(session.user.id),
                (done, total) => {
                    const percent = Math.floor((done * 100) / total);
                    if (percent === shownPercent) return;
                    shownPercent = percent;
                    setProgress({ done, total });
                },
            );

            const now = new Date();
            downloadBlob(toExportBlob(rows, format, now), readableExportFilename(format, now));
            setToastMessage(undecryptableCount > 0
                ? t('msg_readable_export_partial', [String(rows.length), String(undecryptableCount)])
                : t('msg_readable_export_success', [String(rows.length)]));
        } catch (e) {
            console.error('Readable export failed:', e);
            setToastMessage(t('msg_export_error_network'));
        } finally {
            busy.current = false;
            setExportingFormat(null);
            setProgress(null);
        }
    }, [t, setToastMessage]);

    return { exportingFormat, progress, exportReadable };
}
