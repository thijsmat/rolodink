// src/app/api/connections/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getUserFromRequest } from '@/lib/supabase/server';

const prisma = new PrismaClient();

const corsHeaders = {
  'Access-Control-Allow-Origin': 'chrome-extension://hidgijlndiamdghcfjloaihnakmllimd',
  'Access-Control-Allow-Methods': 'DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Credentials': 'true',
};

export async function OPTIONS() {
  return new Response(null, { headers: corsHeaders });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    );
  }
}
