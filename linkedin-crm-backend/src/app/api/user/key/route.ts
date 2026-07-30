import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/supabase/server';
import { buildCorsHeaders } from '@/lib/cors';
import { ENVELOPE_VERSION, getMasterKey, wrapDataKey, unwrapDataKey, generateDataKey } from '@/lib/envelope';

export async function OPTIONS(request: NextRequest) {
    return new Response(null, { headers: buildCorsHeaders(request) });
}

export async function GET(request: NextRequest) {
    const corsHeaders = buildCorsHeaders(request);
    try {
        const { user } = await getUserFromRequest(request);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });
        }

        let userKey = await prisma.userKey.findUnique({
            where: { user_id: user.id }
        });

        if (!userKey) {
            const masterKey = getMasterKey();
            const dataKey = generateDataKey();
            const wrappedKey = wrapDataKey(dataKey, masterKey);

            try {
                userKey = await prisma.userKey.create({
                    data: {
                        user_id: user.id,
                        encrypted_key: wrappedKey,
                        salt: ENVELOPE_VERSION,
                    }
                });
            } catch (e) {
                // Handle concurrent creation race condition
                userKey = await prisma.userKey.findUnique({
                    where: { user_id: user.id }
                });
                if (!userKey) throw e;
            }
        }

        if (!userKey.encrypted_key || userKey.salt !== ENVELOPE_VERSION) {
            return NextResponse.json({ error: 'Invalid key format' }, { status: 400, headers: corsHeaders });
        }

        try {
            const masterKey = getMasterKey();
            const rawDataKey = unwrapDataKey(userKey.encrypted_key, masterKey);
            const data_key = rawDataKey.toString('base64');

            return NextResponse.json({ data_key }, { status: 200, headers: corsHeaders });
        } catch (e) {
            console.error('Failed to unwrap data key:', e);
            return NextResponse.json({ error: 'Failed to decrypt key' }, { status: 500, headers: corsHeaders });
        }
    } catch (err) {
        console.error('Error fetching user key:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500, headers: corsHeaders });
    }
}
