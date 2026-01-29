// src/app/api/auth/signin/route.ts
import { NextResponse, NextRequest } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { rateLimitMiddleware } from '@/lib/rate-limit';
import { buildCorsHeaders } from '@/lib/cors';
import { z } from 'zod';

// Validation schema for signin
const signInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export async function OPTIONS(request: NextRequest) {
  return new Response(null, { headers: buildCorsHeaders(request) });
}

export async function POST(request: NextRequest) {
  // Rate limiting (especially important for auth endpoints)
  const rateLimitResponse = rateLimitMiddleware(request);
  if (rateLimitResponse) {
    // Add CORS headers to rate limit response
    const corsHeaders = buildCorsHeaders(request);
    const responseHeaders = new Headers(rateLimitResponse.headers);
    Object.entries(corsHeaders).forEach(([key, value]) => {
      if (value) responseHeaders.set(key, value);
    });
    return new Response(rateLimitResponse.body, {
      status: rateLimitResponse.status,
      headers: responseHeaders,
    });
  }

  const corsHeaders = buildCorsHeaders(request);

  try {
    const body = await request.json();

    // Validate input with Zod
    const validation = signInSchema.safeParse(body);
    if (!validation.success) {
      const flattened = validation.error.flatten();
      return NextResponse.json(
        { error: 'Validation failed', errors: flattened.fieldErrors, formErrors: flattened.formErrors },
        { status: 400, headers: corsHeaders }
      );
    }

    // Use validated data
    const { email, password } = validation.data;

    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error || !data.session) {
      return NextResponse.json({ error: error?.message ?? 'Invalid credentials' }, { status: 401, headers: corsHeaders });
    }

    return NextResponse.json(
      { session: data.session },
      { status: 200, headers: corsHeaders }
    );
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500, headers: corsHeaders });
  }
}