import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function createSupabaseServerClient() {
	const cookieStore = await cookies();

	return createServerClient(supabaseUrl, supabaseAnonKey, {
		cookies: {
			getAll() {
				return cookieStore.getAll();
			},
			setAll(cookiesToSet) {
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

export async function getUserFromRequest(request: Request) {
	// First try to get user from cookies (SSR method)
	const supabase = await createSupabaseServerClient();
	const { data: cookieData, error: cookieError } = await supabase.auth.getUser();

	if (cookieData?.user && !cookieError) {
		return { user: cookieData.user, error: null };
	}

	// Fallback to Authorization header for backward compatibility
	const authHeader = request.headers.get('authorization') || request.headers.get('Authorization');
	if (authHeader && authHeader.toLowerCase().startsWith('bearer ')) {
		const accessToken = authHeader.split(' ')[1];
		const { data, error } = await supabase.auth.getUser(accessToken);

		if (error || !data?.user) {
			return { user: null, error: error?.message ?? 'Invalid token' };
		}

		return { user: data.user, error: null };
	}

	return { user: null, error: 'Missing or invalid Authorization header' };
}


