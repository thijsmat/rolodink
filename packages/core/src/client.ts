/**
 * HTTP client for the Rolodink API.
 *
 * Reads no environment variables, ever: Vite only exposes `VITE_*` and Next
 * only exposes `NEXT_PUBLIC_*`, so a package used by both cannot straddle that.
 * The host injects `baseUrl` and `getAccessToken` instead.
 *
 * It also hides two quirks of the current API so no caller has to learn them:
 * PATCH takes the id in the body, and the Zod schema rejects `null`.
 */

import type { Connection, ConnectionInput, ConnectionPatch } from './types.js';
import { buildLookupCandidates } from './url.js';

export class RolodinkApiError extends Error {
    readonly status: number;
    readonly body: unknown;

    constructor(message: string, status: number, body: unknown) {
        super(message);
        this.name = 'RolodinkApiError';
        this.status = status;
        this.body = body;
    }
}

/** 401 — the access token is missing, expired or rejected. */
export class UnauthorizedError extends RolodinkApiError {
    constructor(body: unknown) {
        super('Not signed in', 401, body);
        this.name = 'UnauthorizedError';
    }
}

/** 409 — a connection for this LinkedIn URL already exists. */
export class DuplicateConnectionError extends RolodinkApiError {
    constructor(body: unknown) {
        super('A connection with this LinkedIn URL already exists', 409, body);
        this.name = 'DuplicateConnectionError';
    }
}

/** 429 — the shared per-IP budget is exhausted. Likely on carrier NAT. */
export class RateLimitedError extends RolodinkApiError {
    readonly retryAfterSeconds: number | null;

    constructor(body: unknown, retryAfterSeconds: number | null) {
        super('Too many requests', 429, body);
        this.name = 'RateLimitedError';
        this.retryAfterSeconds = retryAfterSeconds;
    }
}

export interface RolodinkClientOptions {
    /** e.g. `https://api.rolodink.app`, without a trailing slash. */
    baseUrl: string;
    /** Returns the current Supabase access token, or null when signed out. */
    getAccessToken: () => Promise<string | null>;
    /** Injectable for tests. */
    fetch?: typeof globalThis.fetch;
}

/**
 * Drops undefined values and converts null to '' — the server validates with
 * `z.string().optional()`, which rejects null outright, so clearing a field has
 * to be an empty string.
 */
function toPatchBody(patch: ConnectionPatch): Record<string, string> {
    const body: Record<string, string> = {};

    for (const [key, value] of Object.entries(patch)) {
        if (value === undefined) continue;
        body[key] = value === null ? '' : String(value);
    }

    return body;
}

/** The API returns an array for list/filter calls and an object for single reads. */
function pickFirstConnection(payload: unknown): Connection | null {
    if (Array.isArray(payload)) {
        return (payload[0] as Connection | undefined) ?? null;
    }
    if (payload && typeof payload === 'object' && 'id' in payload) {
        return payload as Connection;
    }
    return null;
}

export class RolodinkClient {
    private readonly baseUrl: string;
    private readonly getAccessToken: () => Promise<string | null>;
    private readonly fetchImpl: typeof globalThis.fetch;

    constructor(options: RolodinkClientOptions) {
        this.baseUrl = options.baseUrl.replace(/\/+$/, '');
        this.getAccessToken = options.getAccessToken;
        this.fetchImpl = options.fetch ?? globalThis.fetch.bind(globalThis);
    }

    private async request<T>(path: string, init: RequestInit = {}): Promise<T> {
        const token = await this.getAccessToken();

        const headers = new Headers(init.headers);
        headers.set('Accept', 'application/json');
        if (init.body) headers.set('Content-Type', 'application/json');
        if (token) headers.set('Authorization', `Bearer ${token}`);

        const response = await this.fetchImpl(`${this.baseUrl}${path}`, {
            ...init,
            headers,
            // Bearer auth only. Sending cookies cross-origin would require
            // Access-Control-Allow-Credentials, which the backend sets to false.
            credentials: 'omit',
        });

        const raw = await response.text();
        let body: unknown = null;
        if (raw) {
            try {
                body = JSON.parse(raw);
            } catch {
                body = raw;
            }
        }

        if (response.ok) return body as T;

        if (response.status === 401) throw new UnauthorizedError(body);
        if (response.status === 409) throw new DuplicateConnectionError(body);
        if (response.status === 429) {
            const retryAfter = Number(response.headers.get('Retry-After'));
            throw new RateLimitedError(body, Number.isFinite(retryAfter) ? retryAfter : null);
        }

        // Some server messages are Dutch and user-facing copy should not use
        // them raw, so callers get the status and body rather than a message.
        throw new RolodinkApiError(`Request failed with status ${response.status}`, response.status, body);
    }

    /** Every connection the signed-in user owns. The API has no pagination. */
    async listConnections(): Promise<Connection[]> {
        const payload = await this.request<Connection[]>('/api/connections');
        return Array.isArray(payload) ? payload : [];
    }

    /**
     * Looks up a connection by LinkedIn URL.
     *
     * The server does NOT normalize the `url` query parameter — it is an exact
     * string match — so each plausible normalization is tried in turn. A miss
     * here is not proof the contact is absent: fall back to matching on the
     * profile slug against the locally cached list.
     */
    async findByUrl(rawUrl: string): Promise<Connection | null> {
        for (const candidate of buildLookupCandidates(rawUrl)) {
            const payload = await this.request<unknown>(
                `/api/connections?url=${encodeURIComponent(candidate)}`
            );
            const found = pickFirstConnection(payload);
            if (found) return found;
        }
        return null;
    }

    /** Creates a connection. Throws DuplicateConnectionError on 409. */
    async createConnection(input: ConnectionInput): Promise<Connection> {
        return this.request<Connection>('/api/connections', {
            method: 'POST',
            body: JSON.stringify(input),
        });
    }

    /** Updates a connection. The id goes in the body — that is the API's shape, not a typo. */
    async updateConnection(id: string, patch: ConnectionPatch): Promise<Connection> {
        return this.request<Connection>('/api/connections', {
            method: 'PATCH',
            body: JSON.stringify({ id, ...toPatchBody(patch) }),
        });
    }

    async deleteConnection(id: string): Promise<void> {
        await this.request<unknown>(`/api/connections/${encodeURIComponent(id)}`, {
            method: 'DELETE',
        });
    }

    /**
     * The raw base64 data key for this user.
     *
     * Import it with `importDataKey` and discard the base64 immediately —
     * keeping it around, or persisting it, is what the non-extractable
     * CryptoKey is meant to avoid.
     */
    async getDataKey(): Promise<string> {
        const payload = await this.request<{ data_key: string }>('/api/user/key');
        if (!payload?.data_key) {
            throw new RolodinkApiError('Response did not contain a data key', 200, payload);
        }
        return payload.data_key;
    }
}
