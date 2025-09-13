// src/app/api/connections/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getUserFromRequest } from '@/lib/supabase/server';

const prisma = new PrismaClient();

const corsHeaders = {
  'Access-Control-Allow-Origin': 'chrome-extension://hidgijlndiamdghcfjloaihnakmllimd',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Credentials': 'true',
};

export async function OPTIONS() {
  return new Response(null, { headers: corsHeaders });
}

// GET functie (blijft hetzelfde)
export async function GET(request: NextRequest) {
    // ... de bestaande GET code ...
}

// POST functie (blijft hetzelfde)
export async function POST(request: NextRequest) {
    // ... de bestaande POST code ...
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