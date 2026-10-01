import { describe, expect, it } from 'vitest';
import { isOddEmail, looksLikeEmail, mailtoHref, telHref } from './contactLinks';
import { matchesSearch } from './connectionSearch';
import { LOCKED_FIELD_PLACEHOLDER } from './connectionUpdate';

describe('looksLikeEmail', () => {
    it('accepts ordinary addresses', () => {
        expect(looksLikeEmail('jane@example.com')).toBe(true);
        expect(looksLikeEmail(' jane.doe+crm@sub.example.co.uk ')).toBe(true);
    });

    it('rejects what is not shaped like one', () => {
        for (const value of ['', 'jane', 'jane@', '@example.com', 'jane@example', 'jane doe@example.com', LOCKED_FIELD_PLACEHOLDER]) {
            expect(looksLikeEmail(value)).toBe(false);
        }
    });
});

describe('isOddEmail', () => {
    it('is false for an empty field, which is simply no address', () => {
        expect(isOddEmail('')).toBe(false);
        expect(isOddEmail('   ')).toBe(false);
        expect(isOddEmail('jane@example.com')).toBe(false);
        expect(isOddEmail('jane at example')).toBe(true);
    });
});

describe('mailtoHref', () => {
    it('links an address', () => {
        expect(mailtoHref('jane@example.com')).toBe('mailto:jane@example.com');
    });

    it('encodes characters that would add headers or recipients', () => {
        const href = mailtoHref('jane?cc=boss&body=hi@example.com');
        expect(href).toBe('mailto:jane%3Fcc%3Dboss%26body%3Dhi@example.com');
        expect(href).not.toContain('?');
        expect(href).not.toContain('&');
    });

    it('gives no link for a value that is not an address', () => {
        expect(mailtoHref('javascript:alert(1)')).toBeNull();
        expect(mailtoHref(LOCKED_FIELD_PLACEHOLDER)).toBeNull();
        expect(mailtoHref(null)).toBeNull();
        expect(mailtoHref(undefined)).toBeNull();
    });
});

describe('telHref', () => {
    it('keeps only digits and a leading plus', () => {
        expect(telHref('+31 6-1234 5678')).toBe('tel:+31612345678');
        expect(telHref('06 12 34 56 78')).toBe('tel:0612345678');
    });

    it('drops the (0) trunk prefix after a country code', () => {
        expect(telHref('+31 (0)6-1234 5678')).toBe('tel:+31612345678');
        expect(telHref('+44 ( 0 )20 7946 0000')).toBe('tel:+442079460000');
        // Without a country code the 0 is part of the number.
        expect(telHref('(0)6 1234 5678')).toBe('tel:0612345678');
    });

    it('drops anything that is not a digit', () => {
        expect(telHref('12345;javascript:alert(1)')).toBe('tel:123451');
    });

    it('gives no link with fewer than three digits', () => {
        expect(telHref('n/a')).toBeNull();
        expect(telHref('12')).toBeNull();
        expect(telHref(LOCKED_FIELD_PLACEHOLDER)).toBeNull();
        expect(telHref(null)).toBeNull();
    });
});

describe('matchesSearch', () => {
    const jane = {
        name: 'Jane Doe',
        meetingPlace: 'Web Summit',
        userCompanyAtTheTime: 'Acme',
        notes: 'Hiring',
        email: 'jane@example.com',
        phone: '+31 6 1234 5678',
    };

    it('matches every decrypted field, in any case', () => {
        for (const query of ['jane', 'SUMMIT', 'acme', 'hiring', 'Example.COM', '1234 5678']) {
            expect(matchesSearch(jane, query)).toBe(true);
        }
    });

    it('matches a phone number written with other spacing', () => {
        expect(matchesSearch(jane, '612345')).toBe(true);
        expect(matchesSearch(jane, '6-1234-5678')).toBe(true);
    });

    it('does not match what is not there', () => {
        expect(matchesSearch(jane, 'bob@example.com')).toBe(false);
        expect(matchesSearch(jane, '999')).toBe(false);
        // Two digits are too few to match a phone number on.
        expect(matchesSearch({ name: 'Bob', phone: '0612' }, '61x')).toBe(false);
    });

    it('matches everything for an empty query, and copes with missing fields', () => {
        expect(matchesSearch({ name: 'Bob' }, '  ')).toBe(true);
        expect(matchesSearch({ name: 'Bob', email: null, phone: null }, 'bob@')).toBe(false);
    });
});
