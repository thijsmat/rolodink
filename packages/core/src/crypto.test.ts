import { describe, it, expect } from 'vitest';
import {
    ENCRYPTION_PREFIX,
    isEncryptedString,
    importDataKey,
    encryptText,
    decryptText,
} from './crypto.js';

/**
 * Fixed key and ciphertext produced by the extension's own helper
 * (ui/src/utils/cryptoHelper.ts) running under WebCrypto.
 *
 * This is the real compatibility guard. A round trip alone proves nothing about
 * interoperability — it passes just as happily if both sides are wrong together.
 * If this test starts failing, the wire format has drifted and every note
 * already in the database has become unreadable.
 */
const VECTOR_KEY_B64 = 'AAECAwQFBgcICQoLDA0ODxAREhMUFRYXGBkaGxwdHh8=';
const VECTOR_PLAINTEXT = 'Ontmoet bij de meetup in Utrecht — wil praten over data-migraties.';
const VECTOR_CIPHERTEXT =
    'rolodink-enc:3wIioHfGzaxwgOu8icE9ut8w8S8iCsWgHaFZwy0+YoThHa4gJtGD/n3Ox/MAMBAJKdh/' +
    'XTtPX9lUuXid5fsuBszcWcWVRfIva42uXMtkosAVqU6BgiT1zuQufAwBfjrx';

async function randomKey(): Promise<CryptoKey> {
    const bytes = crypto.getRandomValues(new Uint8Array(32));
    let binary = '';
    for (const byte of bytes) binary += String.fromCodePoint(byte);
    return importDataKey(btoa(binary));
}

describe('isEncryptedString', () => {
    it('recognises the prefix', () => {
        expect(isEncryptedString(`${ENCRYPTION_PREFIX}abc`)).toBe(true);
    });

    it('treats unprefixed values as legacy plaintext', () => {
        expect(isEncryptedString('gewone notitie')).toBe(false);
        expect(isEncryptedString('')).toBe(false);
        expect(isEncryptedString(null)).toBe(false);
        expect(isEncryptedString(undefined)).toBe(false);
    });
});

describe('wire-format compatibility with the extension', () => {
    it('decrypts a ciphertext produced by the extension helper', async () => {
        const key = await importDataKey(VECTOR_KEY_B64);
        await expect(decryptText(VECTOR_CIPHERTEXT, key)).resolves.toBe(VECTOR_PLAINTEXT);
    });

    it('rejects a value with plaintext appended, the shape the old note card produced', async () => {
        const key = await importDataKey(VECTOR_KEY_B64);
        await expect(decryptText(`${VECTOR_CIPHERTEXT}hello`, key)).rejects.toThrow();
    });

    it('rejects a ciphertext under the wrong key', async () => {
        const otherKey = await randomKey();
        await expect(decryptText(VECTOR_CIPHERTEXT, otherKey)).rejects.toThrow();
    });
});

describe('encryptText / decryptText', () => {
    it('round-trips', async () => {
        const key = await randomKey();
        const encrypted = await encryptText('koffie gehad, wil intro naar Sanne', key);
        expect(encrypted.startsWith(ENCRYPTION_PREFIX)).toBe(true);
        await expect(decryptText(encrypted, key)).resolves.toBe('koffie gehad, wil intro naar Sanne');
    });

    it('round-trips non-ASCII and emoji', async () => {
        const key = await randomKey();
        const text = 'Ontmoet in Kraków — 🎉 João & Ægir';
        await expect(decryptText(await encryptText(text, key), key)).resolves.toBe(text);
    });

    it('round-trips an empty string', async () => {
        const key = await randomKey();
        await expect(decryptText(await encryptText('', key), key)).resolves.toBe('');
    });

    it('uses a fresh IV, so the same text encrypts differently each time', async () => {
        const key = await randomKey();
        const a = await encryptText('zelfde tekst', key);
        const b = await encryptText('zelfde tekst', key);
        expect(a).not.toBe(b);
        await expect(decryptText(a, key)).resolves.toBe('zelfde tekst');
        await expect(decryptText(b, key)).resolves.toBe('zelfde tekst');
    });

    it('passes unprefixed values through untouched', async () => {
        const key = await randomKey();
        await expect(decryptText('legacy plaintext note', key)).resolves.toBe('legacy plaintext note');
    });

    it('prepends a 12-byte IV to the ciphertext', async () => {
        const key = await randomKey();
        const encrypted = await encryptText('x', key);
        const raw = atob(encrypted.slice(ENCRYPTION_PREFIX.length));
        // 12-byte IV + 1 byte of ciphertext + 16-byte GCM tag.
        expect(raw.length).toBe(12 + 1 + 16);
    });
});
