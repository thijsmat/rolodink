// src/app/api/connections/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/supabase/server';
import { rateLimitMiddleware } from '@/lib/rate-limit';
import { buildCorsHeaders } from '@/lib/cors';
import { handlePrismaError } from '@/lib/prisma-error-handler';
import { revalidateTag } from 'next/cache';

export async function OPTIONS(request: NextRequest) {
  return new Response(null, { headers: buildCorsHeaders(request) });
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Rate limiting
  const rateLimitResponse = rateLimitMiddleware(request);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  const corsHeaders = buildCorsHeaders(request);

  try {
    const { user } = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });
    }

    const { id: connectionId } = await params;

    if (!connectionId) {
      return NextResponse.json({ error: 'Connection ID is required' }, { status: 400, headers: corsHeaders });
    }

    // Get the connection first, then verify ownership
    const connection = await prisma.connection.findUnique({
      where: {
        id: connectionId,
      },
    });

    if (!connection) {
      return NextResponse.json(
        { error: 'Connection not found' },
        { status: 404, headers: corsHeaders }
      );
    }

    // Security: verify that the connection belongs to the user
    if (connection.ownerId !== user.id) {
      return NextResponse.json(
        { error: 'No permission to access this connection' },
        { status: 403, headers: corsHeaders }
      );
    }

    return NextResponse.json(connection, { status: 200, headers: corsHeaders });

  } catch (err) {
    const errorResponse = handlePrismaError(err, corsHeaders, 'Error fetching connection');
    if (errorResponse.handled) {
      return errorResponse.response;
    }
    // Fallback for unhandled errors
    console.error('Error fetching connection:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id: connectionId } = await params;

    if (!connectionId) {
      return NextResponse.json({ error: 'Connection ID is required' }, { status: 400, headers: corsHeaders });
    }

    // Attempt delete in a single round-trip (ownership check in filter)
    const deleteResult = await prisma.connection.deleteMany({
      where: {
        id: connectionId,
        ownerId: user.id,
      },
    });

    if (deleteResult.count === 0) {
      // Determine whether the record is missing or user lacks access
      const connection = await prisma.connection.findUnique({
        where: { id: connectionId },
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
          { error: 'No permission to delete this connection' },
          { status: 403, headers: corsHeaders }
        );
      }

      // Fallback for unexpected failure
      return NextResponse.json(
        { error: 'Could not delete connection' },
        { status: 500, headers: corsHeaders }
      );
    }
    // Invalidate cache for this user's connections
    revalidateTag(`connections-${user.id}`);

    return NextResponse.json(
      { message: 'Connection deleted' },
      { status: 200, headers: corsHeaders }
    );

  } catch (err) {
    const errorResponse = handlePrismaError(err, corsHeaders, 'Error deleting connection');
    if (errorResponse.handled) {
      return errorResponse.response;
    }
    // Fallback for unhandled errors
    console.error('Error deleting connection:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    );
  }
}
