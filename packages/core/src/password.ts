/**
 * Password rules shared by every place a password is set: backend sign-up,
 * website sign-up and the extension's password change. The leaked-password
 * check lives in pwned-password.ts.
 *
 * Supabase enforces its own minimum as well; keep the project setting (Auth >
 * Providers > Email) at this value or higher, since the website and the
 * extension's password change talk to Supabase directly.
 */
export const MIN_PASSWORD_LENGTH = 8;
