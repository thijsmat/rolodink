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

function normalizeLinkedInUrl(rawUrl: string): string {
  try {
    const url = new URL(rawUrl);
    // Force hostname to canonical LinkedIn host
    // Only allow linkedin.com hosts
    if (!/\.linkedin\.com$/.test(url.hostname) && url.hostname !== 'linkedin.com') {
      return rawUrl;
    }
    // Remove query and hash
    url.search = '';
    url.hash = '';
    // Ensure we only keep the path to the profile and trim trailing slash
    let pathname = url.pathname.trim();
    if (pathname.endsWith('/')) pathname = pathname.slice(0, -1);
    url.pathname = pathname;
    return url.toString();
  } catch {
    return rawUrl;
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

    const normalizedUrl = normalizeLinkedInUrl(url);

    const newConnection = await prisma.connection.create({
      data: {
        name,
        linkedInUrl: normalizedUrl,
        meetingPlace,
        notes,
        ownerId: user.id,
      },
    });

    return NextResponse.json(newConnection, { status: 201, headers: corsHeaders });

  } catch (err: unknown) {
    console.error('Fout bij het aanmaken van connectie:', err);
    // Prisma unieke constraint (bijv. bestaande connectie voor dezelfde URL/owner)
    if (err && typeof err === 'object' && 'code' in err) {
      const prismaError = err as { code?: string };
      if (prismaError.code === 'P2002') {
        return NextResponse.json({ error: 'Connectie bestaat al voor deze URL.' }, { status: 409, headers: corsHeaders });
      }
      if (prismaError.code === 'P2003') {
        return NextResponse.json({ error: 'Ongeldige referentie of gegevens.' }, { status: 400, headers: corsHeaders });
      }
    }
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