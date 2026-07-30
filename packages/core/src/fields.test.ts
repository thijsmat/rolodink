import { describe, it, expect, vi } from 'vitest';
import {
    SENSITIVE_FIELDS,
    encryptSensitiveFields,
    decryptSensitiveFields,
    decryptMany,
    buildSearchHaystack,
    type FieldCipher,
} from './fields.js';
import { ENCRYPTION_PREFIX } from './crypto.js';

/** Reversible stand-in for AES-GCM: keeps the tests about field logic, not crypto. */
const fakeCipher: FieldCipher = {
    encrypt: async (plaintext) => `${ENCRYPTION_PREFIX}${btoa(plaintext)}`,
    decrypt: async (ciphertext) => atob(ciphertext.slice(ENCRYPTION_PREFIX.length)),
};

const failingCipher: FieldCipher = {
    encrypt: async () => {
        throw new Error('no key');
    },
    decrypt: async () => {
        throw new Error('cannot decrypt');
    },
};

describe('SENSITIVE_FIELDS', () => {
    it('matches the list the extension and backend audit use', () => {
        expect([...SENSITIVE_FIELDS]).toEqual([
            'notes',
            'meetingPlace',
            'userCompanyAtTheTime',
            'email',
            'phone',
        ]);
    });

    it('excludes name and linkedInUrl, which must stay queryable', () => {
        expect(SENSITIVE_FIELDS).not.toContain('name');
        expect(SENSITIVE_FIELDS).not.toContain('linkedInUrl');
    });
});

describe('encryptSensitiveFields', () => {
    it('encrypts sensitive fields and leaves the rest alone', async () => {
        const result = await encryptSensitiveFields(
            {
                name: 'Jan Jansen',
                linkedInUrl: 'https://www.linkedin.com/in/jan-jansen',
                notes: 'koffie gehad',
                meetingPlace: 'Utrecht',
            },
            fakeCipher
        );

        expect(result.name).toBe('Jan Jansen');
        expect(result.linkedInUrl).toBe('https://www.linkedin.com/in/jan-jansen');
        expect(result.notes).toBe(`${ENCRYPTION_PREFIX}${btoa('koffie gehad')}`);
        expect(result.meetingPlace).toBe(`${ENCRYPTION_PREFIX}${btoa('Utrecht')}`);
    });

    it('leaves empty, null and undefined values as they are', async () => {
        const result = await encryptSensitiveFields(
            { notes: '', meetingPlace: null, email: undefined },
            fakeCipher
        );
        expect(result).toEqual({ notes: '', meetingPlace: null, email: undefined });
    });

    it('does not mutate its input', async () => {
        const input = { notes: 'origineel' };
        await encryptSensitiveFields(input, fakeCipher);
        expect(input.notes).toBe('origineel');
    });

    it('throws rather than saving one field as plaintext', async () => {
        // A partial write is what left notes unreadable in the first place.
        await expect(encryptSensitiveFields({ notes: 'geheim' }, failingCipher)).rejects.toThrow('no key');
    });
});

describe('decryptSensitiveFields', () => {
    it('decrypts prefixed values', async () => {
        const result = await decryptSensitiveFields(
            { notes: `${ENCRYPTION_PREFIX}${btoa('koffie gehad')}` },
            fakeCipher
        );
        expect(result.notes).toBe('koffie gehad');
    });

    it('passes legacy plaintext through, so old rows stay readable', async () => {
        const decrypt = vi.fn();
        const result = await decryptSensitiveFields(
            { notes: 'notitie uit een oudere versie' },
            { encrypt: fakeCipher.encrypt, decrypt }
        );
        expect(result.notes).toBe('notitie uit een oudere versie');
        expect(decrypt).not.toHaveBeenCalled();
    });

    it('throws by default when a prefixed value cannot be decrypted', async () => {
        await expect(
            decryptSensitiveFields({ notes: `${ENCRYPTION_PREFIX}corrupt` }, failingCipher)
        ).rejects.toThrow('cannot decrypt');
    });

    it('reports and nulls the field when onError is supplied', async () => {
        const onError = vi.fn();
        const result = await decryptSensitiveFields(
            { name: 'Jan Jansen', notes: `${ENCRYPTION_PREFIX}corrupt` },
            failingCipher,
            { onError }
        );

        // The row still renders; only the unreadable field is dropped.
        expect(result.notes).toBeNull();
        expect(result.name).toBe('Jan Jansen');
        expect(onError).toHaveBeenCalledOnce();
        expect(onError.mock.calls[0]?.[0]).toBe('notes');
    });
});

describe('decryptMany', () => {
    it('decrypts every row', async () => {
        const rows = [
            { notes: `${ENCRYPTION_PREFIX}${btoa('een')}` },
            { notes: `${ENCRYPTION_PREFIX}${btoa('twee')}` },
        ];
        const result = await decryptMany(rows, fakeCipher);
        expect(result.map((row) => row.notes)).toEqual(['een', 'twee']);
    });

    it('does not let one bad row fail the batch', async () => {
        const onError = vi.fn();
        const rows = [{ notes: 'plaintext' }, { notes: `${ENCRYPTION_PREFIX}corrupt` }];
        const result = await decryptMany(rows, failingCipher, { onError });
        expect(result[0]?.notes).toBe('plaintext');
        expect(result[1]?.notes).toBeNull();
    });
});

describe('buildSearchHaystack', () => {
    it('includes the name and the decrypted fields', () => {
        const haystack = buildSearchHaystack({
            name: 'Jan Jansen',
            notes: 'Wil praten over data-migraties',
            meetingPlace: 'Meetup Utrecht',
        });

        expect(haystack).toContain('jan jansen');
        expect(haystack).toContain('data-migraties');
        expect(haystack).toContain('meetup utrecht');
    });

    it('omits values that are still ciphertext', () => {
        // Searching raw ciphertext would produce nonsense matches.
        const haystack = buildSearchHaystack({
            name: 'Jan Jansen',
            notes: `${ENCRYPTION_PREFIX}AbCdEf`,
        });

        expect(haystack).toContain('jan jansen');
        expect(haystack).not.toContain('abcdef');
    });

    it('does not run words together across fields', () => {
        const haystack = buildSearchHaystack({ name: 'Jan', notes: 'Jansen' });
        expect(haystack).not.toContain('janjansen');
    });
});
