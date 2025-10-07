import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getUserFromRequest } from '@/lib/supabase/server';

const prisma = new PrismaClient();

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

    // Prepare export data
    const exportData = {
      user: {
        id: userData.id,
        email: userData.email,
        createdAt: userData.created_at,
        updatedAt: userData.updated_at,
      },
      connections: userData.connections.map(connection => ({
        id: connection.id,
        name: connection.name,
        linkedInUrl: connection.linkedInUrl,
        meetingPlace: connection.meetingPlace,
        userCompanyAtTheTime: connection.userCompanyAtTheTime,
        notes: connection.notes,
        createdAt: connection.createdAt,
        updatedAt: connection.updatedAt,
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

