import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { SettingsView } from './SettingsView';
import { ConnectionView } from './ConnectionView';

/**
 * The settings and connection views against a fake supabase and a fake
 * connection context. Covers three review findings: the current password was
 * never checked, deleting a connection asked twice, and both deletes used
 * native dialogs that can close a Firefox popup.
 */

const auth = vi.hoisted(() => ({
    getSession: vi.fn(),
    signInWithPassword: vi.fn(),
    updateUser: vi.fn(),
    signOut: vi.fn(),
}));
const context = vi.hoisted(() => ({
    setToastMessage: vi.fn(),
    fetchAllConnections: vi.fn(),
    handleLogout: vi.fn(),
    handleUpdate: vi.fn(),
    handleDelete: vi.fn(),
    connection: null as unknown,
}));

vi.mock('../services/supabase', () => ({ supabase: { auth } }));
vi.mock('../config', () => ({ API_BASE_URL: 'https://api.test' }));
vi.mock('../context/ConnectionContext', () => ({ useConnection: () => context }));
vi.mock('../context/UpdateContext', () => ({
    useUpdate: () => ({
        versionInfo: null,
        isCheckingForUpdates: false,
        checkForUpdates: vi.fn(),
        getCurrentVersion: () => '0.0.0',
    }),
}));

const SESSION_USER = { id: 'user-1', email: 'jane@example.com' };

let container: HTMLDivElement;
let root: Root | null = null;
let fetchMock: ReturnType<typeof vi.fn>;
let nativeDialogs: string[];

async function render(component: () => unknown) {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    await act(async () => {
        root?.render(createElement(component as () => null));
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

// React tracks an input's value itself; set it through the native setter so
// the change event is not swallowed.
async function type(input: HTMLInputElement, value: string) {
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
    await act(async () => {
        setter?.call(input, value);
        input.dispatchEvent(new Event('input', { bubbles: true }));
    });
}

beforeEach(() => {
    nativeDialogs = [];
    vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
    // t() returns the key, so the tests can find elements by message key.
    vi.stubGlobal('chrome', {
        i18n: { getMessage: (key: string) => key, getUILanguage: () => 'en' },
    });
    for (const name of ['confirm', 'prompt', 'alert']) {
        vi.stubGlobal(name, (message: string) => {
            nativeDialogs.push(`${name}: ${message}`);
            return null;
        });
    }
    fetchMock = vi.fn(async () => ({ ok: true, status: 200, json: async () => ({ deletedConnections: 3 }) }));
    vi.stubGlobal('fetch', fetchMock);

    auth.getSession.mockResolvedValue({ data: { session: { access_token: 'token', user: SESSION_USER } } });
    auth.signInWithPassword.mockResolvedValue({ data: { user: SESSION_USER, session: {} }, error: null });
    auth.updateUser.mockResolvedValue({ data: {}, error: null });
    auth.signOut.mockResolvedValue({ error: null });
    context.handleLogout.mockResolvedValue(undefined);
    context.handleDelete.mockResolvedValue(undefined);
    context.connection = null;
});

afterEach(async () => {
    await act(async () => root?.unmount());
    root = null;
    container.remove();
    vi.unstubAllGlobals();
    vi.clearAllMocks();
});

describe('changing the password', () => {
    async function submitPasswordForm(current: string, next = 'new-secret-1') {
        await render(SettingsView);
        await click(button('change_password_button'));
        await type(container.querySelector<HTMLInputElement>('#currentPassword')!, current);
        await type(container.querySelector<HTMLInputElement>('#newPassword')!, next);
        await type(container.querySelector<HTMLInputElement>('#confirmPassword')!, next);
        await act(async () => {
            container.querySelector('form')!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
        });
        await settle();
    }

    it('does not change it when the current password is wrong', async () => {
        auth.signInWithPassword.mockResolvedValue({
            data: { user: null, session: null },
            error: { message: 'Invalid login credentials' },
        });

        await submitPasswordForm('wrong-password');

        expect(auth.signInWithPassword).toHaveBeenCalledWith({ email: 'jane@example.com', password: 'wrong-password' });
        expect(auth.updateUser).not.toHaveBeenCalled();
        expect(context.setToastMessage).toHaveBeenCalledWith('msg_current_password_incorrect');
    });

    it('checks the current password, then changes it, without the export call', async () => {
        await submitPasswordForm('right-password');

        expect(auth.signInWithPassword).toHaveBeenCalledWith({ email: 'jane@example.com', password: 'right-password' });
        expect(auth.updateUser).toHaveBeenCalledWith({ password: 'new-secret-1' });
        expect(auth.signInWithPassword.mock.invocationCallOrder[0])
            .toBeLessThan(auth.updateUser.mock.invocationCallOrder[0]);
        expect(fetchMock).not.toHaveBeenCalled();
        expect(context.setToastMessage).toHaveBeenCalledWith('msg_password_change_success');
    });

    it('does not try at all without an email in the session', async () => {
        auth.getSession.mockResolvedValue({ data: { session: { access_token: 'token', user: { id: 'user-1' } } } });

        await submitPasswordForm('right-password');

        expect(auth.signInWithPassword).not.toHaveBeenCalled();
        expect(auth.updateUser).not.toHaveBeenCalled();
        expect(context.setToastMessage).toHaveBeenCalledWith('msg_not_logged_in_password');
    });

    it('drops a session that turned out to be another user and changes nothing', async () => {
        auth.signInWithPassword.mockResolvedValue({ data: { user: { id: 'user-2' }, session: {} }, error: null });

        await submitPasswordForm('right-password');

        expect(auth.updateUser).not.toHaveBeenCalled();
        expect(auth.signOut).toHaveBeenCalledWith({ scope: 'local' });
    });
});

describe('deleting the account', () => {
    async function openConfirmation() {
        await render(SettingsView);
        await click(button('delete_account_button'));
        return {
            input: container.querySelector<HTMLInputElement>('input[aria-label="msg_delete_prompt"]')!,
            confirm: button('delete_account_confirm_button'),
        };
    }

    it('asks inline, not with a native dialog', async () => {
        const { input } = await openConfirmation();

        expect(input).not.toBeNull();
        expect(container.textContent).toContain('msg_delete_warning');
        expect(nativeDialogs).toEqual([]);
    });

    it.each(['DELETE', 'delete', ' Verwijder '])('accepts %j', async (word) => {
        const { input, confirm } = await openConfirmation();
        await type(input, word);

        expect(confirm.disabled).toBe(false);
        await click(confirm);

        expect(fetchMock).toHaveBeenCalledWith('https://api.test/api/user/delete', expect.objectContaining({ method: 'DELETE' }));
        expect(context.handleLogout).toHaveBeenCalledTimes(1);
        expect(context.setToastMessage).toHaveBeenLastCalledWith('msg_delete_success');
    });

    it.each(['', 'yes', 'VERWIJDEREN', 'DELETE ME'])('does not accept %j', async (word) => {
        const { input, confirm } = await openConfirmation();
        await type(input, word);

        expect(confirm.disabled).toBe(true);
        await click(confirm);
        expect(fetchMock).not.toHaveBeenCalled();
    });

    it('cancelling deletes nothing', async () => {
        await openConfirmation();
        await click(button('cancel_button'));

        expect(fetchMock).not.toHaveBeenCalled();
        expect(context.setToastMessage).toHaveBeenCalledWith('msg_delete_cancelled');
        expect(container.querySelector('input[aria-label="msg_delete_prompt"]')).toBeNull();
    });
});

describe('deleting a connection', () => {
    beforeEach(() => {
        context.connection = { id: 'conn-1', name: 'Jane Doe', linkedInUrl: 'https://www.linkedin.com/in/jane' };
    });

    it('asks exactly once, inline, and then deletes', async () => {
        await render(ConnectionView);
        await click(button('🗑️Verwijderen'));

        expect(context.handleDelete).not.toHaveBeenCalled();
        expect(container.textContent).toContain('confirm_delete_connection_message');

        await click(button('confirm_delete_connection_button'));

        expect(context.handleDelete).toHaveBeenCalledTimes(1);
        expect(nativeDialogs).toEqual([]);
    });

    it('deletes nothing when cancelled', async () => {
        await render(ConnectionView);
        await click(button('🗑️Verwijderen'));
        await click(button('cancel_button'));

        expect(context.handleDelete).not.toHaveBeenCalled();
        expect(container.textContent).not.toContain('confirm_delete_connection_message');
    });
});
