// Decrypted values by owner and ciphertext, so reloading or re-rendering the
// list does not send every unchanged note to the background script again.
// Bounded: the least recently used entry goes first. It lives as long as the
// popup page and is cleared on sign-out and account change, and the owner is
// part of the key, so one user's plaintext is never handed to another.

export const DECRYPT_MEMO_LIMIT = 5000;

const memo = new Map<string, string>();

const memoKey = (ownerId: string, ciphertext: string) => `${ownerId}\u0000${ciphertext}`;

export function getDecrypted(ownerId: string, ciphertext: string): string | undefined {
    const key = memoKey(ownerId, ciphertext);
    const plaintext = memo.get(key);
    if (plaintext !== undefined) {
        // Re-insert to mark it as recently used; a Map iterates in insertion order.
        memo.delete(key);
        memo.set(key, plaintext);
    }
    return plaintext;
}

export function rememberDecrypted(ownerId: string, ciphertext: string, plaintext: string): void {
    const key = memoKey(ownerId, ciphertext);
    memo.delete(key);
    memo.set(key, plaintext);
    if (memo.size > DECRYPT_MEMO_LIMIT) {
        const oldest = memo.keys().next().value;
        if (oldest !== undefined) memo.delete(oldest);
    }
}

export function clearDecryptMemo(): void {
    memo.clear();
}

export function decryptMemoSize(): number {
    return memo.size;
}
