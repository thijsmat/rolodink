/**
 * One GET per profile visit, not two.
 *
 * On every profile the "Add to Rldnk" button and the note card each ask the API
 * whether this profile is in the CRM: the button to say "Already added", the
 * card to load the note. Same path, same `?url=`, a few milliseconds apart -
 * two round-trips through the service worker and two hits on a per-IP rate
 * limit, for one answer.
 *
 * This shares a request only while it is **in flight**. The entry goes the
 * moment it settles, whatever the outcome, so nothing here is a cache:
 *
 *  - a 401, 429 or 5xx is never replayed to a later caller - a Retry on the
 *    card asks the server again, which is the point of a Retry;
 *  - no answer outlives its request, so no notes, no ciphertext and no
 *    connection id sit in memory beyond what the callers themselves hold;
 *  - a later check after a navigation back, or after the popup changed the
 *    connection, sees the server as it is then.
 *
 * Deliberately not used on the save path: finding the connection id before a
 * save is always a fresh GET (selector-invariants.test.ts pins
 * `findConnectionId(cardUrl)`), because an answer that started before the user
 * typed can predate a connection another tab has just created.
 */

export type SharedRequest<T> = (key: string, request: () => Promise<T>) => Promise<T>;

export function createInFlightSharing<T>(): SharedRequest<T> {
    const inFlight = new Map<string, Promise<T>>();

    return (key, request) => {
        const running = inFlight.get(key);
        if (running) return running;

        // Through a then, so a request that throws synchronously becomes a
        // rejected promise like any other failure, and still gets cleaned up.
        const pending = Promise.resolve().then(request);
        inFlight.set(key, pending);
        // Only our own entry: by the time this runs a newer request for the
        // same key may have taken the slot. The catch is for the chain that
        // finally() returns, which rejects along with `pending` and would
        // otherwise surface as an unhandled rejection; the caller still gets
        // the original rejection through `pending` itself.
        void pending
            .finally(() => {
                if (inFlight.get(key) === pending) inFlight.delete(key);
            })
            .catch(() => undefined);
        return pending;
    };
}
