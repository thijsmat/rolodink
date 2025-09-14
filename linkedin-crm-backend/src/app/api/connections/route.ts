// src/app/api/connections/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getUserFromRequest } from '@/lib/supabase/server';

const prisma = new PrismaClient();

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Credentials': 'false',
};

export async function OPTIONS() {
  return new Response(null, { headers: corsHeaders });
}

// GET functie - Haal alle connecties op voor de ingelogde gebruiker
export async function GET(request: NextRequest) {
  try {
    const { user } = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });
    }

    // Haal URL parameter op voor filtering
    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');

    const whereClause: { ownerId: string; linkedInUrl?: string } = { ownerId: user.id };
    
    // Als er een URL parameter is, filter op die URL
    if (url) {
      whereClause.linkedInUrl = url;
    }

    const connections = await prisma.connection.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(connections, { status: 200, headers: corsHeaders });

  } catch (err) {
    console.error('Fout bij het ophalen van connecties:', err);
    return NextResponse.json({ error: 'Er is een interne serverfout opgetreden' }, { status: 500, headers: corsHeaders });
  }
}

// POST functie - Maak een nieuwe connectie aan
export async function POST(request: NextRequest) {
  try {
    const { user } = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });
    }

    const body = await request.json();
    const { name, url, meetingPlace, notes } = body;

    if (!name || !url) {
      return NextResponse.json({ error: 'Naam en URL zijn verplicht' }, { status: 400, headers: corsHeaders });
    }

    const newConnection = await prisma.connection.create({
      data: {
        name,
        linkedInUrl: url,
        meetingPlace,
        notes,
        ownerId: user.id,
      },
    });

    return NextResponse.json(newConnection, { status: 201, headers: corsHeaders });

  } catch (err) {
    console.error('Fout bij het aanmaken van connectie:', err);
    return NextResponse.json({ error: 'Er is een interne serverfout opgetreden' }, { status: 500, headers: corsHeaders });
  }
}

// NIEUWE PATCH FUNCTIE
export async function PATCH(request: NextRequest) {
  try {
    const { user } = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });
    }

    const body = await request.json();
    const { id, ...updateData } = body; // Haal ID en de rest van de data uit de body

    if (!id) {
      return NextResponse.json({ error: 'Connection ID is verplicht' }, { status: 400, headers: corsHeaders });
    }

    const updatedConnection = await prisma.connection.update({
      where: {
        id: id,
        ownerId: user.id, // Veiligheidscheck
      },
      data: updateData,
    });

    return NextResponse.json(updatedConnection, { status: 200, headers: corsHeaders });

  } catch (err) {
    console.error('Fout bij het updaten van de connectie:', err);
    if (err instanceof Error && 'code' in err && err.code === 'P2025') {
      return NextResponse.json({ error: 'Connectie niet gevonden of geen permissie.' }, { status: 404, headers: corsHeaders });
    }
    return NextResponse.json({ error: 'Er is een interne serverfout opgetreden' }, { status: 500, headers: corsHeaders });
  }
}