import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getUserFromRequest } from '@/lib/supabase/server';
import { rateLimitMiddleware } from '@/lib/rate-limit';
import { buildCorsHeaders } from '@/lib/cors';

const prisma = new PrismaClient();

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: buildCorsHeaders(request),
  });
}

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

  try {
    const corsHeaders = buildCorsHeaders(request);
    
    // Authenticate user
    const { user, error: authError } = await getUserFromRequest(request);
    if (authError || !user) {
      return NextResponse.json(
        { error: authError || 'Unauthorized' },
        { 
          status: 401,
          headers: corsHeaders,
        }
      );
    }

    // Fetch all user data
    const userData = await prisma.user.findUnique({
      where: {
        id: user.id,
      },
      include: {
        connections: {
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!userData) {
      return NextResponse.json(
        { error: 'User not found' },
        { 
          status: 404,
          headers: corsHeaders,
        }
      );
    }

    // Check data size limits (prevent excessive exports)
    const MAX_CONNECTIONS = 10000;
    if (userData.connections.length > MAX_CONNECTIONS) {
      return NextResponse.json(
        { error: `Export limit exceeded. Maximum ${MAX_CONNECTIONS} connections allowed.` },
        { 
          status: 413,
          headers: corsHeaders,
        }
      );
    }

    // Sanitize and prepare export data
    const sanitizeString = (str: string | null): string => {
      if (!str) return '';
      return str.replace(/[\x00-\x1F\x7F]/g, '').trim(); // Remove control characters
    };

    const exportData = {
      user: {
        id: userData.id,
        email: sanitizeString(userData.email),
        createdAt: userData.created_at?.toISOString(),
        updatedAt: userData.updated_at?.toISOString(),
      },
      connections: userData.connections.map(connection => ({
        id: connection.id,
        name: sanitizeString(connection.name),
        linkedInUrl: sanitizeString(connection.linkedInUrl),
        meetingPlace: sanitizeString(connection.meetingPlace),
        userCompanyAtTheTime: sanitizeString(connection.userCompanyAtTheTime),
        notes: sanitizeString(connection.notes),
        createdAt: connection.createdAt.toISOString(),
        updatedAt: connection.updatedAt.toISOString(),
      })),
      exportInfo: {
        exportedAt: new Date().toISOString(),
        totalConnections: userData.connections.length,
        version: '1.0',
      },
    };

    // Create filename with timestamp
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `linkedin-crm-export-${timestamp}.json`;

    // Return JSON file
    return new NextResponse(JSON.stringify(exportData, null, 2), {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });

  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { 
        status: 500,
        headers: buildCorsHeaders(request),
      }
    );
  }
}

