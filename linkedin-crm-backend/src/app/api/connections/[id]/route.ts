// src/app/api/connections/[id]/route.ts
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getUserFromRequest } from '@/lib/supabase/server';

const prisma = new PrismaClient();

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { user } = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const connectionId = params.id;
    const data = await request.json();

    const updatedConnection = await prisma.connection.update({
      where: {
        id: connectionId,
        ownerId: user.id, // Veiligheidscheck: gebruiker mag alleen eigen data aanpassen
      },
      data: {
        meetingPlace: data.meetingPlace,
        userCompanyAtTheTime: data.userCompanyAtTheTime,
        notes: data.notes,
      },
    });

    return NextResponse.json(updatedConnection, { status: 200 });

  } catch (err) { // De 'any' type is hier verwijderd
    console.error('Fout bij het updaten van de connectie:', err);
    return NextResponse.json({ error: 'Er is een interne serverfout opgetreden' }, { status: 500 });
  }
}