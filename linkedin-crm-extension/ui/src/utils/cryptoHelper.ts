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
 * Zet een wachtwoord (string) om naar een CryptoKey met behulp van PBKDF2.
 * Deze sleutel wordt later gebruikt om een AES-GCM sleutel af te leiden.
 * 
 * @param password Het wachtwoord van de gebruiker.
 * @returns Een asynchrone CryptoKey.
 */
export const getPasswordKey = async (password: string): Promise<CryptoKey> => {
    const enc = getEncoder();
    const keyMaterial = await window.crypto.subtle.importKey(
        'raw',
        enc.encode(password),
        'PBKDF2',
        false,
        ['deriveBits', 'deriveKey']
    );

    return window.crypto.subtle.deriveKey(
        {
            name: 'PBKDF2',
            salt: enc.encode('rolodink-salt-constant'), // In een ideale wereld is dit uniek per gebruiker, maar we houden het nu simpel
            iterations: 100000,
            hash: 'SHA-256',
        },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        true,
        ['encrypt', 'decrypt']
    );
};

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
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const encodedText = enc.encode(text);

    const encryptedContent = await window.crypto.subtle.encrypt(
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

    // Zet om naar Base64
    const base64Data = btoa(String.fromCharCode(...combined));
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

    const combined = new Uint8Array(
        atob(base64String)
            .split('')
            .map((char) => char.charCodeAt(0))
    );

    // Haal de IV (eerste 12 bytes) en de ciphertext uit de array
    const iv = combined.slice(0, 12);
    const data = combined.slice(12);

    const decryptedContent = await window.crypto.subtle.decrypt(
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
