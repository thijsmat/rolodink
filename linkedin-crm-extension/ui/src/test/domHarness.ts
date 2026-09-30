import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';

/**
 * Renders a popup component into a detached div and drives it the way a user
 * would. Shared by the component tests so each file keeps only its own mocks
 * and cases.
 */
export function createDomHarness() {
    let container: HTMLDivElement | null = null;
    let root: Root | null = null;
    let current: (() => unknown) | null = null;

    const el = (): HTMLDivElement => {
        if (!container) throw new Error('render() first');
        return container;
    };

    const settle = () => act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
    });

    return {
        get container() {
            return el();
        },
        settle,
        async render(component: () => unknown) {
            container = document.createElement('div');
            document.body.appendChild(container);
            root = createRoot(container);
            current = component;
            await act(async () => {
                root?.render(createElement(component as () => null));
            });
        },
        // Same component again: a re-render with whatever the context now holds.
        async rerender() {
            await act(async () => {
                if (current) root?.render(createElement(current as () => null));
            });
        },
        async unmount() {
            await act(async () => root?.unmount());
            root = null;
            current = null;
            container?.remove();
            container = null;
        },
        button(text: string): HTMLButtonElement {
            const found = [...el().querySelectorAll('button')].find(b => b.textContent?.trim() === text);
            if (!found) throw new Error(`no button "${text}"`);
            return found;
        },
        async click(target: HTMLElement) {
            await act(async () => {
                target.dispatchEvent(new MouseEvent('click', { bubbles: true }));
            });
            await settle();
        },
        // React tracks an input's value itself; set it through the native
        // setter so the change event is not swallowed.
        async type(input: HTMLInputElement, value: string) {
            const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
            await act(async () => {
                setter?.call(input, value);
                input.dispatchEvent(new Event('input', { bubbles: true }));
            });
        },
    };
}
