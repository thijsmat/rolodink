/** Mirrors the `Connection` model in linkedin-crm-backend/prisma/schema.prisma. */
export interface Connection {
    id: string;
    /** Plaintext — needed for the `?url=` lookup, the unique constraint and search. */
    name: string;
    /** Plaintext, normalized. Never overwrite this: it is the extension's only lookup key. */
    linkedInUrl: string;
    ownerId: string;
    notes: string | null;
    meetingPlace: string | null;
    userCompanyAtTheTime: string | null;
    email: string | null;
    phone: string | null;
    createdAt: string;
    updatedAt: string;
}

/**
 * Body for `POST /api/connections`. Note the field is `url`, not `linkedInUrl`
 * — the server renames it on the way in.
 */
export interface ConnectionInput {
    name: string;
    url: string;
    meetingPlace?: string;
    notes?: string;
    userCompanyAtTheTime?: string;
    email?: string;
    phone?: string;
}

/**
 * Body for `PATCH /api/connections` minus the id, which the client adds.
 *
 * `url` is deliberately absent: rewriting `linkedInUrl` would break the
 * extension's lookup and can collide with the `[ownerId, linkedInUrl]` unique
 * constraint.
 *
 * The server validates with `z.string().optional()`, which rejects `null` — so
 * clear a field by sending `''`, never `null`.
 */
export interface ConnectionPatch {
    name?: string;
    meetingPlace?: string;
    notes?: string;
    userCompanyAtTheTime?: string;
    email?: string;
    phone?: string;
}
