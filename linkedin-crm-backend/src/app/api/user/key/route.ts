import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/supabase/server';
import { buildCorsHeaders } from '@/lib/cors';
import { z } from 'zod';

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

        const userKey = await prisma.userKey.findUnique({
            where: { user_id: user.id }
        });

        if (!userKey) {
            return NextResponse.json({ error: 'Not found' }, { status: 404, headers: corsHeaders });
        }

        return NextResponse.json(userKey, { status: 200, headers: corsHeaders });
    } catch (err) {
        console.error('Error fetching user key:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500, headers: corsHeaders });
    }
}

const postKeySchema = z.object({
    encrypted_key: z.string().min(1),
    salt: z.string().min(1),
});

export async function POST(request: NextRequest) {
    const corsHeaders = buildCorsHeaders(request);
    try {
        const { user } = await getUserFromRequest(request);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });
        }

        const body = await request.json();
        const validation = postKeySchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json({ error: 'Invalid data', issues: validation.error.format() }, { status: 400, headers: corsHeaders });
        }

        const { encrypted_key, salt } = validation.data;

        const userKey = await prisma.userKey.upsert({
            where: { user_id: user.id },
            update: { encrypted_key, salt },
            create: {
                user_id: user.id,
                encrypted_key,
                salt,
            }
        });

        return NextResponse.json(userKey, { status: 200, headers: corsHeaders });
    } catch (err) {
        console.error('Error saving user key:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500, headers: corsHeaders });
    }
}
