// src/app/api/auth/signup/route.ts
import { NextResponse, NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { rateLimitMiddleware } from '@/lib/rate-limit';
import { buildCorsHeaders } from '@/lib/cors';

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
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email en wachtwoord zijn verplicht' }, { status: 400, headers: corsHeaders });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data, error } = await supabase.auth.signUp({ email, password });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400, headers: corsHeaders });
    }

    return NextResponse.json(
      {
        user: data.user,
        session: data.session,
        message: data.session ? 'Signed up and logged in' : 'Signed up; please check your email to confirm',
      },
      { status: 200, headers: corsHeaders }
    );
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500, headers: corsHeaders });
  }
}