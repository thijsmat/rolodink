import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/supabase/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { rateLimitMiddleware } from '@/lib/rate-limit';
import { buildCorsHeaders } from '@/lib/cors';

/**
 * Deletes the auth.users row, which takes the user's sessions and identities
 * with it. Through the Auth admin API when SUPABASE_SERVICE_ROLE_KEY is set -
 * the anon key can never do this - and otherwise, or if that fails, through the
 * database role Prisma connects with.
 */
async function deleteAuthUser(userId: string): Promise<boolean> {
  const admin = createSupabaseAdminClient();
  if (admin) {
    const { error } = await admin.auth.admin.deleteUser(userId);
    if (!error) {
      console.log(`User ${userId} deleted from Supabase Auth`);
      return true;
    }
    console.error(`Supabase Auth admin deletion failed for user ${userId}: ${error.message}`);
  } else {
    console.warn('SUPABASE_SERVICE_ROLE_KEY is not set; deleting the auth user through the database instead');
  }

  try {
    await prisma.user.delete({ where: { id: userId } });
    console.log(`User ${userId} deleted from auth.users through the database`);
    return true;
  } catch (dbError) {
    console.error(`Could not delete auth user ${userId}; the login still exists`, dbError);
    return false;
  }
}

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

    // Authenticate user. strict: irreversible, so only for a session the Auth
    // server still knows.
    const { user, error: authError } = await getUserFromRequest(request, { strict: true });
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
      where: { id: user.id },
      select: { id: true, email: true, _count: { select: { connections: true } } },
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

    const connectionCount = dbUser._count.connections;

    // Log deletion for audit purposes (sanitize email for logging)
    const sanitizedEmail = dbUser.email ? dbUser.email.replace(/(.{2}).*(@.*)/, '$1***$2') : 'unknown';
    console.log(`GDPR Account Deletion Request: User ${dbUser.id} (${sanitizedEmail}) - ${connectionCount} connections`);

    // First the data, in one transaction: the connections (their notes go with
    // them) and the user's data key. Without that key, nothing encrypted for
    // this user can be read again.
    try {
      const [deletedConnections] = await prisma.$transaction([
        prisma.connection.deleteMany({ where: { ownerId: dbUser.id } }),
        prisma.userKey.deleteMany({ where: { user_id: dbUser.id } }),
      ]);
      console.log(`GDPR Account Deletion Completed: ${deletedConnections.count} connections deleted for user ${dbUser.id}`);
    } catch (transactionError) {
      console.error(`GDPR Account Deletion Failed: User ${dbUser.id}`, transactionError);
      throw transactionError; // Re-throw to be caught by outer try-catch
    }

    // Then the login itself. The data is gone either way, so a failure here is
    // logged, not returned as an error.
    const loginDeleted = await deleteAuthUser(dbUser.id);

    // Return success response
    return NextResponse.json(
      {
        message: loginDeleted
          ? 'Account and all associated data have been permanently deleted'
          : 'All associated data has been permanently deleted; the login itself could not be removed yet',
        deletedAt: new Date().toISOString(),
        deletedConnections: connectionCount,
        loginDeleted,
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

