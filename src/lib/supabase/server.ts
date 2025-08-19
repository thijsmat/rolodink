import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export function createSupabaseServerClient() {
	return createClient(supabaseUrl, supabaseAnonKey);
}

export async function getUserFromRequest(request: Request) {
	const authHeader = request.headers.get('authorization') || request.headers.get('Authorization');
	if (!authHeader || !authHeader.toLowerCase().startsWith('bearer ')) {
		return { user: null, error: 'Missing or invalid Authorization header' as const };
	}

	const accessToken = authHeader.split(' ')[1];
	const supabase = createSupabaseServerClient();

	const { data, error } = await supabase.auth.getUser(accessToken);
	if (error || !data?.user) {
		return { user: null, error: error?.message ?? 'Invalid token' as const };
	}

	return { user: data.user, error: null as const };
}


