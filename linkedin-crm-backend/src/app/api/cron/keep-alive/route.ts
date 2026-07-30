import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

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

        return NextResponse.json({ ok: true });
    } catch (err) {
        console.error('Keep-alive failed:', err);
        return NextResponse.json({ ok: false }, { status: 500 });
    }
}
