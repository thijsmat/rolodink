import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/supabase/server';
import prisma from '@/lib/prisma';

export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin');
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': origin || '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

export async function GET(request: NextRequest) {
  try {
    const origin = request.headers.get('origin');
    
    // Authenticate user
    const { user, error: authError } = await getUserFromRequest(request);
    if (authError || !user) {
      return NextResponse.json(
        { error: authError || 'Unauthorized' },
        { 
          status: 401,
          headers: {
            'Access-Control-Allow-Origin': origin || '*',
          },
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
          headers: {
            'Access-Control-Allow-Origin': origin || '*',
          },
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
          headers: {
            'Access-Control-Allow-Origin': origin || '*',
          },
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
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Access-Control-Allow-Origin': origin || '*',
      },
    });

  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { 
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': request.headers.get('origin') || '*',
        },
      }
    );
  }
}

