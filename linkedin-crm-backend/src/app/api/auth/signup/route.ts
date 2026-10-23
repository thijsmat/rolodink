// src/app/api/auth/signup/route.ts
import { NextResponse, NextRequest } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { AUTH_RATE_LIMIT, rateLimitMiddleware } from '@/lib/rate-limit';
import { buildCorsHeaders } from '@/lib/cors';
import { z } from 'zod';
import { isPwnedPassword } from '@rolodink/core/pwned-password';
import { MIN_PASSWORD_LENGTH } from '@rolodink/core/password';

// Validation schema for signup
const signUpSchema = z.object({
  email: z.string().email(),
  password: z
    .string()
    .min(MIN_PASSWORD_LENGTH, `Password must be at least ${MIN_PASSWORD_LENGTH} characters`),
  receivesUpdates: z.boolean().optional().default(false),
});

export async function OPTIONS(request: NextRequest) {
  return new Response(null, { headers: buildCorsHeaders(request) });
}

export async function POST(request: NextRequest) {
  // Rate limiting (especially important for auth endpoints): a separate,
  // stricter counter than the rest of the API, see AUTH_RATE_LIMIT.
  const rateLimitResponse = await rateLimitMiddleware(request, AUTH_RATE_LIMIT);
  if (rateLimitResponse) return rateLimitResponse;

  const corsHeaders = buildCorsHeaders(request);

  try {
    const body = await request.json();

    // Validate input with Zod
    const validation = signUpSchema.safeParse(body);
    if (!validation.success) {
      const flattened = validation.error.flatten();
      return NextResponse.json(
        { error: 'Validation failed', errors: flattened.fieldErrors, formErrors: flattened.formErrors },
        { status: 400, headers: corsHeaders }
      );
    }

    // Use validated data
    const { email, password, receivesUpdates } = validation.data;

    // Supabase's own leaked-password protection needs a paid plan, so the
    // check runs here (k-anonymity: only a hash prefix leaves the server). It
    // fails open, so an outage at Have I Been Pwned never blocks a sign-up.
    if (await isPwnedPassword(password)) {
      return NextResponse.json(
        {
          error: 'This password has appeared in a data breach. Please choose a different password.',
          code: 'password_pwned',
        },
        { status: 400, headers: corsHeaders }
      );
    }

    const supabase = await createSupabaseServerClient();
    const emailRedirectTo =
      process.env.EMAIL_CONFIRMATION_REDIRECT_TO ?? 'https://rolodink.app/auth/callback';
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo,
        data: {
          receives_updates: receivesUpdates,
        },
      },
    });

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