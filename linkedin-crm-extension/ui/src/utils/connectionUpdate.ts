/**
 * What the popup shows in place of a field it could not decrypt. It is display
 * text, never data: saving it would replace the real, encrypted value on the
 * server with this string, and the note behind it would be gone.
 */
export const LOCKED_FIELD_PLACEHOLDER = '🔒 [Encrypted - Passphrase Required]';

const CIPHERTEXT_PREFIX = 'rolodink-enc:';

/**
 * True for a value the user never saw in plain text: the locked placeholder,
 * with or without text typed around it, or raw ciphertext that was shown
 * because decryption did not run. Sending either back would overwrite the
 * stored value with something that is not what the user wrote.
 */
export function isUnreadableValue(value: unknown): boolean {
    return typeof value === 'string'
        && (value.includes(LOCKED_FIELD_PLACEHOLDER) || value.startsWith(CIPHERTEXT_PREFIX));
}

/**
 * A save refused because the connection changed elsewhere after the form
 * opened (the API's 409 CONNECTION_CONFLICT). `current` is the stored row,
 * decrypted. Nothing was written: the form keeps what was typed and lets the
 * user load `current` or overwrite it.
 */
export class ConnectionChangedElsewhereError<T> extends Error {
    readonly current: T;

    constructor(current: T) {
        super('Connection changed elsewhere');
        this.name = 'ConnectionChangedElsewhereError';
        this.current = current;
    }
}

export type FieldsToUpdate<F extends string> = {
    /** The fields to send, exactly as the form had them. */
    fields: Partial<Record<F, string | null>>;
    /** Fields left out because they held a value the user could not read. */
    skippedUnreadable: F[];
};

/**
 * The fields of an edit that should reach the server.
 *
 * A field the form does not have (undefined) is left out, so the PATCH leaves
 * it alone. The edit form has no email or phone inputs, and sending those as
 * null wiped both on every save.
 *
 * A field holding an unreadable value is left out too, so the stored
 * ciphertext survives an edit made while it could not be decrypted.
 *
 * An empty string or null is kept: that is the user clearing the field.
 */
export function pickFieldsToUpdate<F extends string>(
    formData: Partial<Record<F, string | null | undefined>>,
    fields: readonly F[],
): FieldsToUpdate<F> {
    const picked: Partial<Record<F, string | null>> = {};
    const skippedUnreadable: F[] = [];
    for (const field of fields) {
        const value = formData[field];
        if (value === undefined) continue;
        if (isUnreadableValue(value)) {
            skippedUnreadable.push(field);
            continue;
        }
        picked[field] = value;
    }
    return { fields: picked, skippedUnreadable };
}
