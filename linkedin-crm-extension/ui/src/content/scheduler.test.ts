import { describe, expect, it } from 'vitest';
import { createInjectionScheduler, type Timers } from './scheduler';

/**
 * Flush every pending microtask.
 *
 * The scheduler's cooldown is armed from a `.then()`, so a run that resolves
 * synchronously still lands its follow-up work a couple of microtask hops
 * later. Real timers are untouched by these tests — only the scheduler's
 * injected ones are fake — so a zero-delay macrotask is the reliable drain.
 */
const flushMicrotasks = () => new Promise((resolve) => setTimeout(resolve, 0));

/**
 * A deterministic clock. Tasks fire in time order, ties broken by scheduling
 * order, and microtasks are drained between every one of them so an async run
 * settles before the next timer fires.
 */
class FakeClock {
    now = 0;
    private seq = 0;
    private tasks: Array<{ id: number; at: number; fn: () => void }> = [];

    readonly timers: Timers = {
        setTimeout: (fn, ms) => {
            const id = ++this.seq;
            this.tasks.push({ id, at: this.now + ms, fn });
            return id;
        },
        clearTimeout: (handle) => {
            this.tasks = this.tasks.filter((task) => task.id !== handle);
        },
    };

    get pendingCount() {
        return this.tasks.length;
    }

    async advance(ms: number) {
        const target = this.now + ms;
        for (;;) {
            await flushMicrotasks();
            const due = this.tasks
                .filter((task) => task.at <= target)
                .sort((a, b) => a.at - b.at || a.id - b.id)[0];
            if (!due) break;
            this.tasks = this.tasks.filter((task) => task !== due);
            this.now = due.at;
            due.fn();
        }
        this.now = target;
        await flushMicrotasks();
    }
}

/** Options that park the heartbeat out of the way, for the throttling tests. */
const noHeartbeat = { settlingIntervalMs: 1_000_000, idleIntervalMs: 1_000_000 };

describe('createInjectionScheduler', () => {
    it('runs the first request immediately', () => {
        const clock = new FakeClock();
        let runs = 0;
        const scheduler = createInjectionScheduler({
            run: () => { runs++; },
            timers: clock.timers,
            ...noHeartbeat,
        });

        scheduler.request();
        expect(runs).toBe(1);
        scheduler.stop();
    });

    it('remembers a request made during the cooldown instead of dropping it', async () => {
        const clock = new FakeClock();
        let runs = 0;
        const scheduler = createInjectionScheduler({
            run: () => { runs++; },
            cooldownMs: 500,
            timers: clock.timers,
            ...noHeartbeat,
        });

        scheduler.request();
        expect(runs).toBe(1);

        // The mutation burst that LinkedIn produces while it renders the hero.
        // The old `if (isChecking) return;` threw every one of these away.
        await clock.advance(100);
        for (let i = 0; i < 20; i++) scheduler.request();
        expect(runs).toBe(1); // still cooling: correctly throttled, not yet lost

        await clock.advance(500);
        expect(runs).toBe(2); // ...and the burst is honoured once the gap allows

        scheduler.stop();
    });

    it('coalesces a burst into exactly one follow-up run', async () => {
        const clock = new FakeClock();
        let runs = 0;
        const scheduler = createInjectionScheduler({
            run: () => { runs++; },
            cooldownMs: 500,
            timers: clock.timers,
            ...noHeartbeat,
        });

        scheduler.request();
        for (let i = 0; i < 50; i++) scheduler.request();
        await clock.advance(10_000);

        // One for the burst, and one more because that follow-up run is itself
        // followed by a cooldown with nothing pending. Not 51.
        expect(runs).toBe(2);
        scheduler.stop();
    });

    it('keeps checking after the mutations stop', async () => {
        const clock = new FakeClock();
        let runs = 0;
        const scheduler = createInjectionScheduler({
            run: () => { runs++; },
            cooldownMs: 100,
            settlingIntervalMs: 1_000,
            settlingTicks: 30,
            idleIntervalMs: 5_000,
            timers: clock.timers,
        });

        // Nobody ever calls request(). This is the page going quiet, which is
        // exactly when the old loop stopped looking - and exactly when the hero
        // has finally finished rendering.
        await clock.advance(5_000);
        expect(runs).toBeGreaterThanOrEqual(4);

        scheduler.stop();
    });

    it('drops to the idle interval once the page has settled, but never to zero', async () => {
        const clock = new FakeClock();
        let runs = 0;
        const scheduler = createInjectionScheduler({
            run: () => { runs++; },
            cooldownMs: 10,
            settlingIntervalMs: 1_000,
            settlingTicks: 3,
            idleIntervalMs: 5_000,
            timers: clock.timers,
        });

        await clock.advance(3_000);
        const settling = runs;
        expect(settling).toBe(3);

        // Four more settling intervals would have been four more runs. At the
        // idle rate it is zero so far...
        await clock.advance(4_000);
        expect(runs).toBe(settling);

        // ...and one at the five-second mark. Slow, but never stopped: this is
        // what repairs an injection that LinkedIn re-rendered away.
        await clock.advance(1_500);
        expect(runs).toBe(settling + 1);

        scheduler.stop();
    });

    it('goes back to the fast rate on restart', async () => {
        const clock = new FakeClock();
        let runs = 0;
        const scheduler = createInjectionScheduler({
            run: () => { runs++; },
            cooldownMs: 10,
            settlingIntervalMs: 1_000,
            settlingTicks: 2,
            idleIntervalMs: 60_000,
            timers: clock.timers,
        });

        await clock.advance(10_000);
        const beforeRestart = runs;

        // SPA navigation to another profile: the new page needs the same close
        // attention the first one got.
        scheduler.restart();
        expect(runs).toBe(beforeRestart + 1); // immediate check

        await clock.advance(2_500);
        expect(runs).toBe(beforeRestart + 3);

        scheduler.stop();
    });

    it('never starts a run while one is still in flight', async () => {
        const clock = new FakeClock();
        let started = 0;
        // Not `(() => void) | null`: TypeScript narrows a nullable binding to
        // null when the only assignment happens inside a callback, and the
        // release call below then fails to typecheck.
        let release = () => {};
        const scheduler = createInjectionScheduler({
            run: () => {
                started++;
                return new Promise<void>((resolve) => { release = resolve; });
            },
            cooldownMs: 100,
            timers: clock.timers,
            ...noHeartbeat,
        });

        scheduler.request();
        expect(started).toBe(1);

        // A slow run is the realistic case: injectContextField awaits a storage
        // read and an API round-trip through the service worker.
        for (let i = 0; i < 10; i++) scheduler.request();
        await clock.advance(10_000);
        expect(started).toBe(1);

        release();
        await clock.advance(200);
        expect(started).toBe(2);

        scheduler.stop();
    });

    it('survives a run that throws', async () => {
        const clock = new FakeClock();
        let runs = 0;
        const scheduler = createInjectionScheduler({
            run: () => {
                runs++;
                throw new Error('boom');
            },
            cooldownMs: 100,
            settlingIntervalMs: 1_000,
            timers: clock.timers,
        });

        scheduler.request();
        expect(runs).toBe(1);

        // A wedged-shut scheduler after one bad check would be the same class of
        // bug this module exists to fix.
        await clock.advance(3_000);
        expect(runs).toBeGreaterThan(1);

        scheduler.stop();
    });

    it('survives a run whose promise rejects', async () => {
        const clock = new FakeClock();
        let runs = 0;
        const scheduler = createInjectionScheduler({
            run: async () => {
                runs++;
                throw new Error('boom');
            },
            cooldownMs: 100,
            settlingIntervalMs: 1_000,
            timers: clock.timers,
        });

        scheduler.request();
        await clock.advance(3_000);
        expect(runs).toBeGreaterThan(1);

        scheduler.stop();
    });

    it('stops for good, leaving no timer behind', async () => {
        const clock = new FakeClock();
        let runs = 0;
        const scheduler = createInjectionScheduler({
            run: () => { runs++; },
            cooldownMs: 100,
            settlingIntervalMs: 1_000,
            timers: clock.timers,
        });

        scheduler.request();
        const atStop = runs;
        scheduler.stop();

        scheduler.request();
        scheduler.restart();
        await clock.advance(60_000);

        expect(runs).toBe(atStop);
        expect(clock.pendingCount).toBe(0);
    });
});
