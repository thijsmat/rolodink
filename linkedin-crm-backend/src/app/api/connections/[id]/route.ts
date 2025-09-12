// src/app/api/connections/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getUserFromRequest } from '@/lib/supabase/server';

const prisma = new PrismaClient();

export async function PATCH(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const { user } = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const connectionId = context.params.id;
    const data = await request.json();

    const updatedConnection = await prisma.connection.update({
      where: {
        id: connectionId,
        ownerId: user.id, // Veiligheidscheck
      },
      data: {
        meetingPlace: data.meetingPlace,
        userCompanyAtTheTime: data.userCompanyAtTheTime,
        notes: data.notes,
      },
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