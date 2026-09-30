import { describe, expect, it } from 'vitest';
import enMessagesRaw from '../../public/_locales/en/messages.json?raw';
import nlMessagesRaw from '../../public/_locales/nl/messages.json?raw';
import settingsViewSource from '../components/SettingsView.tsx?raw';
import { isDeleteConfirmation } from './deleteConfirmation';

const promptText = (raw: string): string => JSON.parse(raw).msg_delete_prompt.message;

describe('isDeleteConfirmation', () => {
    it('accepts the word each locale asks for', () => {
        expect(isDeleteConfirmation('DELETE')).toBe(true);
        expect(isDeleteConfirmation('VERWIJDER')).toBe(true);
    });

    it('accepts the word regardless of case and surrounding spaces', () => {
        expect(isDeleteConfirmation('delete')).toBe(true);
        expect(isDeleteConfirmation('  Verwijder ')).toBe(true);
    });

    it('rejects Cancel, an empty answer and anything else', () => {
        expect(isDeleteConfirmation(null)).toBe(false);
        expect(isDeleteConfirmation(undefined)).toBe(false);
        expect(isDeleteConfirmation('')).toBe(false);
        expect(isDeleteConfirmation('DELETE ME')).toBe(false);
        expect(isDeleteConfirmation('VERWIJDEREN')).toBe(false);
        expect(isDeleteConfirmation('yes')).toBe(false);
    });

    // The bug was a prompt asking for one word and a check wanting another.
    // Tie the check to what the prompts actually say, so a reworded prompt
    // cannot drift away from it again.
    it.each([
        ['en', promptText(enMessagesRaw)],
        ['nl', promptText(nlMessagesRaw)],
    ])('accepts the word the %s prompt quotes', (_locale, prompt) => {
        const quoted = prompt.match(/"([^"]+)"/)?.[1];

        expect(quoted).toBeTruthy();
        expect(isDeleteConfirmation(quoted)).toBe(true);
    });

    // Source text rather than behaviour, like auth-invariants.test.ts: the
    // settings view needs most of the extension mocked to render, and the bug
    // was one hardcoded word in it.
    it('is the check the settings view uses', () => {
        expect(settingsViewSource).toMatch(/isDeleteConfirmation\(verification\)/);
        expect(settingsViewSource).not.toMatch(/verification\s*[!=]==?\s*['"]/);
    });
});
