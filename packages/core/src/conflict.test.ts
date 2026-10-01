import { describe, expect, it } from 'vitest';
import { CONNECTION_CONFLICT_CODE, readConflict, versionOf, withExpectedVersion } from './conflict.js';
import { ConnectionConflictError, DuplicateConnectionError, RolodinkClient } from './client.js';

const current = { id: 'c1', notes: 'rolodink-enc:x', updatedAt: '2026-09-30T12:34:56.789Z' };

describe('readConflict', () => {
    it('returns the current row of a version conflict', () => {
        expect(readConflict(409, { error: 'conflict', code: CONNECTION_CONFLICT_CODE, current })).toBe(current);
    });

    it.each([
        ['the duplicate-URL 409', 409, { error: 'Connectie bestaat al voor deze URL.' }],
        ['another status', 403, { code: CONNECTION_CONFLICT_CODE, current }],
        ['a conflict without a row', 409, { code: CONNECTION_CONFLICT_CODE, current: null }],
        ['a row without an id', 409, { code: CONNECTION_CONFLICT_CODE, current: { notes: 'x' } }],
        ['no body', 409, null],
    ])('is null for %s', (_label, status, body) => {
        expect(readConflict(status, body)).toBeNull();
    });
});

describe('versionOf', () => {
    it('reads the string the API sent, unchanged', () => {
        expect(versionOf(current)).toBe('2026-09-30T12:34:56.789Z');
    });

    it.each([null, undefined, {}, { updatedAt: '' }, { updatedAt: 42 }])('is null for %j', (row) => {
        expect(versionOf(row)).toBeNull();
    });
});

describe('withExpectedVersion', () => {
    it('adds the version when there is one', () => {
        expect(withExpectedVersion({ id: 'c1', notes: 'n' }, current.updatedAt)).toEqual({
            id: 'c1',
            notes: 'n',
            expectedUpdatedAt: current.updatedAt,
        });
    });

    it('leaves the body unconditional without one', () => {
        expect(withExpectedVersion({ id: 'c1' }, null)).toEqual({ id: 'c1' });
        expect(withExpectedVersion({ id: 'c1' }, undefined)).toEqual({ id: 'c1' });
    });
});

describe('RolodinkClient.updateConnection', () => {
    const client = (status: number, body: unknown, sent: unknown[]) =>
        new RolodinkClient({
            baseUrl: 'https://api.example.test',
            getAccessToken: async () => 'token',
            fetch: async (_url, init) => {
                sent.push(JSON.parse(String(init?.body)));
                return new Response(JSON.stringify(body), { status });
            },
        });

    it('sends the expected version and throws ConnectionConflictError with the current row', async () => {
        const sent: unknown[] = [];
        const api = client(409, { error: 'conflict', code: CONNECTION_CONFLICT_CODE, current }, sent);

        const error = await api
            .updateConnection('c1', { notes: 'n', expectedUpdatedAt: '2026-09-30T12:00:00.000Z' })
            .catch((e: unknown) => e);

        expect(sent).toEqual([{ id: 'c1', notes: 'n', expectedUpdatedAt: '2026-09-30T12:00:00.000Z' }]);
        expect(error).toBeInstanceOf(ConnectionConflictError);
        expect((error as ConnectionConflictError).current).toEqual(current);
    });

    it('still reads a 409 without the conflict code as a duplicate URL', async () => {
        const api = client(409, { error: 'Connectie bestaat al voor deze URL.' }, []);

        await expect(api.updateConnection('c1', { notes: 'n' })).rejects.toBeInstanceOf(DuplicateConnectionError);
    });
});
