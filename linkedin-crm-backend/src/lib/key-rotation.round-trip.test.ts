import { describe, expect, it, vi } from 'vitest';
import { randomBytes } from 'crypto';

// A wrap that produces something the next key cannot open. It cannot happen
// with the real AES-GCM, which is exactly why rewrapUserKeys checks it anyway:
// this file proves that check is there and stops the write.
vi.mock('./envelope', async (importOriginal) => {
    const actual = await importOriginal<typeof import('./envelope')>();
    return { ...actual, wrapDataKey: () => randomBytes(60).toString('base64') };
});

import { ENVELOPE_VERSION } from './envelope';
import * as envelope from './envelope';
import { rewrapUserKeys } from './key-rotation';

describe('rewrapUserKeys round-trip check', () => {
    it('writes nothing when the new wrapping does not open to the same data key', async () => {
        const current = randomBytes(32);
        const next = randomBytes(32);
        const actual = await vi.importActual<typeof envelope>('./envelope');
        const stored = actual.wrapDataKey(randomBytes(32), current);
        const compareAndSetKey = vi.fn(async () => 1);

        const report = await rewrapUserKeys(
            {
                listUserKeys: async () => [{ user_id: 'u1', encrypted_key: stored, salt: ENVELOPE_VERSION }],
                compareAndSetKey,
            },
            current,
            next
        );

        expect(report.failed).toEqual([{ userId: 'u1', reason: 'round-trip' }]);
        expect(compareAndSetKey).not.toHaveBeenCalled();
    });
});
