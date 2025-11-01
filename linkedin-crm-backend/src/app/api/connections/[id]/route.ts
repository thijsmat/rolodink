// src/app/api/connections/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getUserFromRequest } from '@/lib/supabase/server';
import { rateLimitMiddleware } from '@/lib/rate-limit';
import { buildCorsHeaders } from '@/lib/cors';

const prisma = new PrismaClient();

export async function OPTIONS(request: NextRequest) {
  return new Response(null, { headers: buildCorsHeaders(request) });
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

    // Delete the connection, ensuring the user can only delete their own connections
    await prisma.connection.delete({
      where: {
        id: connectionId,
        ownerId: user.id, // Security: only allow deletion of own connections
      },
    });

    return NextResponse.json(
      { message: 'Connection deleted' },
      { status: 200, headers: corsHeaders }
    );

  } catch (err) {
    console.error('Error deleting connection:', err);
    
    // Handle case where connection doesn't exist or user doesn't have permission
    if (err instanceof Error && 'code' in err && err.code === 'P2025') {
      return NextResponse.json(
        { error: 'Connection not found or no permission to delete' },
        { status: 404, headers: corsHeaders }
      );
    }

    // Handle other Prisma errors
    if (err instanceof Error && 'code' in err) {
      console.error('Prisma error code:', err.code);
      return NextResponse.json(
        { error: `Database error: ${err.message}` },
        { status: 500, headers: corsHeaders }
      );
    }

    return NextResponse.json(
      { error: `Internal server error: ${err instanceof Error ? err.message : 'Unknown error'}` },
      { status: 500, headers: corsHeaders }
    );
  }
}
