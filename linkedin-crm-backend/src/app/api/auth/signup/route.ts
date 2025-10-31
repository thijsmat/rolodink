// src/app/api/auth/signup/route.ts
import { NextResponse, NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { rateLimitMiddleware } from '@/lib/rate-limit';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Credentials': 'false',
};

export async function OPTIONS() {
  return new Response(null, { headers: corsHeaders });
}

export async function POST(request: NextRequest) {
  // Rate limiting (especially important for auth endpoints)
  const rateLimitResponse = rateLimitMiddleware(request);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

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