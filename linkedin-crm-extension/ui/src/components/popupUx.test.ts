import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, createElement } from 'react';
import { createDomHarness } from '../test/domHarness';
import App from '../App';
import { SettingsView } from './SettingsView';
import { ConnectionView } from './ConnectionView';
import { ConnectionForm } from './ConnectionForm';
import { AllConnectionsView } from './AllConnectionsView';
import { ConnectionChangedElsewhereError, LOCKED_FIELD_PLACEHOLDER } from '../utils/connectionUpdate';

/**
 * Three review findings in the popup: outside a profile it showed an error
 * with a link to the developer's own LinkedIn profile, there was no way to
 * send feedback, and editing a connection lost the typed text whenever the
 * connection object was replaced or a save failed.
 */

const context = vi.hoisted(() => ({
    isLoading: false,
    isLoggedIn: true,
    error: null as string | null,
    connection: null as unknown,
    allConnections: [] as unknown[],
    isListView: false,
    isSettingsView: false,
    isHelpView: false,
    isOffline: false,
    toastMessage: '',
    showListView: vi.fn(),
    hideListView: vi.fn(),
    showSettingsView: vi.fn(),
    hideSettingsView: vi.fn(),
    showHelpView: vi.fn(),
    hideHelpView: vi.fn(),
    handleLogout: vi.fn(),
    setToastMessage: vi.fn(),
    fetchData: vi.fn(),
    fetchAllConnections: vi.fn(),
    clearError: vi.fn(),
    handleUpdate: vi.fn(),
    handleDelete: vi.fn(),
    handleCreateConnection: vi.fn(),
    selectConnection: vi.fn(),
}));

vi.mock('../services/supabase', () => ({ supabase: { auth: { getSession: vi.fn() } } }));
vi.mock('../config', () => ({ API_BASE_URL: 'https://api.test' }));
vi.mock('../context/ConnectionContext', () => ({
    INVALID_PROFILE_PAGE_ERROR: 'invalid-profile-page',
    ConnectionProvider: ({ children }: { children: unknown }) => children,
    useConnection: () => context,
}));
vi.mock('../context/UpdateContext', () => ({
    UpdateProvider: ({ children }: { children: unknown }) => children,
    useUpdate: () => ({
        versionInfo: null,
        updateDismissed: false,
        dismissUpdate: vi.fn(),
        isCheckingForUpdates: false,
        checkForUpdates: vi.fn(),
        getCurrentVersion: () => '1.3.7',
    }),
}));

const dom = createDomHarness();
const { render, settle, button, click, type, rerender } = dom;

const meetingPlace = () => dom.container.querySelector<HTMLInputElement>('#meetingPlace');

/** Submits the form on screen, as the Save button or Enter does. */
async function submitForm() {
    await act(async () => {
        dom.container.querySelector('form')!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    });
    await settle();
}

beforeEach(() => {
    vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
    // t() returns the key, followed by any substitutions, so the tests can
    // find elements by message key and still see what was filled in.
    vi.stubGlobal('chrome', {
        i18n: {
            getMessage: (key: string, subs?: string | string[]) =>
                subs === undefined ? key : [key, ...([] as string[]).concat(subs)].join(' '),
            getUILanguage: () => 'en',
        },
    });
    Object.assign(context, {
        isLoading: false,
        isLoggedIn: true,
        error: null,
        connection: null,
        allConnections: [],
        isListView: false,
        isSettingsView: false,
        isHelpView: false,
        isOffline: false,
    });
    context.fetchAllConnections.mockResolvedValue(undefined);
    context.showListView.mockResolvedValue(undefined);
});

afterEach(async () => {
    await dom.unmount();
    vi.unstubAllGlobals();
    vi.clearAllMocks();
});

describe('the popup outside a LinkedIn profile', () => {
    beforeEach(() => {
        context.error = 'invalid-profile-page';
    });

    it('shows a start screen, not an error or a personal profile link', async () => {
        await render(App);

        expect(dom.container.textContent).toContain('start_description');
        expect(dom.container.innerHTML).not.toContain('matthijsgoes');
        expect(dom.container.querySelector('a[href*="linkedin.com/in/"]')).toBeNull();
        expect(dom.container.textContent).not.toContain('invalid-profile-page');
        expect(dom.container.querySelector('[role="alert"]')).toBeNull();
    });

    it('opens the existing list view from the start screen', async () => {
        await render(App);
        const inStartScreen = [...dom.container.querySelectorAll('button')]
            .filter(b => b.textContent?.trim() === 'show_all_connections_button');
        // One in the header, one on the start screen.
        expect(inStartScreen).toHaveLength(2);

        await click(inStartScreen[1]);

        expect(context.showListView).toHaveBeenCalledTimes(1);
    });

    it('gives a first step to a user without connections, once the server has said so', async () => {
        await render(App);

        expect(context.fetchAllConnections).toHaveBeenCalledWith(true);
        expect(dom.container.textContent).toContain('start_first_step_hint');
    });

    it('leaves the first step out for a user who has connections', async () => {
        context.allConnections = [{ id: 'conn-1', name: 'Jane Doe' }];
        await render(App);

        expect(dom.container.textContent).not.toContain('start_first_step_hint');
    });

    it('still shows a real error as an error', async () => {
        context.error = 'Kon de connectie-data niet ophalen.';
        await render(App);

        expect(dom.container.textContent).toContain('Kon de connectie-data niet ophalen.');
        expect(dom.container.textContent).not.toContain('start_description');
    });
});

describe('sending feedback', () => {
    function feedbackLink(): HTMLAnchorElement {
        const link = [...dom.container.querySelectorAll('a')].find(a => a.textContent?.trim() === 'feedback_button');
        if (!link) throw new Error('no feedback link');
        return link;
    }

    it('opens a mail to support with the version and browser, and no page URL', async () => {
        await render(SettingsView);
        const href = feedbackLink().getAttribute('href') ?? '';

        // English UI (see beforeEach): the English address.
        expect(href.startsWith('mailto:hello@rolodink.app?')).toBe(true);
        const params = new URLSearchParams(href.slice(href.indexOf('?') + 1));
        expect(params.get('subject')).toContain('1.3.7');
        expect(params.get('body')).toContain('1.3.7');
        expect(params.get('body')).toMatch(/Chrome|Edge|Firefox/);
        const decoded = decodeURIComponent(href);
        expect(decoded).not.toMatch(/https?:\/\//);
        expect(decoded).not.toContain('linkedin');
        expect(feedbackLink().getAttribute('target')).toBe('_blank');
    });

    it('uses the Dutch address in a Dutch browser', async () => {
        const chromeStub = (globalThis as unknown as { chrome: { i18n: { getUILanguage: () => string } } }).chrome;
        chromeStub.i18n.getUILanguage = () => 'nl-NL';
        await render(SettingsView);

        expect(feedbackLink().getAttribute('href')?.startsWith('mailto:hallo@rolodink.app?')).toBe(true);
    });
});

describe('editing a connection', () => {
    const jane = () => ({ id: 'conn-jane', name: 'Jane Doe', meetingPlace: 'Web Summit', notes: 'Hiring' });

    async function startEditing() {
        context.connection = jane();
        await render(ConnectionView);
        await click(button('✏️Bewerken'));
        expect(meetingPlace()?.value).toBe('Web Summit');
        await type(meetingPlace()!, 'Slush 2025');
    }

    it('keeps the typed text when the same connection arrives as a new object', async () => {
        await startEditing();

        // What a toast or a token refresh does upstream: same row, new object.
        context.connection = { ...jane(), meetingPlace: 'Web Summit' };
        await rerender();

        expect(meetingPlace()?.value).toBe('Slush 2025');
    });

    it('starts over when another connection is opened', async () => {
        await startEditing();

        context.connection = { id: 'conn-bob', name: 'Bob', meetingPlace: 'Dinner' };
        await rerender();

        expect(meetingPlace()?.value).toBe('Dinner');
    });

    it('stays open with the typed text after a failed save', async () => {
        context.handleUpdate.mockRejectedValue(new Error('Update mislukt'));
        await startEditing();

        await submitForm();

        // No updatedAt on this row: the save is unconditional, as before.
        expect(context.handleUpdate).toHaveBeenCalledWith(expect.objectContaining({ meetingPlace: 'Slush 2025' }), undefined);
        expect(meetingPlace()?.value).toBe('Slush 2025');
        expect(dom.container.querySelector('[role="alert"]')?.textContent).toBe('connection_update_failed');

        // And the retry goes through.
        context.handleUpdate.mockResolvedValue(undefined);
        await submitForm();

        expect(context.handleUpdate).toHaveBeenCalledTimes(2);
        expect(meetingPlace()).toBeNull();
    });
});

describe('saving an edit over a newer version', () => {
    const OPENED = '2026-09-30T12:00:00.000Z';
    const ELSEWHERE = '2026-09-30T12:00:07.250Z';
    const jane = () => ({ id: 'conn-jane', name: 'Jane Doe', meetingPlace: 'Web Summit', notes: 'Hiring', updatedAt: OPENED });
    const stored = { ...jane(), meetingPlace: 'Typed on the LinkedIn page', updatedAt: ELSEWHERE };
    async function editIntoConflict() {
        context.handleUpdate.mockRejectedValueOnce(new ConnectionChangedElsewhereError(stored));
        context.connection = jane();
        await render(ConnectionView);
        await click(button('✏️Bewerken'));
        await type(meetingPlace()!, 'Slush 2025');
        await submitForm();
    }

    it('sends the version the edit was opened on', async () => {
        context.handleUpdate.mockResolvedValue(undefined);
        context.connection = jane();
        await render(ConnectionView);
        await click(button('✏️Bewerken'));
        // The popup reloading the row meanwhile does not move the edit's base.
        context.connection = { ...jane(), updatedAt: ELSEWHERE };
        await rerender();
        await submitForm();

        expect(context.handleUpdate).toHaveBeenCalledWith(expect.objectContaining({ meetingPlace: 'Web Summit' }), OPENED);
    });

    it('keeps the typed text and offers both versions after a 409', async () => {
        await editIntoConflict();

        expect(meetingPlace()?.value).toBe('Slush 2025');
        expect(dom.container.querySelector('[role="alert"]')?.textContent).toContain('connection_conflict_message');
        expect(button('connection_conflict_load_latest')).not.toBeNull();
        expect(button('connection_conflict_overwrite')).not.toBeNull();
    });

    it('overwrites with the typed text, on the stored version', async () => {
        await editIntoConflict();
        context.handleUpdate.mockResolvedValue(undefined);

        await click(button('connection_conflict_overwrite'));
        await settle();

        expect(context.handleUpdate).toHaveBeenLastCalledWith(expect.objectContaining({ meetingPlace: 'Slush 2025' }), ELSEWHERE);
        expect(meetingPlace()).toBeNull();
    });

    it('loads the stored version into the form, and saves on top of it after that', async () => {
        await editIntoConflict();

        await click(button('connection_conflict_load_latest'));

        expect(meetingPlace()?.value).toBe('Typed on the LinkedIn page');
        expect(dom.container.querySelector('[role="alert"]')).toBeNull();

        context.handleUpdate.mockResolvedValue(undefined);
        await submitForm();
        expect(context.handleUpdate).toHaveBeenLastCalledWith(
            expect.objectContaining({ meetingPlace: 'Typed on the LinkedIn page' }),
            ELSEWHERE,
        );
    });
});

describe('adding a connection', () => {
    it('stays open with the typed text after a failed save, and the retry goes through', async () => {
        context.connection = null;
        context.handleCreateConnection.mockRejectedValue(new Error('Opslaan mislukt'));
        await render(() => createElement(ConnectionForm));
        await type(meetingPlace()!, 'Slush 2025');

        await submitForm();

        expect(context.handleCreateConnection).toHaveBeenCalledWith(expect.objectContaining({ meetingPlace: 'Slush 2025' }));
        expect(meetingPlace()?.value).toBe('Slush 2025');
        expect(dom.container.querySelector('[role="alert"]')?.textContent).toBe('connection_create_failed');

        context.handleCreateConnection.mockResolvedValue(undefined);
        await submitForm();

        expect(context.handleCreateConnection).toHaveBeenCalledTimes(2);
        expect(dom.container.querySelector('[role="alert"]')).toBeNull();
    });
});

describe('email and phone', () => {
    const jane = () => ({
        id: 'conn-jane', name: 'Jane Doe', meetingPlace: 'Web Summit', notes: 'Hiring',
        email: 'jane@example.com', phone: '+31 6 1234 5678',
    });
    const email = () => dom.container.querySelector<HTMLInputElement>('#email')!;
    const phone = () => dom.container.querySelector<HTMLInputElement>('#phone')!;

    async function editJane(connection: object = jane()) {
        context.handleUpdate.mockResolvedValue(undefined);
        context.connection = connection;
        await render(ConnectionView);
        await click(button('✏️Bewerken'));
    }

    /** The form data of the last save. */
    const saved = () => context.handleUpdate.mock.lastCall?.[0] as Record<string, unknown>;

    it('are in the edit form, filled in, as email and tel inputs', async () => {
        await editJane();

        expect(email().value).toBe('jane@example.com');
        expect(email().type).toBe('email');
        expect(phone().value).toBe('+31 6 1234 5678');
        expect(phone().type).toBe('tel');
        // Someone else's details: the browser must not offer the user's own.
        expect(email().getAttribute('autocomplete')).toBe('off');
        expect(phone().getAttribute('autocomplete')).toBe('off');
        expect(dom.container.querySelector('label[for="email"]')?.textContent).toContain('label_email');
        expect(dom.container.querySelector('label[for="phone"]')?.textContent).toContain('label_phone');
    });

    it('are left out of a save that did not touch them', async () => {
        await editJane();
        await type(meetingPlace()!, 'Slush 2025');

        await submitForm();

        expect(saved()).toMatchObject({ meetingPlace: 'Slush 2025' });
        expect(saved()).not.toHaveProperty('email');
        expect(saved()).not.toHaveProperty('phone');
    });

    it('send only the field that was changed', async () => {
        await editJane();
        await type(email(), 'jane@acme.com');

        await submitForm();

        expect(saved()).toMatchObject({ email: 'jane@acme.com' });
        expect(saved()).not.toHaveProperty('phone');
    });

    it('clear a field the user emptied', async () => {
        await editJane();
        await type(phone(), '');

        await submitForm();

        expect(saved()).toHaveProperty('phone', null);
        expect(saved()).not.toHaveProperty('email');
    });

    it('cannot wipe a connection opened without them', async () => {
        // Older rows and other clients: the form opens with both empty.
        await editJane({ id: 'conn-jane', name: 'Jane Doe', meetingPlace: 'Web Summit' });
        expect(email().value).toBe('');

        await submitForm();

        expect(saved()).not.toHaveProperty('email');
        expect(saved()).not.toHaveProperty('phone');
    });

    it('warn about an odd email address once the field is left, and save it anyway', async () => {
        await editJane();
        await type(email(), 'jane at acme');
        expect(dom.container.textContent).not.toContain('warning_email_format');

        await act(async () => {
            email().dispatchEvent(new FocusEvent('focusout', { bubbles: true }));
        });
        expect(dom.container.querySelector('#email-warning')?.textContent).toBe('warning_email_format');
        expect(email().getAttribute('aria-describedby')).toContain('email-warning');

        await submitForm();
        expect(saved()).toMatchObject({ email: 'jane at acme' });
    });

    it('go along with a new connection', async () => {
        context.handleCreateConnection.mockResolvedValue(undefined);
        await render(() => createElement(ConnectionForm));
        await type(email(), 'bob@example.com');
        await type(phone(), '06 12 34 56 78');

        await submitForm();

        expect(context.handleCreateConnection).toHaveBeenCalledWith(
            expect.objectContaining({ email: 'bob@example.com', phone: '06 12 34 56 78' }),
        );
    });

    it('show as mailto: and tel: links on the connection', async () => {
        context.connection = jane();
        await render(ConnectionView);

        const mail = dom.container.querySelector<HTMLAnchorElement>('a[href^="mailto:"]');
        const tel = dom.container.querySelector<HTMLAnchorElement>('a[href^="tel:"]');
        expect(mail?.getAttribute('href')).toBe('mailto:jane@example.com');
        expect(mail?.textContent).toBe('jane@example.com');
        expect(tel?.getAttribute('href')).toBe('tel:+31612345678');
        expect(tel?.textContent).toBe('+31 6 1234 5678');
    });

    it('show a value that is no address as text, not as a link', async () => {
        context.connection = { ...jane(), email: LOCKED_FIELD_PLACEHOLDER, phone: '<b>n/a</b>' };
        await render(ConnectionView);

        expect(dom.container.querySelector('a[href^="mailto:"]')).toBeNull();
        expect(dom.container.querySelector('a[href^="tel:"]')).toBeNull();
        expect(dom.container.textContent).toContain(LOCKED_FIELD_PLACEHOLDER);
        expect(dom.container.textContent).toContain('<b>n/a</b>');
        expect(dom.container.querySelector('b')).toBeNull();
    });

    it('leave out the rows when the connection has neither', async () => {
        context.connection = { id: 'conn-bob', name: 'Bob' };
        await render(ConnectionView);

        expect(dom.container.textContent).not.toContain('label_email');
        expect(dom.container.textContent).not.toContain('label_phone');
    });

    it('are found by the list search', async () => {
        context.allConnections = [
            jane(),
            { id: 'conn-bob', name: 'Bob Smith', email: 'bob@other.org', phone: '020 765 4321' },
        ];
        await render(AllConnectionsView);
        const names = () => [...dom.container.querySelectorAll('h3')].map(h => h.textContent?.replace('✓', '').trim());
        const search = async (query: string) => {
            await type(dom.container.querySelector<HTMLInputElement>('input')!, query);
            // The search is debounced by 300 ms.
            await act(() => new Promise(resolve => setTimeout(resolve, 350)));
        };
        expect(names()).toEqual(['Jane Doe', 'Bob Smith']);

        await search('example.com');
        expect(names()).toEqual(['Jane Doe']);

        await search('7654321');
        expect(names()).toEqual(['Bob Smith']);
    });
});
