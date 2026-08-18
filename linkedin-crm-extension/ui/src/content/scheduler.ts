/**
 * When to re-check the page for a place to inject.
 *
 * This exists because of a bug that made the extension look broken on exactly
 * the profiles where it mattered. The old loop was:
 *
 *     let isChecking = false;
 *     new MutationObserver(() => checkAndInject());
 *     // inside checkAndInject:
 *     if (isChecking) return;
 *     isChecking = true;
 *     try { … } finally { setTimeout(() => { isChecking = false; }, 500); }
 *
 * Two faults, and they compound.
 *
 * **A dropped trailing edge.** Every observer callback arriving while the lock
 * is held is discarded, not queued. LinkedIn renders a profile in a burst of
 * mutations, so the mutations that add the hero card land inside a lock window
 * and are thrown away.
 *
 * **The observer is the only clock.** Once the burst ends the page goes quiet,
 * no further callbacks fire, and the final state of the DOM is never inspected.
 * Whatever the last executed check saw is what the user is left with.
 *
 * Together they produce the symptom measured on a live profile:
 * `knoppen: 1 | kaarten: 0` — a button injected into the 49px sticky header
 * during an early check (when the hero had not rendered, so the sticky header
 * was the tallest candidate available), and no note card at all, because by the
 * time injectContextField ran the header subtree had been replaced under it.
 * findProfileHeader picked the right card when probed by hand seconds later;
 * nothing was left running to act on that.
 *
 * So this module gives injection a clock of its own:
 *
 *  - a request that arrives during a run or its cooldown is **remembered**, and
 *    runs when the cooldown ends. Nothing is dropped;
 *  - a **heartbeat** keeps checking after the mutations stop — fast while the
 *    page is still settling, slow but never zero afterwards.
 *
 * The slow heartbeat is not belt-and-braces. It is also the repair for
 * LinkedIn re-rendering the hero and taking our nodes with it: injection is
 * idempotent (injectCRMButton returns early when its button is already in the
 * right row, relocateExistingCard moves an existing card rather than rebuilding
 * it), so a check that finds everything in place costs two DOM queries, and a
 * check that finds our work gone puts it back.
 *
 * Timers are injected so the whole state machine is testable without waiting in
 * real time — the same reason MeasureHeight is injected in anchors.ts.
 */

export interface Timers {
    setTimeout: (handler: () => void, timeout: number) => unknown;
    clearTimeout: (handle: unknown) => void;
}

const defaultTimers: Timers = {
    setTimeout: (handler, timeout) => globalThis.setTimeout(handler, timeout),
    clearTimeout: (handle) => globalThis.clearTimeout(handle as never),
};

export interface SchedulerOptions {
    /** The work. May be async; the next run never overlaps it. */
    run: () => unknown;
    /** Minimum gap between the end of one run and the start of the next. */
    cooldownMs?: number;
    /** Heartbeat interval while the page is still settling. */
    settlingIntervalMs?: number;
    /** How many heartbeats stay at the fast interval after a restart. */
    settlingTicks?: number;
    /** Heartbeat interval once the page has settled. Never zero: see above. */
    idleIntervalMs?: number;
    timers?: Timers;
}

export interface InjectionScheduler {
    /** Ask for a check. Safe to call at any rate; never dropped, never overlapping. */
    request(): void;
    /** A new page: go back to the fast heartbeat and check now. */
    restart(): void;
    /** Give up for good — the extension context died and nothing can run again. */
    stop(): void;
}

export function createInjectionScheduler(options: SchedulerOptions): InjectionScheduler {
    const {
        run,
        cooldownMs = 500,
        settlingIntervalMs = 1_000,
        settlingTicks = 30,
        idleIntervalMs = 5_000,
        timers = defaultTimers,
    } = options;

    let stopped = false;
    let busy = false;
    /** A request arrived while busy. The whole point: this is not a dropped tick. */
    let pending = false;
    let cooldownHandle: unknown = null;
    let heartbeatHandle: unknown = null;
    let ticksLeftAtSettlingRate = settlingTicks;

    const start = () => {
        if (stopped) return;
        busy = true;
        pending = false;
        let result: unknown;
        try {
            result = run();
        } catch {
            // A throwing run must not wedge the scheduler shut. The caller logs;
            // this layer only guarantees that another check will happen.
            result = undefined;
        }
        Promise.resolve(result)
            .catch(() => undefined)
            .then(() => {
                busy = false;
                if (stopped) return;
                cooldownHandle = timers.setTimeout(() => {
                    cooldownHandle = null;
                    if (pending) start();
                }, cooldownMs);
            });
    };

    const request = () => {
        if (stopped) return;
        if (busy || cooldownHandle !== null) {
            pending = true;
            return;
        }
        start();
    };

    const scheduleHeartbeat = () => {
        if (stopped) return;
        const interval = ticksLeftAtSettlingRate > 0 ? settlingIntervalMs : idleIntervalMs;
        heartbeatHandle = timers.setTimeout(() => {
            heartbeatHandle = null;
            if (ticksLeftAtSettlingRate > 0) ticksLeftAtSettlingRate--;
            request();
            scheduleHeartbeat();
        }, interval);
    };

    const restart = () => {
        if (stopped) return;
        ticksLeftAtSettlingRate = settlingTicks;
        // Re-arm rather than let the pending beat stand: after a long quiet
        // spell that beat is scheduled at the *idle* interval, so a scheduler
        // that only reset the counter would go on sleeping for another five
        // seconds on a page that has just changed under it.
        if (heartbeatHandle !== null) {
            timers.clearTimeout(heartbeatHandle);
            heartbeatHandle = null;
        }
        scheduleHeartbeat();
        request();
    };

    const stop = () => {
        stopped = true;
        pending = false;
        if (cooldownHandle !== null) timers.clearTimeout(cooldownHandle);
        if (heartbeatHandle !== null) timers.clearTimeout(heartbeatHandle);
        cooldownHandle = null;
        heartbeatHandle = null;
    };

    scheduleHeartbeat();
    return { request, restart, stop };
}
