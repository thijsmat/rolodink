// src/app/api/connections/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'; // <-- AANGEPAST
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getUserFromRequest } from '@/lib/supabase/server';

const prisma = new PrismaClient();

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'PATCH, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return new Response(null, {
    headers: corsHeaders,
  });
}

export async function PATCH(
  request: NextRequest, // <-- AANGEPAST
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const { user } = await getUserFromRequest(request);
    // 1. Authenticeer de gebruiker
    const { user, error: authError } = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      return NextResponse.json({ error: authError ?? 'Unauthorized' }, { status: 401, headers: corsHeaders });
    }

    // 2. Haal de ID en de data op
    const connectionId = context.params.id;
    const data = await request.json();
    const body = await request.json();

    // 3. Update de record in de database
    // De `where` clause zorgt ervoor dat een gebruiker alleen een record kan updaten
    // als de `id` overeenkomt EN de `ownerId` overeenkomt met de ingelogde gebruiker.
    const updatedConnection = await prisma.connection.update({
      where: {
        id: connectionId,
        ownerId: user.id, // Veiligheidscheck
        ownerId: user.id, // Essentiële veiligheidscontrole!
      },
      data: {
        meetingPlace: data.meetingPlace,
        userCompanyAtTheTime: data.userCompanyAtTheTime,
        notes: data.notes,
        meetingPlace: body.meetingPlace,
        userCompanyAtTheTime: body.userCompanyAtTheTime,
        notes: body.notes,
      },
    });

    return NextResponse.json(updatedConnection, { status: 200 });

  } catch (err) {
    console.error('Fout bij het updaten van de connectie:', err);
    return NextResponse.json({ error: 'Er is een interne serverfout opgetreden' }, { status: 500 });
    // 4. Stuur de geüpdatete data terug
    return NextResponse.json(updatedConnection, { status: 200, headers: corsHeaders });
  } catch (error: any) {
    // Prisma's P2025 error code betekent "Record to update not found."
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Connectie niet gevonden of geen permissie om te updaten.' }, { status: 404, headers: corsHeaders });
    }
    console.error('Fout bij het updaten van de connectie:', error);
    return NextResponse.json({ error: 'Er is een interne serverfout opgetreden' }, { status: 500, headers: corsHeaders });
  }
}