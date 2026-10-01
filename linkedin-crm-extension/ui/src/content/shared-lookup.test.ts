import { describe, expect, it, vi } from 'vitest';
import { createInFlightSharing } from './shared-lookup';
import { readNote, type ApiResponse } from './note-card';

/**
 * The button and the note card asking the same question once, not twice.
 *
 * main.js cannot be loaded here (it starts its observer on import and talks to
 * the extension platform), so this drives the helper the way main.js does:
 * lookupConnection shares one request between the button's check and the
 * card's readNote, and the worker is a fake that counts API_REQUEST messages.
 */

const WITH_NOTE: ApiResponse = {
    status: 200,
    ok: true,
    data: [{ id: 'conn-1', notes: 'rolodink-enc:ciphertext' }],
};
const RATE_LIMITED: ApiResponse = { status: 429, ok: false, data: { error: 'Rate limit exceeded' } };

/** A worker whose answers the test releases by hand, as a real round-trip would take a while. */
function fakeWorker() {
    const messages: Array<{ type: string; query?: { url: string } }> = [];
    const replies: Array<(response: ApiResponse) => void> = [];
    const sendApiRequest = (url: string) => {
        messages.push({ type: 'API_REQUEST', query: { url } });
        return new Promise<ApiResponse>((resolve) => { replies.push(resolve); });
    };
    return { messages, replies, sendApiRequest };
}

function setUp() {
    const worker = fakeWorker();
    const shared = createInFlightSharing<ApiResponse>();
    const lookupConnection = (url: string) => shared(url, () => worker.sendApiRequest(url));
    const decrypt = vi.fn(async () => 'the note');
    return { worker, lookupConnection, decrypt };
}

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

describe('one GET per profile visit', () => {
    it('sends one API_REQUEST for the button and the card together', async () => {
        const { worker, lookupConnection, decrypt } = setUp();
        const url = 'https://www.linkedin.com/in/tim-jansen';

        // The button's check and the card's load, in the same round.
        const button = lookupConnection(url);
        const card = readNote(() => lookupConnection(url), decrypt);
        await flush();

        expect(worker.messages).toHaveLength(1);
        worker.replies[0](WITH_NOTE);

        const buttonResponse = await button;
        expect(buttonResponse.ok).toBe(true);
        await expect(card).resolves.toEqual({
            state: 'loaded',
            status: 'Saved',
            connectionId: 'conn-1',
            updatedAt: null,
            text: 'the note',
        });
        expect(worker.messages).toHaveLength(1);
    });

    it('does not share between different profiles', async () => {
        const { worker, lookupConnection } = setUp();
        void lookupConnection('https://www.linkedin.com/in/a');
        void lookupConnection('https://www.linkedin.com/in/b');
        await flush();
        expect(worker.messages).toHaveLength(2);
    });

    it('keeps no finished answer: the next ask goes to the server again', async () => {
        const { worker, lookupConnection } = setUp();
        const url = 'https://www.linkedin.com/in/tim-jansen';

        const first = lookupConnection(url);
        await flush();
        worker.replies[0](WITH_NOTE);
        await first;
        await flush();

        // A later round, a Retry, a navigation back: a fresh request.
        void lookupConnection(url);
        await flush();
        expect(worker.messages).toHaveLength(2);
    });

    it('does not replay a 429 to a Retry', async () => {
        const { worker, lookupConnection, decrypt } = setUp();
        const url = 'https://www.linkedin.com/in/tim-jansen';

        const load = readNote(() => lookupConnection(url), decrypt);
        await flush();
        worker.replies[0](RATE_LIMITED);
        await expect(load).resolves.toMatchObject({ state: 'failed' });
        await flush();

        const retry = readNote(() => lookupConnection(url), decrypt);
        await flush();
        expect(worker.messages).toHaveLength(2);
        worker.replies[1](WITH_NOTE);
        await expect(retry).resolves.toMatchObject({ state: 'loaded' });
    });

    it('shares a rejection with every waiting caller, then forgets it', async () => {
        const shared = createInFlightSharing<string>();
        let calls = 0;
        let fail: (error: Error) => void = () => {};
        const request = () => {
            calls++;
            return new Promise<string>((_resolve, reject) => { fail = reject; });
        };

        const a = shared('k', request);
        const b = shared('k', request);
        await flush();
        expect(calls).toBe(1);

        fail(new Error('Geen antwoord van de achtergrondservice'));
        await expect(a).rejects.toThrow('Geen antwoord');
        await expect(b).rejects.toThrow('Geen antwoord');
        await flush();

        void shared('k', () => { calls++; return Promise.resolve('ok'); });
        await flush();
        expect(calls).toBe(2);
    });

    it('turns a request that throws synchronously into a rejection, and forgets it', async () => {
        const shared = createInFlightSharing<string>();
        const failing = shared('k', () => { throw new Error('Extensie-API niet beschikbaar'); });
        await expect(failing).rejects.toThrow('Extensie-API');
        await flush();

        await expect(shared('k', () => Promise.resolve('ok'))).resolves.toBe('ok');
    });
});
