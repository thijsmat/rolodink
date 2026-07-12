import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/supabase/server';
import { buildCorsHeaders } from '@/lib/cors';
import { z } from 'zod';
import { randomBytes, createCipheriv, createDecipheriv } from 'crypto';

const ENVELOPE_VERSION = 'envelope-v1';

function getMasterKey(): Buffer {
    const masterKeyB64 = process.env.ENCRYPTION_MASTER_KEY;
    if (!masterKeyB64) {
        throw new Error('ENCRYPTION_MASTER_KEY not configured');
    }
    return Buffer.from(masterKeyB64, 'base64');
}

function wrapDataKey(dataKey: Buffer, masterKey: Buffer): string {
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', masterKey, iv);
    const ciphertext = Buffer.concat([cipher.update(dataKey), cipher.final()]);
    const authTag = cipher.getAuthTag();
    return Buffer.concat([iv, authTag, ciphertext]).toString('base64');
}

function unwrapDataKey(wrapped: string, masterKey: Buffer): Buffer {
    const blob = Buffer.from(wrapped, 'base64');
    if (blob.length < 28) {
        throw new Error('Invalid wrapped key length');
    }
    const iv = blob.subarray(0, 12);
    const authTag = blob.subarray(12, 28);
    const ciphertext = blob.subarray(28);
    const decipher = createDecipheriv('aes-256-gcm', masterKey, iv);
    decipher.setAuthTag(authTag);
    return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
}

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
            const dataKey = randomBytes(32);
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
