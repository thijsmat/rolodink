/**
 * AES-GCM helpers, ported verbatim from the extension's former
 * `ui/src/utils/cryptoHelper.ts` — since deleted (#41): the extension now
 * imports these functions instead of carrying its own copy.
 *
 * The wire format is fixed and shared with data already in the database:
 *
 *     'rolodink-enc:' + base64( iv[12] || ciphertext || gcmTag[16] )
 *
 * WebCrypto appends the 16-byte GCM tag to the ciphertext itself, so the tag is
 * not handled separately here. Do not change any of this without a migration —
 * the extension, the web app and every stored row depend on it byte for byte.
 */

export const ENCRYPTION_PREFIX = 'rolodink-enc:';

/** True when a value carries the ciphertext prefix. Values without it are legacy plaintext. */
export function isEncryptedString(text: string | null | undefined): boolean {
    return typeof text === 'string' && text.startsWith(ENCRYPTION_PREFIX);
}

function uint8ArrayToBase64(bytes: Uint8Array): string {
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCodePoint(bytes[i] as number);
    }
    return btoa(binary);
}

function base64ToUint8Array(base64: string): Uint8Array {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.codePointAt(i) ?? 0;
    }
    return bytes;
}

/**
 * Imports the raw base64 data key from `GET /api/user/key` as a
 * **non-extractable** CryptoKey, so it can be used but never read back out.
 */
export async function importDataKey(rawBase64: string): Promise<CryptoKey> {
    const keyBytes = base64ToUint8Array(rawBase64);
    const keyBuffer = new ArrayBuffer(keyBytes.byteLength);
    new Uint8Array(keyBuffer).set(keyBytes);
    return globalThis.crypto.subtle.importKey(
        'raw',
        keyBuffer,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt', 'decrypt']
    );
}

/** Encrypts text with a fresh random 12-byte IV and returns the prefixed base64 blob. */
export async function encryptText(text: string, secretKey: CryptoKey): Promise<string> {
    const iv = globalThis.crypto.getRandomValues(new Uint8Array(12));
    const encoded = new TextEncoder().encode(text);

    const encrypted = await globalThis.crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        secretKey,
        encoded
    );

    const combined = new Uint8Array(iv.length + encrypted.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(encrypted), iv.length);

    return ENCRYPTION_PREFIX + uint8ArrayToBase64(combined);
}

/**
 * Decrypts a prefixed blob. Values without the prefix are returned unchanged so
 * legacy plaintext rows keep working; a prefixed value that fails to decrypt
 * throws, and callers must not fall back to treating it as plaintext.
 */
export async function decryptText(prefixedBase64: string, secretKey: CryptoKey): Promise<string> {
    if (!prefixedBase64.startsWith(ENCRYPTION_PREFIX)) {
        return prefixedBase64;
    }

    const combined = base64ToUint8Array(prefixedBase64.slice(ENCRYPTION_PREFIX.length));
    const iv = combined.slice(0, 12);
    const data = combined.slice(12);

    const decrypted = await globalThis.crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        secretKey,
        data
    );

    return new TextDecoder().decode(decrypted);
}
