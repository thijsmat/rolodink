/**
 * Email and phone as the popup shows them: a light format check for the form,
 * and mailto:/tel: links for the connection view. The values are stored
 * encrypted, so the server cannot check them; this is the only check there is,
 * and it only warns.
 */

/**
 * True for something shaped like name@domain.tld: one @, no spaces, and a dot
 * inside the domain. Says nothing about whether the address exists. Written
 * out instead of as one regex, which backtracks badly on long input.
 */
export function looksLikeEmail(value: string): boolean {
    const email = value.trim();
    if (/\s/.test(email)) return false;
    const parts = email.split('@');
    if (parts.length !== 2) return false;
    const [local, domain] = parts;
    const dot = domain.lastIndexOf('.');
    return local.length > 0 && dot > 0 && dot < domain.length - 1;
}

/** True for a filled-in value that is not shaped like an address: worth a warning. */
export function isOddEmail(value: string): boolean {
    return value.trim() !== '' && !looksLikeEmail(value);
}

/** Only the digits of a value: what a phone number is compared and dialled by. */
export function onlyDigits(value: string): string {
    return value.replaceAll(/\D/g, '');
}

/**
 * A mailto: link for an email address, or null when the value is not shaped
 * like one (such as the locked placeholder). Both halves are percent-encoded,
 * so characters like ? or & in a stored value cannot add a subject, a body or
 * another recipient to the mail.
 */
export function mailtoHref(value: string | null | undefined): string | null {
    const email = value?.trim() ?? '';
    if (!looksLikeEmail(email)) return null;
    const at = email.lastIndexOf('@');
    return `mailto:${encodeURIComponent(email.slice(0, at))}@${encodeURIComponent(email.slice(at + 1))}`;
}

/**
 * A tel: link for a phone number, or null when it has fewer than three digits.
 * Only digits and a leading + go into the link; spaces, dashes, brackets and
 * anything else are dropped.
 */
export function telHref(value: string | null | undefined): string | null {
    const phone = value?.trim() ?? '';
    const digits = onlyDigits(phone);
    if (digits.length < 3) return null;
    return `tel:${phone.startsWith('+') ? '+' : ''}${digits}`;
}
