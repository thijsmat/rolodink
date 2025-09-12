import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Definieer een schema voor het valideren van de request body.
// Alleen de velden die bewerkt kunnen worden, moeten hier worden opgenomen.
const patchBodySchema = z.object({
  name: z.string().min(1, 'Name cannot be empty.').optional(),
  title: z.string().optional(),
  notes: z.string().optional(),
}).partial(); // .partial() maakt alle velden optioneel

export async function PATCH(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    // 1. Authenticeer de gebruiker
    const { userId } = getAuth(request);
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { id } = context.params;
    const body = await request.json();

    // 2. Valideer de input
    const parsedBody = patchBodySchema.safeParse(body);
    if (!parsedBody.success) {
      return NextResponse.json({ error: 'Invalid request body', details: parsedBody.error.flatten() }, { status: 400 });
    }

    // 3. Controleer of de connectie bestaat en eigendom is van de gebruiker
    const connection = await prisma.connection.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!connection) {
      return new NextResponse('Connection not found or access denied', {
        status: 404,
      });
    }

    // 4. Update de connectie in de database
    const updatedConnection = await prisma.connection.update({
      where: {
        id,
      },
      data: parsedBody.data,
    });

    return NextResponse.json(updatedConnection);
  } catch (error) {
    console.error('[CONNECTIONS_PATCH]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}