import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import App from '../App';
import { SettingsView } from './SettingsView';
import { ConnectionView } from './ConnectionView';

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

let container: HTMLDivElement;
let root: Root | null = null;
let current: (() => unknown) | null = null;

async function render(component: () => unknown) {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    current = component;
    await act(async () => {
        root?.render(createElement(component as () => null));
    });
    await settle();
}

// Same component again: a re-render with whatever the context now holds.
async function rerender() {
    await act(async () => {
        if (current) root?.render(createElement(current as () => null));
    });
}

const settle = () => act(async () => {
    await new Promise(resolve => setTimeout(resolve, 0));
});

function button(text: string): HTMLButtonElement {
    const found = [...container.querySelectorAll('button')].find(b => b.textContent?.trim() === text);
    if (!found) throw new Error(`no button "${text}"`);
    return found;
}

async function click(el: HTMLElement) {
    await act(async () => {
        el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    await settle();
}

async function type(input: HTMLInputElement, value: string) {
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
    await act(async () => {
        setter?.call(input, value);
        input.dispatchEvent(new Event('input', { bubbles: true }));
    });
}

const meetingPlace = () => container.querySelector<HTMLInputElement>('#meetingPlace');

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
    await act(async () => root?.unmount());
    root = null;
    container.remove();
    vi.unstubAllGlobals();
    vi.clearAllMocks();
});

describe('the popup outside a LinkedIn profile', () => {
    beforeEach(() => {
        context.error = 'invalid-profile-page';
    });

    it('shows a start screen, not an error or a personal profile link', async () => {
        await render(App);

        expect(container.textContent).toContain('start_description');
        expect(container.innerHTML).not.toContain('matthijsgoes');
        expect(container.querySelector('a[href*="linkedin.com/in/"]')).toBeNull();
        expect(container.textContent).not.toContain('invalid-profile-page');
        expect(container.querySelector('[role="alert"]')).toBeNull();
    });

    it('opens the existing list view from the start screen', async () => {
        await render(App);
        const inStartScreen = [...container.querySelectorAll('button')]
            .filter(b => b.textContent?.trim() === 'show_all_connections_button');
        // One in the header, one on the start screen.
        expect(inStartScreen).toHaveLength(2);

        await click(inStartScreen[1]);

        expect(context.showListView).toHaveBeenCalledTimes(1);
    });

    it('gives a first step to a user without connections, once the server has said so', async () => {
        await render(App);

        expect(context.fetchAllConnections).toHaveBeenCalledWith(true);
        expect(container.textContent).toContain('start_first_step_hint');
    });

    it('leaves the first step out for a user who has connections', async () => {
        context.allConnections = [{ id: 'conn-1', name: 'Jane Doe' }];
        await render(App);

        expect(container.textContent).not.toContain('start_first_step_hint');
    });

    it('still shows a real error as an error', async () => {
        context.error = 'Kon de connectie-data niet ophalen.';
        await render(App);

        expect(container.textContent).toContain('Kon de connectie-data niet ophalen.');
        expect(container.textContent).not.toContain('start_description');
    });
});

describe('sending feedback', () => {
    function feedbackLink(): HTMLAnchorElement {
        const link = [...container.querySelectorAll('a')].find(a => a.textContent?.trim() === 'feedback_button');
        if (!link) throw new Error('no feedback link');
        return link;
    }

    it('opens a mail to support with the version and browser, and no page URL', async () => {
        await render(SettingsView);
        const href = feedbackLink().getAttribute('href') ?? '';

        expect(href.startsWith('mailto:hallo@rolodink.app?')).toBe(true);
        const params = new URLSearchParams(href.slice(href.indexOf('?') + 1));
        expect(params.get('subject')).toContain('1.3.7');
        expect(params.get('body')).toContain('1.3.7');
        expect(params.get('body')).toMatch(/Chrome|Edge|Firefox/);
        const decoded = decodeURIComponent(href);
        expect(decoded).not.toMatch(/https?:\/\//);
        expect(decoded).not.toContain('linkedin');
        expect(feedbackLink().getAttribute('target')).toBe('_blank');
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

        await act(async () => {
            container.querySelector('form')!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
        });
        await settle();

        expect(context.handleUpdate).toHaveBeenCalledWith(expect.objectContaining({ meetingPlace: 'Slush 2025' }));
        expect(meetingPlace()?.value).toBe('Slush 2025');
        expect(container.querySelector('[role="alert"]')?.textContent).toBe('connection_update_failed');

        // And the retry goes through.
        context.handleUpdate.mockResolvedValue(undefined);
        await act(async () => {
            container.querySelector('form')!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
        });
        await settle();

        expect(context.handleUpdate).toHaveBeenCalledTimes(2);
        expect(meetingPlace()).toBeNull();
    });
});
