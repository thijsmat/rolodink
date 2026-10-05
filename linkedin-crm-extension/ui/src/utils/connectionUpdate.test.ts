import { describe, expect, it } from 'vitest';
import type { ConnectionFormData } from '../context/ConnectionContext';
import { LOCKED_FIELD_PLACEHOLDER, contactFieldEdits, isUnreadableValue, pickFieldsToUpdate } from './connectionUpdate';

// The same five fields as SENSITIVE_FIELDS in @rolodink/core, spelled out so
// this file needs nothing beyond the module under test.
const FIELDS = ['notes', 'meetingPlace', 'userCompanyAtTheTime', 'email', 'phone'] as const;

describe('pickFieldsToUpdate', () => {
    it('leaves out the fields the edit form does not have', () => {
        // What ConnectionForm submits when email and phone were not touched.
        const { fields } = pickFieldsToUpdate(
            { meetingPlace: 'Conf', userCompanyAtTheTime: 'Acme', notes: 'Met at the booth' },
            FIELDS,
        );

        expect(fields).toEqual({ meetingPlace: 'Conf', userCompanyAtTheTime: 'Acme', notes: 'Met at the booth' });
        expect('email' in fields).toBe(false);
        expect('phone' in fields).toBe(false);
    });

    it('keeps an emptied field, because clearing is an edit', () => {
        const { fields } = pickFieldsToUpdate({ notes: '', meetingPlace: null }, FIELDS);

        expect(fields).toEqual({ notes: '', meetingPlace: null });
    });

    it('leaves out an untouched locked field and reports it', () => {
        const { fields, skippedUnreadable } = pickFieldsToUpdate(
            { notes: LOCKED_FIELD_PLACEHOLDER, meetingPlace: 'Conf' },
            FIELDS,
        );

        expect(fields).toEqual({ meetingPlace: 'Conf' });
        expect(skippedUnreadable).toEqual(['notes']);
    });

    it('leaves out a locked field with text typed around the placeholder', () => {
        const { fields, skippedUnreadable } = pickFieldsToUpdate(
            { notes: `${LOCKED_FIELD_PLACEHOLDER} and call back Friday` },
            FIELDS,
        );

        expect(fields).toEqual({});
        expect(skippedUnreadable).toEqual(['notes']);
    });

    it('saves a locked field the user replaced completely', () => {
        const { fields, skippedUnreadable } = pickFieldsToUpdate({ notes: 'A new note' }, FIELDS);

        expect(fields).toEqual({ notes: 'A new note' });
        expect(skippedUnreadable).toEqual([]);
    });

    it('leaves out raw ciphertext, which would be encrypted a second time', () => {
        const { fields, skippedUnreadable } = pickFieldsToUpdate(
            { email: 'rolodink-enc:v1:abc', phone: '+31 6 1234 5678' },
            FIELDS,
        );

        expect(fields).toEqual({ phone: '+31 6 1234 5678' });
        expect(skippedUnreadable).toEqual(['email']);
    });

    it('only picks the listed fields', () => {
        const formData: ConnectionFormData = { notes: 'x', is_encrypted: true };
        const { fields } = pickFieldsToUpdate(formData, FIELDS);

        expect(fields).toEqual({ notes: 'x' });
    });
});

describe('isUnreadableValue', () => {
    it('is false for ordinary text, empty text and non-strings', () => {
        expect(isUnreadableValue('Met at the booth')).toBe(false);
        expect(isUnreadableValue('')).toBe(false);
        expect(isUnreadableValue(null)).toBe(false);
        expect(isUnreadableValue(undefined)).toBe(false);
    });

    it('does not treat the ciphertext prefix in the middle of a note as ciphertext', () => {
        expect(isUnreadableValue('see rolodink-enc: docs')).toBe(false);
    });
});

describe('contactFieldEdits', () => {
    const stored = { email: 'jane@example.com', phone: '+31 6 1234 5678' };

    it('sends nothing for fields the user did not touch', () => {
        expect(contactFieldEdits(stored, { ...stored })).toEqual({});
    });

    it('sends nothing when only surrounding whitespace changed', () => {
        expect(contactFieldEdits(stored, { email: ' jane@example.com ', phone: '+31 6 1234 5678\t' })).toEqual({});
    });

    it('sends a changed field, trimmed, and leaves the other out', () => {
        expect(contactFieldEdits(stored, { email: ' jane@acme.com ', phone: stored.phone })).toEqual({ email: 'jane@acme.com' });
    });

    it('sends null for a field the user emptied, which clears it', () => {
        expect(contactFieldEdits(stored, { email: '', phone: '   ' })).toEqual({ email: null, phone: null });
    });

    it('does not clear what the form was opened without', () => {
        // A baseline without these fields: the inputs start empty and stay so.
        expect(contactFieldEdits({}, { email: '', phone: '' })).toEqual({});
        expect(contactFieldEdits(undefined, { email: '', phone: '' })).toEqual({});
    });

    it('leaves an untouched locked field out', () => {
        const locked = { email: LOCKED_FIELD_PLACEHOLDER, phone: stored.phone };
        expect(contactFieldEdits(locked, { ...locked })).toEqual({});
    });

    it('sends both when a new connection gets them', () => {
        expect(contactFieldEdits(undefined, { email: 'bob@example.com', phone: '0612345678' }))
            .toEqual({ email: 'bob@example.com', phone: '0612345678' });
    });
});
