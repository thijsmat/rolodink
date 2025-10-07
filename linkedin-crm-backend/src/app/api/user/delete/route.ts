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
      'Access-Control-Allow-Methods': 'DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

export async function DELETE(request: NextRequest) {
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

    // Find user in database
    const dbUser = await prisma.user.findUnique({
      where: {
        id: user.id,
      },
      include: {
        connections: true,
      },
    });

    if (!dbUser) {
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

    // Log deletion for audit purposes (sanitize email for logging)
    const sanitizedEmail = dbUser.email ? dbUser.email.replace(/(.{2}).*(@.*)/, '$1***$2') : 'unknown';
    console.log(`GDPR Account Deletion Request: User ${dbUser.id} (${sanitizedEmail}) - ${dbUser.connections.length} connections`);

    // Delete all user data in transaction with error handling
    try {
      await prisma.$transaction(async (tx) => {
        // Delete all connections first (due to foreign key constraints)
        const deletedConnections = await tx.connection.deleteMany({
          where: {
            ownerId: dbUser.id,
          },
        });

        // Delete the user
        await tx.user.delete({
          where: {
            id: dbUser.id,
          },
        });

        console.log(`GDPR Account Deletion Completed: ${deletedConnections.count} connections deleted for user ${dbUser.id}`);
      });
    } catch (transactionError) {
      console.error(`GDPR Account Deletion Failed: User ${dbUser.id}`, transactionError);
      throw transactionError; // Re-throw to be caught by outer try-catch
    }

    // Return success response
    return NextResponse.json(
      { 
        message: 'Account and all associated data have been permanently deleted',
        deletedAt: new Date().toISOString(),
        deletedConnections: dbUser.connections.length,
      },
      { 
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': origin || '*',
        },
      }
    );

  } catch (error) {
    console.error('Account deletion error:', error);
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

