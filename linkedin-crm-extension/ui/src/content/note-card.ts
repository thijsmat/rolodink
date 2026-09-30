/**
 * When the note card may be typed in, and when it may save.
 *
 * These rules live here rather than in main.js because what they prevent is
 * silent data loss, and main.js cannot be loaded in a test: it starts watching
 * the page the moment it is imported. Same reason scheduler.ts and
 * browser-api.ts exist - the decision is the part worth testing, so it is the
 * part that gets a module, and main.js supplies the I/O.
 *
 * **The bug this closes.** The card used to open its textarea after every load
 * except a decrypt failure, including a 429 from the rate limiter, a 5xx, a 401
 * and a message timeout. In each of those the field was empty while a note
 * could exist on the server. The first save then looked the connection up again
 * with a fresh GET - which by then might succeed - encrypted only what had just
 * been typed and PATCHed it over the stored note. The PATCH carries no version,
 * so nothing further down could have caught it.
 *
 * So the textarea opens only after a load that established what the server
 * holds: the note arrived and decrypted, or an ok answer said there is no
 * connection. Anything else keeps it closed, with a Retry beside the status
 * where retrying can help. And a card that did not load never saves - a second
 * check, independent of the closed textarea, so a regression in one does not
 * reopen the overwrite.
 *
 * "No connection" holds when the card loads, not for good: one can appear
 * later, with a note. A save that finds a connection this card did not load
 * reads its note first - see textForUnseenNote.
 */

/** What the background worker hands back for an API_REQUEST. */
export interface ApiResponse {
    status: number;
    ok: boolean;
    data: unknown;
}

/**
 * What one load established, with the status the card shows for it.
 *
 *  - loaded: the connection exists and its note decrypted; the card shows the
 *    server's text.
 *  - absent: an ok answer listing no connection, so no note to overwrite when
 *    the card loaded. That can change before the first save; see
 *    textForUnseenNote.
 *  - locked: a note exists and cannot be decrypted. Never editable, and not
 *    retried: that takes a new sign-in, not another request.
 *  - failed: nothing was established - a 401, 429 or 5xx, an answer that is
 *    not a list of connections, or no answer at all. Retryable.
 */
export type NoteLoad =
    | { state: 'loaded'; status: 'Saved'; connectionId: unknown; text: string }
    | { state: 'absent'; status: 'Not in Rldnk yet' }
    | { state: 'locked'; status: 'Locked' }
    | { state: 'failed'; status: 'Not logged in' | 'Error loading' | 'Error' };

const isConnection = (value: unknown): value is { id: unknown; notes?: unknown } =>
    typeof value === 'object' && value !== null && (value as { id?: unknown }).id != null;

/**
 * Loads a card's note: one GET, then one decrypt.
 *
 * `request` rejects when the message itself fails - a dead service worker, or
 * the 15-second deadline main.js puts on every message. `decrypt` rejects when
 * the note cannot be read. Neither escapes: every outcome is a NoteLoad.
 */
export async function readNote(
    request: () => Promise<ApiResponse>,
    decrypt: (notes: unknown) => Promise<string>,
): Promise<NoteLoad> {
    let response: ApiResponse;
    try {
        response = await request();
    } catch (error) {
        console.error('Error loading note:', error);
        return { state: 'failed', status: 'Error' };
    }

    if (response.status === 401) return { state: 'failed', status: 'Not logged in' };
    if (!response.ok) return { state: 'failed', status: 'Error loading' };

    // The API answers with a list, and only an empty list means "not in the
    // CRM". An ok answer that is no list of connections - the worker turns an
    // unparseable body into null - says nothing, and nothing is no licence to
    // write.
    const { data } = response;
    if (Array.isArray(data) && data.length === 0) {
        return { state: 'absent', status: 'Not in Rldnk yet' };
    }
    const connection = Array.isArray(data) ? data[0] : data;
    if (!isConnection(connection)) return { state: 'failed', status: 'Error loading' };

    try {
        const text = await decrypt(connection.notes);
        return { state: 'loaded', status: 'Saved', connectionId: connection.id, text };
    } catch (error) {
        console.error('Error decrypting note:', error);
        return { state: 'locked', status: 'Locked' };
    }
}

/**
 * What a save may send to a connection whose note this card never showed.
 *
 * A card that loaded "Not in Rldnk yet" has an empty field, and the connection
 * can appear after that with a note on it: the popup's form for a profile that
 * is not in the CRM creates it with one, and so does a second tab with its own
 * card. saveNote then finds it - by looking the id up again, or through a 409
 * on its POST - knowing only what was typed here. PATCHing that would replace
 * a note nobody saw on this card: the same overwrite as above, by another road.
 *
 * So that save reads the note first (`current`, from readNote) and sends the
 * stored text with what was typed after it, keeping both. Anything short of
 * this connection's note, read and decrypted - a failed or locked read, the
 * connection gone again, another id - gives null: send nothing, and the card
 * stays dirty for the next flush.
 */
export function textForUnseenNote(current: NoteLoad, connectionId: unknown, typed: string): string | null {
    if (current.state !== 'loaded' || current.connectionId !== connectionId) return null;
    if (!current.text || current.text === typed) return typed;
    return typed ? `${current.text}\n${typed}` : current.text;
}

export interface NoteCardOptions {
    textarea: HTMLTextAreaElement;
    status: HTMLElement;
    /** Shown beside the status after a load that retrying can fix. */
    retry: HTMLButtonElement;
    /** False once the card has left the page; SPA navigation removes it. */
    isAttached: () => boolean;
    /** One load of this card's note - see readNote. */
    load: () => Promise<NoteLoad>;
    /** One save attempt. Resolves true only when the note is on the server. */
    save: () => Promise<boolean>;
}

export interface NoteCard {
    /**
     * Loads the note and opens the textarea if the outcome allows it. One load
     * at a time; none once loaded, because a reload would replace what has been
     * typed since; none for a card that has left the page.
     */
    load(): Promise<void>;
    /** Whether a load established what the server holds. Nothing saves before. */
    isLoaded(): boolean;
    /** The text on the card may differ from what the server has. */
    markDirty(): void;
    isDirty(): boolean;
    /**
     * Saves if dirty. Saves run one after another, and one that fails leaves
     * the card dirty, so the next input or page-hide flush tries again. There
     * is no timer here: a failing save is never retried in a loop, which
     * matters because the API's rate limiter counts per IP address.
     */
    flush(): Promise<void>;
}

const LOCKED_PLACEHOLDER = 'Unable to decrypt this note. Open the Rolodink popup to sign in again.';

export function createNoteCard(options: NoteCardOptions): NoteCard {
    const { textarea, status, retry, isAttached } = options;
    let loaded = false;
    let dirty = false;
    let loading: Promise<void> | null = null;
    let saving: Promise<void> = Promise.resolve();

    // Both, because the page's stylesheet is not ours: an author rule such as
    // `button { display: inline-flex }` beats the browser's own [hidden] rule,
    // and loses to an inline style.
    const showRetry = (visible: boolean) => {
        retry.hidden = !visible;
        retry.style.display = visible ? '' : 'none';
    };

    const apply = (note: NoteLoad) => {
        status.textContent = note.status;
        if (note.state === 'loaded') textarea.value = note.text;
        if (note.state === 'locked') {
            // Nothing rather than the ciphertext.
            textarea.value = '';
            textarea.placeholder = LOCKED_PLACEHOLDER;
        }
        loaded = note.state === 'loaded' || note.state === 'absent';
        textarea.disabled = !loaded;
        showRetry(note.state === 'failed');
    };

    const run = async () => {
        status.textContent = 'Loading...';
        textarea.disabled = true;
        showRetry(false);
        let note: NoteLoad;
        try {
            note = await options.load();
        } catch (error) {
            console.error('Error loading note:', error);
            note = { state: 'failed', status: 'Error' };
        }
        // Navigation took the card away while we waited. A new card gets built
        // for whatever page this is now; this answer belongs to neither.
        if (isAttached()) apply(note);
    };

    const load = (): Promise<void> => {
        if (loading) return loading;
        if (loaded || !isAttached()) return Promise.resolve();
        loading = run().finally(() => {
            loading = null;
        });
        return loading;
    };

    const attempt = async () => {
        let saved = false;
        // Checked when the save runs, before anything is sent: a card that did
        // not load does not know what the server holds, and its PATCH would
        // replace that note with whatever is on the card.
        if (loaded) {
            try {
                saved = (await options.save()) === true;
            } catch (error) {
                console.error('Error saving note:', error);
            }
        }
        // Not saved, for whatever reason: the text exists only on the card.
        if (!saved) dirty = true;
    };

    // Closed until a load has established what the server holds.
    textarea.disabled = true;
    showRetry(false);
    retry.addEventListener('click', () => {
        void load();
    });

    return {
        load,
        isLoaded: () => loaded,
        markDirty: () => {
            dirty = true;
        },
        isDirty: () => dirty,
        flush: () => {
            if (!dirty) return saving;
            dirty = false;
            saving = saving.then(attempt);
            return saving;
        },
    };
}
