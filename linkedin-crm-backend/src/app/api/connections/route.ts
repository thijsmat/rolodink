// src/app/api/connections/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/supabase/server';
import { rateLimitMiddleware } from '@/lib/rate-limit';
import { buildCorsHeaders } from '@/lib/cors';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { handlePrismaError } from '@/lib/prisma-error-handler';
import { profileLookupUrl } from '@rolodink/core/url';
import { findOwnedConnectionByUrl } from '@/lib/connection-url';

const DUPLICATE_URL_MESSAGE = 'Connectie bestaat al voor deze URL.';

// Validation schema for creating a connection
const createConnectionSchema = z.object({
  name: z.string().min(1),
  url: z.string().url(),
  meetingPlace: z.string().optional(),
  notes: z.string().optional(),
  userCompanyAtTheTime: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
});

// Validation schema for updating a connection (all fields optional).
// The optional fields are .nullable() because clients clear a field by sending
// null: the extension's own handleUpdate sends `field ?? null`, which this
// schema used to reject with a 400, so clearing a field was simply broken.
const updateConnectionSchema = z.object({
  name: z.string().min(1).optional(),
  url: z.string().url().optional(),
  meetingPlace: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  userCompanyAtTheTime: z.string().nullable().optional(),
  email: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
});

// Function to clean notification counts from profile names
function cleanProfileName(name: string): string {
  if (!name) return name;

  // Normalize whitespace (including non-breaking spaces)
  let cleaned = name.replace(/\u00A0/g, ' ');

  const patterns: RegExp[] = [
    // Leading counters: (1) [2] {3}
    /^[\s\u00A0]*[\(\[\{]\s*\d+\s*[\)\]\}]\s*/,
    // Leading numbers like: 1 John, 12· John, 3. John
    /^[\s\u00A0]*\d+[\s\u00A0]*[\.|·•:\-]*[\s\u00A0]*/,
    // Trailing counters at end: John Doe (1)
    /[\s\u00A0]*[\(\[\{]\s*\d+\s*[\)\]\}]\s*$/,
    // Inline counters: John (1) Doe
    /[\s\u00A0]*[\(\[\{]\s*\d+\s*[\)\]\}][\s\u00A0]*/g,
  ];

  for (const pattern of patterns) {
    cleaned = cleaned.replace(pattern, ' ');
  }

  return cleaned.replace(/\s+/g, ' ').trim();
}

// buildCorsHeaders now imported from @/lib/cors with secure whitelisting

export async function OPTIONS(request: NextRequest) {
  return new Response(null, { headers: buildCorsHeaders(request) });
}

// GET functie - Haal alle connecties op voor de ingelogde gebruiker
export async function GET(request: NextRequest) {
  // Rate limiting
  const rateLimitResponse = rateLimitMiddleware(request);
  if (rateLimitResponse) {
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
    const { user } = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });
    }

    // Haal URL parameter op voor filtering
    const { searchParams } = new URL(request.url);
    // Straight from the database, no cache (an unstable_cache here used to
    // go stale). Any spelling of a profile URL finds the row: the canonical
    // key, and rows stored before writes were canonicalised - see
    // findOwnedConnectionByUrl. Still answers with a list, which is what
    // every client expects.
    const rawUrl = searchParams.get('url');
    let connections;
    if (rawUrl) {
      const connection = await findOwnedConnectionByUrl(user.id, rawUrl);
      connections = connection ? [connection] : [];
    } else {
      connections = await prisma.connection.findMany({
        where: { ownerId: user.id },
        orderBy: { createdAt: 'desc' },
      });
    }

    return NextResponse.json(connections, { status: 200, headers: corsHeaders });

  } catch (err) {
    console.error('Fout bij het ophalen van connecties:', err);
    return NextResponse.json({ error: 'Er is een interne serverfout opgetreden' }, { status: 500, headers: corsHeaders });
  }
}

// POST functie - Maak een nieuwe connectie aan
export async function POST(request: NextRequest) {
  // Rate limiting
  const rateLimitResponse = rateLimitMiddleware(request);
  if (rateLimitResponse) {
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
    const { user } = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });
    }

    const body = await request.json();

    // Validate input with Zod
    const validation = createConnectionSchema.safeParse(body);
    if (!validation.success) {
      const flattened = validation.error.flatten();
      return NextResponse.json(
        { error: 'Validation failed', errors: flattened.fieldErrors, formErrors: flattened.formErrors },
        { status: 400, headers: corsHeaders }
      );
    }

    // Use validated data
    const { name, url, meetingPlace, notes, userCompanyAtTheTime, email, phone } = validation.data;

    // One key per profile (see @rolodink/core profileLookupUrl). The unique
    // index only compares exact strings, so a row stored before this under
    // another spelling of the same URL is checked for explicitly; it answers
    // the same 409 a unique conflict does.
    const normalizedUrl = profileLookupUrl(url);
    if (await findOwnedConnectionByUrl(user.id, url)) {
      return NextResponse.json({ error: DUPLICATE_URL_MESSAGE }, { status: 409, headers: corsHeaders });
    }
    const cleanedName = cleanProfileName(name);

    const newConnection = await prisma.connection.create({
      data: {
        name: cleanedName,
        linkedInUrl: normalizedUrl,
        meetingPlace,
        notes,
        userCompanyAtTheTime,
        email,
        phone,
        ownerId: user.id,
      },
    });

    return NextResponse.json(newConnection, { status: 201, headers: corsHeaders });

  } catch (err: unknown) {
    // Handle specific P2002 error with custom Dutch message for this route
    if (err instanceof PrismaClientKnownRequestError && err.code === 'P2002') {
      return NextResponse.json(
        { error: DUPLICATE_URL_MESSAGE },
        { status: 409, headers: corsHeaders }
      );
    }

    // Fallback to generic handler for all other errors
    const errorResponse = handlePrismaError(err, corsHeaders, 'Er is een interne serverfout opgetreden');
    return errorResponse.response;
  }
}

// Turns a validated PATCH body into Prisma update data. `url` is the API's
// name for the linkedInUrl column: stored canonical, and refused (null) when it
// would make this row a second one for a profile the owner already has.
async function buildUpdateData(
  ownerId: string,
  id: string,
  validated: z.infer<typeof updateConnectionSchema>,
): Promise<Prisma.ConnectionUpdateInput | null> {
  const { url: newUrl, ...rest } = validated;
  const data: Prisma.ConnectionUpdateInput = { ...rest };
  if (newUrl) {
    const other = await findOwnedConnectionByUrl(ownerId, newUrl);
    if (other && other.id !== id) {
      return null;
    }
    data.linkedInUrl = profileLookupUrl(newUrl);
  }
  // Clean the name if it's being updated
  if (rest.name) {
    data.name = cleanProfileName(rest.name);
  }
  return data;
}

// NIEUWE PATCH FUNCTIE
export async function PATCH(request: NextRequest) {
  // Rate limiting
  const rateLimitResponse = rateLimitMiddleware(request);
  if (rateLimitResponse) {
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
    const { user } = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });
    }

    const body = await request.json();
    const { id, ...updateData } = body; // Haal ID en de rest van de data uit de body

    if (typeof id !== 'string' || !id) {
      return NextResponse.json({ error: 'Connection ID is verplicht' }, { status: 400, headers: corsHeaders });
    }

    // Validate input with Zod
    const validation = updateConnectionSchema.safeParse(updateData);
    if (!validation.success) {
      const flattened = validation.error.flatten();
      return NextResponse.json(
        { error: 'Validation failed', errors: flattened.fieldErrors, formErrors: flattened.formErrors },
        { status: 400, headers: corsHeaders }
      );
    }

    const data = await buildUpdateData(user.id, id, validation.data);
    if (!data) {
      return NextResponse.json({ error: DUPLICATE_URL_MESSAGE }, { status: 409, headers: corsHeaders });
    }

    // One round-trip: ownership is part of the unique filter. Only when that
    // finds nothing (P2025) is a second query needed, to tell 404 from 403.
    let updatedConnection;
    try {
      updatedConnection = await prisma.connection.update({
        where: { id, ownerId: user.id },
        data,
      });
    } catch (updateError) {
      if (!(updateError instanceof PrismaClientKnownRequestError && updateError.code === 'P2025')) {
        throw updateError;
      }
      const connection = await prisma.connection.findUnique({
        where: { id },
        select: { ownerId: true },
      });
      return connection
        ? NextResponse.json({ error: 'No permission to update this connection' }, { status: 403, headers: corsHeaders })
        : NextResponse.json({ error: 'Connection not found' }, { status: 404, headers: corsHeaders });
    }

    return NextResponse.json(updatedConnection, { status: 200, headers: corsHeaders });

  } catch (err) {
    const errorResponse = handlePrismaError(err, corsHeaders, 'Er is een interne serverfout opgetreden');
    if (errorResponse.handled) {
      return errorResponse.response;
    }
    // Fallback for unhandled errors
    console.error('Fout bij het updaten van de connectie:', err);
    return NextResponse.json({ error: 'Er is een interne serverfout opgetreden' }, { status: 500, headers: corsHeaders });
  }
}