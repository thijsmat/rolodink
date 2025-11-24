// src/app/api/connections/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/supabase/server';
import { rateLimitMiddleware } from '@/lib/rate-limit';
import { buildCorsHeaders } from '@/lib/cors';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { handlePrismaError } from '@/lib/prisma-error-handler';
import { unstable_cache } from 'next/cache';
import { revalidateTag } from 'next/cache';

// Validation schema for creating a connection
const createConnectionSchema = z.object({
  name: z.string().min(1),
  url: z.string().url(),
  meetingPlace: z.string().optional(),
  notes: z.string().optional(),
  userCompanyAtTheTime: z.string().optional(),
});

// Validation schema for updating a connection (all fields optional)
const updateConnectionSchema = z.object({
  name: z.string().min(1).optional(),
  url: z.string().url().optional(),
  meetingPlace: z.string().optional(),
  notes: z.string().optional(),
  userCompanyAtTheTime: z.string().optional(),
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
    const url = searchParams.get('url');

    // Create cache key based on user ID and optional URL filter
    const cacheKey = url ? `connections-${user.id}-${url}` : `connections-${user.id}`;

    // Use unstable_cache to cache the database query
    const getCachedConnections = unstable_cache(
      async (userId: string, urlFilter?: string | null) => {
        const whereClause: { ownerId: string; linkedInUrl?: string } = { ownerId: userId };

        // Als er een URL parameter is, filter op die URL
        if (urlFilter) {
          whereClause.linkedInUrl = urlFilter;
        }

        return await prisma.connection.findMany({
          where: whereClause,
          orderBy: { createdAt: 'desc' }
        });
      },
      [cacheKey], // Cache key includes user ID and URL filter
      {
        tags: [`connections-${user.id}`], // Tag for cache invalidation
        revalidate: 60, // Revalidate every 60 seconds
      }
    );

    const connections = await getCachedConnections(user.id, url);

    return NextResponse.json(connections, { status: 200, headers: corsHeaders });

  } catch (err) {
    console.error('Fout bij het ophalen van connecties:', err);
    return NextResponse.json({ error: 'Er is een interne serverfout opgetreden' }, { status: 500, headers: corsHeaders });
  }
}

function normalizeLinkedInUrl(rawUrl: string): string {
  try {
    const url = new URL(rawUrl);
    // Force hostname to canonical LinkedIn host
    // Only allow linkedin.com hosts
    if (!/\.linkedin\.com$/.test(url.hostname) && url.hostname !== 'linkedin.com') {
      return rawUrl;
    }
    // Remove query and hash
    url.search = '';
    url.hash = '';
    // Ensure we only keep the path to the profile and trim trailing slash
    let pathname = url.pathname.trim();
    if (pathname.endsWith('/')) pathname = pathname.slice(0, -1);
    url.pathname = pathname;
    return url.toString();
  } catch {
    return rawUrl;
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
    const { name, url, meetingPlace, notes, userCompanyAtTheTime } = validation.data;

    const normalizedUrl = normalizeLinkedInUrl(url);
    const cleanedName = cleanProfileName(name);

    const newConnection = await prisma.connection.create({
      data: {
        name: cleanedName,
        linkedInUrl: normalizedUrl,
        meetingPlace,
        notes,
        userCompanyAtTheTime,
        ownerId: user.id,
      },
    });

    // Invalidate cache for this user's connections
    revalidateTag(`connections-${user.id}`);

    return NextResponse.json(newConnection, { status: 201, headers: corsHeaders });

  } catch (err: unknown) {
    // Handle specific P2002 error with custom Dutch message for this route
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      return NextResponse.json(
        { error: 'Connectie bestaat al voor deze URL.' },
        { status: 409, headers: corsHeaders }
      );
    }

    // Fallback to generic handler for all other errors
    const errorResponse = handlePrismaError(err, corsHeaders, 'Er is een interne serverfout opgetreden');
    return errorResponse.response;
  }
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

    if (!id) {
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

    // Use validated data
    const validatedUpdateData = { ...validation.data };

    // Clean the name if it's being updated
    if (validatedUpdateData.name) {
      validatedUpdateData.name = cleanProfileName(validatedUpdateData.name);
    }

    // Try update in single round-trip (ownership in filter)
    const updateResult = await prisma.connection.updateMany({
      where: {
        id: id,
        ownerId: user.id,
      },
      data: validatedUpdateData,
    });

    if (updateResult.count === 0) {
      const connection = await prisma.connection.findUnique({
        where: { id: id },
        select: { ownerId: true },
      });

      if (!connection) {
        return NextResponse.json(
          { error: 'Connection not found' },
          { status: 404, headers: corsHeaders }
        );
      }

      if (connection.ownerId !== user.id) {
        return NextResponse.json(
          { error: 'No permission to update this connection' },
          { status: 403, headers: corsHeaders }
        );
      }

      return NextResponse.json(
        { error: 'Could not update connection' },
        { status: 500, headers: corsHeaders }
      );
    }

    const updatedConnection = await prisma.connection.findUnique({
      where: { id: id },
    });

    if (!updatedConnection) {
      return NextResponse.json(
        { error: 'Connection not found after update' },
        { status: 404, headers: corsHeaders }
      );
    }
    // Invalidate cache for this user's connections
    revalidateTag(`connections-${user.id}`);

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