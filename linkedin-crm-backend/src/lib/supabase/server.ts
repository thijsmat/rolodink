import { createServerClient, type CookieOptions } from '@supabase/ssr';
import type { JwtPayload } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/** The only role a signed-in user's access token may carry. */
const AUTHENTICATED = 'authenticated';

export async function createSupabaseServerClient() {
	const cookieStore = await cookies();

	return createServerClient(supabaseUrl, supabaseAnonKey, {
		cookies: {
			getAll() {
				return cookieStore.getAll();
			},
			setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
				try {
					cookiesToSet.forEach(({ name, value, options }) => {
						cookieStore.set(name, value, options);
					});
				} catch (error) {
					// The `setAll` method was called from a Server Component.
					// This can be ignored if you have middleware refreshing
					// user sessions.
				}
			},
		},
	});
}

type SupabaseServerClient = Awaited<ReturnType<typeof createSupabaseServerClient>>;

/** What the route handlers get to know about the caller. They only use `id`. */
export interface AuthUser {
	id: string;
	email?: string;
}

export type AuthResult = { user: AuthUser; error: null } | { user: null; error: string };

export interface GetUserOptions {
	/**
	 * Ask Supabase Auth on every call (`getUser`) instead of verifying the JWT
	 * locally (`getClaims`). Only the Auth server knows whether the session was
	 * signed out or the user deleted; a locally verified token stays valid until
	 * it expires. Use it where acting on such a token would do real harm.
	 */
	strict?: boolean;
}

function expectedIssuer(): string {
	return `${new URL(supabaseUrl).origin}/auth/v1`;
}

function hasAuthenticatedAudience(aud: unknown): boolean {
	return aud === AUTHENTICATED || (Array.isArray(aud) && aud.includes(AUTHENTICATED));
}

function isWithinValidity(claims: JwtPayload, nowSeconds: number): boolean {
	if (typeof claims.exp !== 'number' || claims.exp <= nowSeconds) return false;
	return typeof claims.nbf !== 'number' || claims.nbf <= nowSeconds;
}

/**
 * Turns verified JWT claims into a user, or null when the token is not a
 * signed-in user's access token for this project. `getClaims` only checks the
 * signature and `exp`; the Auth server's `getUser` used to reject everything
 * else implicitly (anon and service_role keys have no user behind them), so
 * those checks are spelled out here.
 */
export function userFromClaims(claims: JwtPayload | null | undefined, nowSeconds = Math.floor(Date.now() / 1000)): AuthUser | null {
	if (!claims || typeof claims.sub !== 'string' || claims.sub === '') return null;
	if (claims.role !== AUTHENTICATED || !hasAuthenticatedAudience(claims.aud)) return null;
	if (claims.iss !== expectedIssuer() || !isWithinValidity(claims, nowSeconds)) return null;
	return { id: claims.sub, email: typeof claims.email === 'string' ? claims.email : undefined };
}

/**
 * Local verification. With asymmetric signing keys (ES256/RS256) `getClaims`
 * checks the signature against the project's JWKS (cached for 10 minutes) and
 * makes no Auth call; with the legacy HS256 secret it falls back to `getUser`
 * on the Auth server. Without `jwt` it reads the session from the cookies.
 */
async function verifyClaims(supabase: SupabaseServerClient, jwt?: string): Promise<AuthUser | null> {
	try {
		const { data, error } = await supabase.auth.getClaims(jwt);
		if (error || !data) return null;
		return userFromClaims(data.claims);
	} catch {
		// getClaims rethrows anything that is not an AuthError, such as a
		// payload that is not JSON or an unsupported `alg`. That is a bad token.
		return null;
	}
}

/** Server verification: also notices signed-out sessions and deleted users. */
async function verifyWithAuthServer(supabase: SupabaseServerClient, jwt?: string): Promise<AuthUser | null> {
	const { data, error } = await supabase.auth.getUser(jwt);
	if (error || !data?.user) return null;
	return { id: data.user.id, email: data.user.email };
}

function bearerToken(request: Request): string | null {
	const authHeader = request.headers.get('authorization');
	if (!authHeader?.toLowerCase().startsWith('bearer ')) return null;
	const token = authHeader.slice('bearer '.length).trim();
	// An empty token must not reach getClaims/getUser: without an argument they
	// fall back to the cookie session.
	return token === '' ? null : token;
}

export async function getUserFromRequest(request: Request, options: GetUserOptions = {}): Promise<AuthResult> {
	const verify = options.strict ? verifyWithAuthServer : verifyClaims;
	const supabase = await createSupabaseServerClient();

	// First the cookie session (SSR). No client sends cookies today, but
	// /api/auth/signin does set them on this domain.
	const cookieUser = await verify(supabase);
	if (cookieUser) {
		return { user: cookieUser, error: null };
	}

	// Then the Authorization header, which is what the extension uses.
	const accessToken = bearerToken(request);
	if (!accessToken) {
		return { user: null, error: 'Missing or invalid Authorization header' };
	}

	const user = await verify(supabase, accessToken);
	return user ? { user, error: null } : { user: null, error: 'Invalid token' };
}
