import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { prisma } from '@/lib/prisma';
import { runKeyRotation, type RotationResult, type RotationStore } from '@/lib/key-rotation';

export const dynamic = 'force-dynamic';

const userKeys: RotationStore = {
    listUserKeys: () => prisma.userKey.findMany({ select: { user_id: true, encrypted_key: true, salt: true } }),
    compareAndSetKey: async (userId, expected, next) =>
        (await prisma.userKey.updateMany({
            where: { user_id: userId, encrypted_key: expected },
            data: { encrypted_key: next },
        })).count,
};

export async function GET(request: NextRequest) {
    // Vercel Cron stuurt "Authorization: Bearer <CRON_SECRET>" mee zodra die env var bestaat
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret && request.headers.get('authorization') !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            { auth: { persistSession: false } }
        );

        // Eén goedkope read-only HEAD-query via de Supabase REST-API. RLS houdt de
        // data afgeschermd, maar het verzoek telt als projectactiviteit zodat de
        // free tier het project niet pauzeert. Directe Postgres-verbindingen
        // (Prisma) tellen daarvoor niet mee — het moet via de Supabase-API gaan.
        const { error } = await supabase
            .from('Connection')
            .select('id', { head: true, count: 'exact' })
            .limit(1);

        if (error) {
            console.error('Keep-alive query failed:', error.message);
            return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
        }

        // Meteen ook de rate-limit-tellers opruimen: alleen het lopende uur telt
        // nog, dus alles van vóór een uur geleden mag weg. Mislukt dit (bijv.
        // omdat de tabel nog niet bestaat), dan blijft de keep-alive gewoon slagen.
        try {
            await prisma.rateLimitCounter.deleteMany({
                where: { windowStart: { lt: new Date(Date.now() - 60 * 60 * 1000) } },
            });
        } catch (cleanupError) {
            console.error('Rate-limit cleanup failed:', cleanupError instanceof Error ? cleanupError.message : cleanupError);
        }

        // Een lopende rotatie van de master key: zet bestaande user keys om naar
        // ENCRYPTION_MASTER_KEY_NEXT (zie src/lib/key-rotation.ts). Zonder die
        // variabele doet dit niets. Mislukt het, dan slaagt de keep-alive toch.
        let keyRotation: RotationResult | { state: 'error' };
        try {
            keyRotation = await runKeyRotation(userKeys);
        } catch (rotationError) {
            // Alleen naam en code: een Prisma-validatiefout noemt in zijn
            // message de argumenten, en die zijn hier gewrapte sleutels.
            const { name, code } = (rotationError ?? {}) as { name?: string; code?: string };
            console.error('Key rotation failed:', name ?? 'unknown error', code ?? '');
            keyRotation = { state: 'error' };
        }

        return NextResponse.json({ ok: true, keyRotation });
    } catch (err) {
        console.error('Keep-alive failed:', err);
        return NextResponse.json({ ok: false }, { status: 500 });
    }
}
