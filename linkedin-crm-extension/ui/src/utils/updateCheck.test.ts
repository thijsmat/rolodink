import { describe, expect, it } from 'vitest';
import {
    UPDATE_CHECK_INTERVAL_MS,
    compareVersions,
    isStaleUpdate,
    shouldCheckForUpdates,
} from './updateCheck';
import updateContextSource from '../context/UpdateContext.tsx?raw';

describe('compareVersions', () => {
    it('compares numerically, not as text', () => {
        expect(compareVersions('1.3.10', '1.3.9')).toBe(1);
        expect(compareVersions('1.3.7', '1.3.7')).toBe(0);
        expect(compareVersions('1.2.9', '1.3.0')).toBe(-1);
        expect(compareVersions('1.3', '1.3.0')).toBe(0);
    });
});

describe('isStaleUpdate', () => {
    it('drops a banner for a version that is already installed', () => {
        expect(isStaleUpdate('1.3.7', '1.3.7')).toBe(true);
        expect(isStaleUpdate('1.3.8', '1.3.7')).toBe(true);
    });

    it('keeps a banner for a newer version', () => {
        expect(isStaleUpdate('1.3.7', '1.3.8')).toBe(false);
        expect(isStaleUpdate('1.3.7', undefined)).toBe(false);
    });
});

describe('shouldCheckForUpdates', () => {
    const now = 1_000_000_000_000;

    it('checks when it never checked', () => {
        expect(shouldCheckForUpdates({}, '1.3.7', now)).toBe(true);
    });

    it('does not check again within a day when there was no update', () => {
        // The bug: lastUpdateCheck was only written when an update existed, so
        // this case always checked.
        expect(shouldCheckForUpdates({ lastUpdateCheck: now - 60_000, lastCheckedVersion: '1.3.7' }, '1.3.7', now)).toBe(false);
    });

    it('checks again after a day', () => {
        expect(shouldCheckForUpdates(
            { lastUpdateCheck: now - UPDATE_CHECK_INTERVAL_MS - 1, lastCheckedVersion: '1.3.7' },
            '1.3.7',
            now,
        )).toBe(true);
    });

    it('checks at once after the extension itself was updated', () => {
        expect(shouldCheckForUpdates({ lastUpdateCheck: now - 60_000, lastCheckedVersion: '1.3.6' }, '1.3.7', now)).toBe(true);
    });
});

describe('UpdateContext', () => {
    const code = updateContextSource.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');

    it('reaches the platform through getBrowserAPI, not a bare chrome.*', () => {
        expect(code).toContain('getBrowserAPI');
        expect(code).not.toMatch(/\bchrome\.\w/);
    });

    it('records every successful check, not only the ones that found an update', () => {
        expect(code).toMatch(/lastUpdateCheck:\s*Date\.now\(\)/);
        expect(code).toContain('lastCheckedVersion');
        expect(code).toContain('shouldCheckForUpdates(');
    });
});
