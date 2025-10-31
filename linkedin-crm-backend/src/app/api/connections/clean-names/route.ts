import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getUserFromRequest } from '@/lib/supabase/server';
import { buildCorsHeaders } from '@/lib/cors';

const prisma = new PrismaClient();

export async function OPTIONS(request: NextRequest) {
  return new Response(null, { headers: buildCorsHeaders(request) });
}

// Function to clean notification counts from profile names
function cleanProfileName(name: string): string {
  if (!name) return name;

  // Normalize whitespace (including non-breaking spaces)
  let cleaned = name.replace(/\u00A0/g, ' ');

  const patterns: RegExp[] = [
    // Leading counters: (1) [2] {3}
    /^[\s\u00A0]*[\(\[\{]\s*\d+\s*[\)\]\}]\s*/,
    // Leading numbers like: 1 John, 12· John, 3. John
    /^[\s\u00A0]*\d+[\s\u00A0]*[\.|·•:\-]*[\s\u00A0]*/,
    // Trailing counters at end: John Doe (1)
    /[\s\u00A0]*[\(\[\{]\s*\d+\s*[\)\]\}]\s*$/,
    // Inline counters: John (1) Doe
    /[\s\u00A0]*[\(\[\{]\s*\d+\s*[\)\]\}][\s\u00A0]*/g,
  ];

  for (const pattern of patterns) {
    cleaned = cleaned.replace(pattern, ' ');
  }

  return cleaned.replace(/\s+/g, ' ').trim();
}

export async function POST(request: NextRequest) {
  const corsHeaders = buildCorsHeaders(request);
  try {
    const { user } = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });
    }

    // Get all connections for the user
    const connections = await prisma.connection.findMany({
      where: { ownerId: user.id },
      select: { id: true, name: true },
    });

    let updatedCount = 0;
    const updates: Array<{ id: string; originalName: string; cleanedName: string }> = [];

    for (const connection of connections) {
      const originalName = connection.name;
      const cleanedName = cleanProfileName(originalName);

      if (originalName !== cleanedName) {
        await prisma.connection.update({ where: { id: connection.id }, data: { name: cleanedName } });
        updatedCount++;
        updates.push({ id: connection.id, originalName, cleanedName });
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: `Updated ${updatedCount} out of ${connections.length} connections`,
        totalConnections: connections.length,
        updatedCount,
        updates,
      },
      { status: 200, headers: corsHeaders }
    );
  } catch (error) {
    console.error('Error cleaning profile names:', error);
    return NextResponse.json({ error: 'Failed to clean profile names' }, { status: 500, headers: corsHeaders });
  }
}
