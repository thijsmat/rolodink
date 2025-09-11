import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getUserFromRequest } from '@/lib/supabase/server';

const prisma = new PrismaClient();

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS(request: Request) {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  });
}

export async function POST(request: Request) {
  try {
    const { user, error } = await authenticate(request);
    if (!user) {
      return NextResponse.json({ error: error ?? 'Unauthorized' }, { status: 401, headers: corsHeaders });
    }

    const body = await request.json();
    if (!body.name || !body.linkedInUrl) {
      return NextResponse.json({ error: 'Naam en URL zijn verplicht' }, { status: 400, headers: corsHeaders });
    }

    // CORRECTIE: Gebruik 'prisma.connection' in plaats van 'prisma.crmConnection'
    const newConnection = await prisma.connection.create({
      data: {
        name: body.name,
        linkedInUrl: body.linkedInUrl,
        ownerId: user.id,
        meetingPlace: body.meetingPlace ?? null,
        userCompanyAtTheTime: body.userCompanyAtTheTime ?? null,
        notes: body.notes ?? null,
      },
    });

    return NextResponse.json(newConnection, { status: 201, headers: corsHeaders });
  } catch (error) {
    console.error('Fout bij het aanmaken van de connectie:', error);
    return NextResponse.json({ error: 'Er is een interne serverfout opgetreden' }, { status: 500, headers: corsHeaders });
  }
}

export async function GET(request: Request) {
  try {
    const { user, error } = await authenticate(request);
    if (!user) {
      return NextResponse.json({ error: error ?? 'Unauthorized' }, { status: 401, headers: corsHeaders });
    }

    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');

    if (!url) {
      return NextResponse.json({ error: 'Missing url query parameter' }, { status: 400, headers: corsHeaders });
    }

    // CORRECTIE: Gebruik 'prisma.connection' in plaats van 'prisma.crmConnection'
    const connection = await prisma.connection.findFirst({
      where: { ownerId: user.id, linkedInUrl: url },
    });

    if (!connection) {
      return NextResponse.json({ error: 'Not found' }, { status: 404, headers: corsHeaders });
    }

    return NextResponse.json(connection, { status: 200, headers: corsHeaders });
  } catch (error) {
    console.error('Fout bij het ophalen van de connectie:', error);
    return NextResponse.json({ error: 'Er is een interne serverfout opgetreden' }, { status: 500, headers: corsHeaders });
  }
}
