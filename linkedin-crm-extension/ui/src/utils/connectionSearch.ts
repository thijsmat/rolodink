import type { Connection } from '../context/ConnectionContext';
import { onlyDigits } from './contactLinks';

type Searchable = Pick<Connection, 'name' | 'meetingPlace' | 'userCompanyAtTheTime' | 'notes' | 'email' | 'phone'>;

const TEXT_FIELDS = ['name', 'meetingPlace', 'userCompanyAtTheTime', 'notes', 'email', 'phone'] as const;

/**
 * True when a connection matches the search box: the query, in any case, in
 * one of its decrypted fields. A query with three or more digits also matches
 * a phone number written with other spacing ("0612" finds "06 12 34 56 78").
 */
export function matchesSearch(conn: Readonly<Searchable>, query: string): boolean {
    const needle = query.trim().toLowerCase();
    if (!needle) return true;
    if (TEXT_FIELDS.some(field => conn[field]?.toLowerCase().includes(needle))) return true;
    const digits = onlyDigits(needle);
    return digits.length >= 3 && !!conn.phone && onlyDigits(conn.phone).includes(digits);
}
