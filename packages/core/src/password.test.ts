import { describe, it, expect } from 'vitest';
import { MIN_PASSWORD_LENGTH } from './password.js';

describe('MIN_PASSWORD_LENGTH', () => {
    it('is at least the 8 characters NIST recommends', () => {
        expect(MIN_PASSWORD_LENGTH).toBeGreaterThanOrEqual(8);
    });
});
