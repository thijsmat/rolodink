import { NextRequest, NextResponse } from 'next/server';
import { Prisma, PrismaClient } from '@prisma/client';
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
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    // 1. Authenticeer de gebruiker
    const { user, error: authError } = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: authError ?? 'Unauthorized' }, { status: 401, headers: corsHeaders });
    }

    // 2. Haal de ID en de data op
    const connectionId = context.params.id;
    const body = await request.json();

    // 3. Update de record in de database
    // De `where` clause zorgt ervoor dat een gebruiker alleen een record kan updaten
    // als de `id` overeenkomt EN de `ownerId` overeenkomt met de ingelogde gebruiker.
    const updatedConnection = await prisma.connection.update({
      where: {
        id: connectionId,
        ownerId: user.id, // Essentiële veiligheidscontrole!
      },
      data: {
        meetingPlace: body.meetingPlace,
        userCompanyAtTheTime: body.userCompanyAtTheTime,
        notes: body.notes,
      },
    });

    // 4. Stuur de geüpdatete data terug
    return NextResponse.json(updatedConnection, { status: 200, headers: corsHeaders });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      // Prisma's P2025 error code betekent "Record to update not found."
      if (error.code === 'P2025') {
        return NextResponse.json({ error: 'Connectie niet gevonden of geen permissie om te updaten.' }, { status: 404, headers: corsHeaders });
      }
    }
    console.error('Fout bij het updaten van de connectie:', error);
    return NextResponse.json({ error: 'Er is een interne serverfout opgetreden' }, { status: 500, headers: corsHeaders });
  }
}