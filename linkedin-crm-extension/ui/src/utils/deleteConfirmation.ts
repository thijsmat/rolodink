/**
 * The words that confirm deleting the account. msg_delete_prompt asks for the
 * word in the UI language, "DELETE" in English and "VERWIJDER" in Dutch, so
 * both are accepted. Only VERWIJDER used to be, and an English user who typed
 * exactly what the prompt asked for got "Account deletion cancelled." and had
 * no way to delete their account from the extension.
 */
const CONFIRMATION_WORDS = new Set(['DELETE', 'VERWIJDER']);

/** Whether the prompt's answer confirms deletion. null is the Cancel button. */
export function isDeleteConfirmation(answer: string | null | undefined): boolean {
    if (typeof answer !== 'string') return false;
    return CONFIRMATION_WORDS.has(answer.trim().toUpperCase());
}
