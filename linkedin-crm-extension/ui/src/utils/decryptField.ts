import { getDecrypted, rememberDecrypted } from './decryptMemo';

/** The part of runtime the popup needs to reach the background script's key. */
export type MessageRuntime = {
    sendMessage: (message: { type: 'DECRYPT_TEXT'; ciphertext: string }) => Promise<unknown>;
};

type DecryptResponse = { success?: boolean; plaintext?: unknown };

/**
 * Decrypt one value through the background script, from the memo when this
 * owner has decrypted it before. Null when it cannot be decrypted (no key yet,
 * a key that does not fit, or no answer), so every caller decides for itself
 * what a locked field looks like: the list shows a lock, an export leaves it out.
 */
export async function decryptWithMemo(
    runtime: MessageRuntime,
    ownerId: string | null,
    ciphertext: string,
): Promise<string | null> {
    const known = ownerId ? getDecrypted(ownerId, ciphertext) : undefined;
    if (known !== undefined) return known;
    try {
        const response = (await runtime.sendMessage({ type: 'DECRYPT_TEXT', ciphertext })) as DecryptResponse | undefined;
        if (!response?.success || typeof response.plaintext !== 'string') return null;
        // Only successes are kept: a locked field may open once the key is there.
        if (ownerId) rememberDecrypted(ownerId, ciphertext, response.plaintext);
        return response.plaintext;
    } catch (e) {
        console.warn('[Decryption] Failed:', e);
        return null;
    }
}
