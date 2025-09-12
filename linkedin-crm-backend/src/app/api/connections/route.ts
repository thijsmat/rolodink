// src/app/api/connections/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getUserFromRequest } from '@/lib/supabase/server';

const prisma = new PrismaClient();

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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, ...updateData } = body; // Haal ID en de rest van de data uit de body

    if (!id) {
      return NextResponse.json({ error: 'Connection ID is verplicht' }, { status: 400 });
    }

    const updatedConnection = await prisma.connection.update({
      where: {
        id: id,
        ownerId: user.id, // Veiligheidscheck
      },
      data: updateData,
    });

    return NextResponse.json(updatedConnection, { status: 200 });

  } catch (err) {
    console.error('Fout bij het updaten van de connectie:', err);
    if (err instanceof Error && 'code' in err && err.code === 'P2025') {
      return NextResponse.json({ error: 'Connectie niet gevonden of geen permissie.' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Er is een interne serverfout opgetreden' }, { status: 500 });
  }
}