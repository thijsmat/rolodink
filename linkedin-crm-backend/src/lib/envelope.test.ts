import { describe, it, expect } from 'vitest';
import { randomBytes } from 'crypto';
import { wrapDataKey, unwrapDataKey, generateDataKey } from './envelope';

/**
 * These tests guard the code that unwraps every user's data key. The one that
 * matters most is the fixed vector: it was generated with the implementation
 * as it existed BEFORE `authTagLength: 16` was pinned on `createDecipheriv`,
 * so it proves that every wrapped key already sitting in `user_keys` stays
 * readable. If a change to this file ever fails that test, the change orphans
 * production data - do not "update the vector", fix the change.
 */

// Deterministic inputs: masterKey = 0x07 x32, dataKey = bytes 00..1f, iv = 0x03 x12.
const VECTOR_MASTER_KEY = Buffer.from('BwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwc=', 'base64');
const VECTOR_DATA_KEY = Buffer.from('AAECAwQFBgcICQoLDA0ODxAREhMUFRYXGBkaGxwdHh8=', 'base64');
const VECTOR_WRAPPED =
    'AwMDAwMDAwMDAwMDu/+f6f4nwzrGhOlV2n5HwCX/oQBeLVhFcklJV+da8QP9LfL8oICCZzfHnar/+F6n';

describe('unwrapDataKey', () => {
    it('still reads a blob written by the pre-authTagLength implementation', () => {
        expect(unwrapDataKey(VECTOR_WRAPPED, VECTOR_MASTER_KEY).equals(VECTOR_DATA_KEY)).toBe(true);
    });

    it('round-trips what wrapDataKey produces today', () => {
        const masterKey = randomBytes(32);
        const dataKey = generateDataKey();
        expect(unwrapDataKey(wrapDataKey(dataKey, masterKey), masterKey).equals(dataKey)).toBe(true);
    });

    it('rejects a blob shorter than iv + tag', () => {
        // 27 bytes is one short of the 12-byte IV plus 16-byte tag minimum.
        const short = randomBytes(27).toString('base64');
        expect(() => unwrapDataKey(short, randomBytes(32))).toThrow('Invalid wrapped key length');
    });

    it('rejects a tampered auth tag', () => {
        const masterKey = randomBytes(32);
        const blob = Buffer.from(wrapDataKey(generateDataKey(), masterKey), 'base64');
        const tampered = Buffer.concat([blob.subarray(0, 12), randomBytes(16), blob.subarray(28)]);
        expect(() => unwrapDataKey(tampered.toString('base64'), masterKey)).toThrow();
    });

    it('rejects the wrong master key', () => {
        const wrapped = wrapDataKey(generateDataKey(), randomBytes(32));
        expect(() => unwrapDataKey(wrapped, randomBytes(32))).toThrow();
    });

    it('rejects tampered ciphertext', () => {
        const masterKey = randomBytes(32);
        const blob = Buffer.from(wrapDataKey(generateDataKey(), masterKey), 'base64');
        blob[blob.length - 1] ^= 0xff; // flip bits in the last ciphertext byte
        expect(() => unwrapDataKey(blob.toString('base64'), masterKey)).toThrow();
    });
});
