/**
 * Helper voor end-to-end encryptie met de native Web Crypto API.
 */

export const ENCRYPTION_PREFIX = 'rolodink-enc:';

export const isEncryptedString = (text: string | null | undefined): boolean => {
    return text ? text.startsWith(ENCRYPTION_PREFIX) : false;
};

/**
 * Retourneert een nieuwe TextEncoder-instantie.
 * Wordt gebruikt om strings om te zetten naar Uint8Array.
 */
export const getEncoder = (): TextEncoder => {
    return new TextEncoder();
};

/**
 * Importeert een raw AES-256 sleutel (ontvangen van de server) als non-extractable CryptoKey.
 * Deze sleutel kan niet uit de browser worden geëxtraheerd.
 *
 * @param rawBase64 Base64-gecodeerde raw 32-byte sleutel van de server.
 * @returns Een non-extractable CryptoKey voor AES-GCM.
 */
export const importDataKey = async (rawBase64: string): Promise<CryptoKey> => {
    const keyBytes = base64ToUint8Array(rawBase64);
    return globalThis.crypto.subtle.importKey(
        'raw',
        keyBytes,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt', 'decrypt']
    );
};

function uint8ArrayToBase64(bytes: Uint8Array): string {
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCodePoint(bytes[i]);
    }
    return btoa(binary);
}

function base64ToUint8Array(base64: string): Uint8Array {
    const binary = atob(base64);
    const len = binary.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binary.codePointAt(i) ?? 0;
    }
    return bytes;
}

/**
 * Versleutelt tekst met AES-GCM.
 * Genereert een willekeurige IV (12 bytes) en combineert deze met de ciphertext.
 * Retourneert het resultaat als een Base64-gecodeerde string.
 * 
 * @param text De te versleutelen tekst.
 * @param secretKey De CryptoKey die is afgeleid van het wachtwoord.
 * @returns Een Base64 string met de IV en de versleutelde data.
 */
export const encryptText = async (text: string, secretKey: CryptoKey): Promise<string> => {
    const enc = getEncoder();
    const iv = globalThis.crypto.getRandomValues(new Uint8Array(12));
    const encodedText = enc.encode(text);

    const encryptedContent = await globalThis.crypto.subtle.encrypt(
        {
            name: 'AES-GCM',
            iv: iv,
        },
        secretKey,
        encodedText
    );

    // Combineer IV en versleutelde content
    const combined = new Uint8Array(iv.length + encryptedContent.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(encryptedContent), iv.length);

    // Zet om naar Base64 met een veilige loop
    const base64Data = uint8ArrayToBase64(combined);
    return ENCRYPTION_PREFIX + base64Data;
};

/**
 * Ontsleutelt een Base64 string die een IV en ciphertext bevat.
 * 
 * @param base64String De Base64 string met de versleutelde data.
 * @param secretKey De CryptoKey die is afgeleid van het wachtwoord.
 * @returns De originele leesbare tekst.
 */
export const decryptText = async (prefixedBase64String: string, secretKey: CryptoKey): Promise<string> => {
    if (!prefixedBase64String.startsWith(ENCRYPTION_PREFIX)) {
        return prefixedBase64String; // Not encrypted or missing prefix
    }

    const base64String = prefixedBase64String.slice(ENCRYPTION_PREFIX.length);
    const combined = base64ToUint8Array(base64String);

    // Haal de IV (eerste 12 bytes) en de ciphertext uit de array
    const iv = combined.slice(0, 12);
    const data = combined.slice(12);

    const decryptedContent = await globalThis.crypto.subtle.decrypt(
        {
            name: 'AES-GCM',
            iv: iv,
        },
        secretKey,
        data
    );

    const dec = new TextDecoder();
    return dec.decode(decryptedContent);
};
