// src/app/api/connections/route.ts
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getUserFromRequest } from '@/lib/supabase/server';

const prisma = new PrismaClient();

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return new Response(null, { headers: corsHeaders });
}

export async function POST(request: Request) {
  try {
    const { user, error } = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: error ?? 'Unauthorized' }, { status: 401, headers: corsHeaders });
    }

    const data = await request.json();

    if (!data.name || !data.linkedInUrl) {
      return NextResponse.json({ error: 'Naam en URL zijn verplicht' }, { status: 400, headers: corsHeaders });
    }

    const newConnection = await prisma.crmConnection.create({
      data: {
        name: data.name,
        linkedInUrl: data.linkedInUrl,
        ownerId: user.id,
        meetingPlace: data.meetingPlace ?? null,
        userCompanyAtTheTime: data.userCompanyAtTheTime ?? null,
        notes: data.notes ?? null,
      },
    });

    return NextResponse.json(newConnection, { status: 201, headers: corsHeaders });
  } catch (err) {
    console.error('Fout bij het aanmaken van de connectie:', err);
    return NextResponse.json({ error: 'Er is een interne serverfout opgetreden' }, { status: 500, headers: corsHeaders });
  }
}

export async function GET(request: Request) {
  try {
    const { user, error } = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: error ?? 'Unauthorized' }, { status: 401, headers: corsHeaders });
    }

    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');
    if (!url) {
      return NextResponse.json({ error: 'Missing url query parameter' }, { status: 400, headers: corsHeaders });
    }

    const connection = await prisma.crmConnection.findFirst({
      where: { ownerId: user.id, linkedInUrl: url },
    });

    if (!connection) {
      return NextResponse.json({ error: 'Not found' }, { status: 404, headers: corsHeaders });
    }

    return NextResponse.json(connection, { status: 200, headers: corsHeaders });
  } catch (err) {
    console.error('Fout bij het ophalen van de connectie:', err);
    return NextResponse.json({ error: 'Er is een interne serverfout opgetreden' }, { status: 500, headers: corsHeaders });
  }
}