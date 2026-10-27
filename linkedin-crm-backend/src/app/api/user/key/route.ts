import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/supabase/server';
import { buildCorsHeaders } from '@/lib/cors';
import { rateLimitMiddleware } from '@/lib/rate-limit';
import { getOrCreateUserKey, InvalidKeyFormatError, KeyUnwrapError } from '@/lib/envelope';

export async function OPTIONS(request: NextRequest) {
    return new Response(null, { headers: buildCorsHeaders(request) });
}

export async function GET(request: NextRequest) {
    // Rate limiting
    const rateLimitResponse = await rateLimitMiddleware(request);
    if (rateLimitResponse) return rateLimitResponse;

    const corsHeaders = buildCorsHeaders(request);
    try {
        // strict: the data key unlocks every encrypted note, so a signed-out session or
        // deleted account must not get it with a JWT that has not expired yet.
        const { user } = await getUserFromRequest(request, { strict: true });
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });
        }

        const dataKey = await getOrCreateUserKey(prisma, user.id);
        return NextResponse.json({ data_key: dataKey.toString('base64') }, { status: 200, headers: corsHeaders });
    } catch (err) {
        if (err instanceof InvalidKeyFormatError) {
            return NextResponse.json({ error: 'Invalid key format' }, { status: 400, headers: corsHeaders });
        }
        if (err instanceof KeyUnwrapError) {
            console.error('Failed to unwrap data key:', err.cause);
            return NextResponse.json({ error: 'Failed to decrypt key' }, { status: 500, headers: corsHeaders });
        }
        console.error('Error fetching user key:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500, headers: corsHeaders });
    }
}
