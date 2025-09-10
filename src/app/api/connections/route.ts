// src/app/api/connections/route.ts
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getUserFromRequest } from '@/lib/supabase/server';

const prisma = new PrismaClient();

// Deze functie is nodig voor de browser om permissie te vragen (CORS preflight)
export async function OPTIONS() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

// DE GET FUNCTIE
export async function GET(request: Request) {
  try {
    const { user, error: authError } = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: authError ?? 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');
    if (!url) {
      return NextResponse.json({ error: 'Missing url query parameter' }, { status: 400 });
    }

    // CORRECTIE: Gebruik de juiste modelnaam 'crmConnection' zoals de compiler aangeeft
    const connection = await prisma.crmConnection.findFirst({
      where: { ownerId: user.id, linkedInUrl: url },
    });

    if (!connection) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json(connection, { status: 200 });
  } catch (err) {
    console.error('Fout bij het ophalen van de connectie:', err);
    return NextResponse.json({ error: 'Er is een interne serverfout opgetreden' }, { status: 500 });
  }
}

// DE POST FUNCTIE
export async function POST(request: Request) {
  try {
    const { user, error: authError } = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: authError ?? 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    if (!data.name || !data.linkedInUrl) {
      return NextResponse.json({ error: 'Naam en URL zijn verplicht' }, { status: 400 });
    }

    // CORRECTIE: Gebruik de juiste modelnaam 'crmConnection' zoals de compiler aangeeft
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

    return NextResponse.json(newConnection, { status: 201 });
  } catch (err) {
    console.error('Fout bij het aanmaken van de connectie:', err);
    return NextResponse.json({ error: 'Er is een interne serverfout opgetreden' }, { status: 500 });
  }
}