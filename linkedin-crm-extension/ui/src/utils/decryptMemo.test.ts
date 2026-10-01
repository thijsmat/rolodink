import { beforeEach, describe, expect, it } from 'vitest';
import { DECRYPT_MEMO_LIMIT, clearDecryptMemo, decryptMemoSize, getDecrypted, rememberDecrypted } from './decryptMemo';

describe('the decryption memo', () => {
    beforeEach(() => clearDecryptMemo());

    it('answers only for the owner that decrypted the value', () => {
        rememberDecrypted('user-1', 'rolodink-enc:abc', 'note');

        expect(getDecrypted('user-1', 'rolodink-enc:abc')).toBe('note');
        expect(getDecrypted('user-2', 'rolodink-enc:abc')).toBeUndefined();
    });

    it('stays bounded and drops the least recently used value first', () => {
        for (let i = 0; i < DECRYPT_MEMO_LIMIT; i++) rememberDecrypted('user-1', `c${i}`, `p${i}`);
        // Reading c0 makes it recent, so c1 is now the oldest.
        expect(getDecrypted('user-1', 'c0')).toBe('p0');

        rememberDecrypted('user-1', 'new', 'value');

        expect(decryptMemoSize()).toBe(DECRYPT_MEMO_LIMIT);
        expect(getDecrypted('user-1', 'c0')).toBe('p0');
        expect(getDecrypted('user-1', 'c1')).toBeUndefined();
        expect(getDecrypted('user-1', 'new')).toBe('value');
    });

    it('is empty after clearing', () => {
        rememberDecrypted('user-1', 'c', 'p');
        clearDecryptMemo();

        expect(decryptMemoSize()).toBe(0);
        expect(getDecrypted('user-1', 'c')).toBeUndefined();
    });
});
