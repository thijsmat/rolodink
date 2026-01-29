import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import type { Prisma } from '@prisma/client';
import { createSupabaseServerClient, getUserFromRequest } from '@/lib/supabase/server';
import { rateLimitMiddleware } from '@/lib/rate-limit';
import { buildCorsHeaders } from '@/lib/cors';

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, { headers: buildCorsHeaders(request) });
}

export async function DELETE(request: NextRequest) {
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
          headers: corsHeaders,
        }
      );
    }

    // Log deletion for audit purposes (sanitize email for logging)
    const sanitizedEmail = dbUser.email ? dbUser.email.replace(/(.{2}).*(@.*)/, '$1***$2') : 'unknown';
    console.log(`GDPR Account Deletion Request: User ${dbUser.id} (${sanitizedEmail}) - ${dbUser.connections.length} connections`);

    // Delete all user data in transaction with error handling
    try {
      await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
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

      // Delete user from Supabase Auth (requires admin privileges)
      try {
        const supabase = await createSupabaseServerClient();
        const { error: authError } = await supabase.auth.admin.deleteUser(user.id);

        if (authError) {
          console.error(`Failed to delete user from Supabase Auth: ${authError.message}`);
          // Don't fail the entire operation if Auth deletion fails
          // The database deletion was successful
        } else {
          console.log(`User ${dbUser.id} successfully deleted from Supabase Auth`);
        }
      } catch (authDeleteError) {
        console.error(`Supabase Auth deletion error: ${authDeleteError}`);
        // Continue - database deletion was successful
      }

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
        headers: corsHeaders,
      }
    );

  } catch (error) {
    console.error('Account deletion error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      {
        status: 500,
        headers: buildCorsHeaders(request),
      }
    );
  }
}

