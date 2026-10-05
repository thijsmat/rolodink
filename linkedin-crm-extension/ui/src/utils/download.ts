/**
 * Save a Blob as a file from the popup: an object URL and a temporary
 * <a download>. No `downloads` permission is needed for this, in Chrome, Edge
 * or Firefox, because the click starts an ordinary same-document download.
 *
 * The URL is revoked a little later rather than straight after the click:
 * Firefox reads the blob asynchronously once the download has started, and
 * revoking in the same tick can leave it with nothing to read. Should the
 * popup close first, the URL goes with the document anyway.
 */
export const REVOKE_DELAY_MS = 1000;

export function downloadBlob(blob: Blob, filename: string): void {
    const url = globalThis.URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.rel = 'noopener';
    anchor.style.display = 'none';
    document.body.appendChild(anchor);
    try {
        anchor.click();
    } finally {
        anchor.remove();
        setTimeout(() => globalThis.URL.revokeObjectURL(url), REVOKE_DELAY_MS);
    }
}
