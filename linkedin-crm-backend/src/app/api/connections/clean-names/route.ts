import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getUserFromRequest } from '@/lib/supabase/server';

const prisma = new PrismaClient();

// Function to clean notification counts from profile names
function cleanProfileName(name: string): string {
  if (!name) return name;
  
  // Remove various notification patterns
  const cleaned = name
    // Remove leading notification counts: (1), [1], {1}
    .replace(/^[\[{\(]\d+[\]}\)]\s*/, '')
    // Remove leading numbers with spaces: "1 John Doe"
    .replace(/^\d+\s+/, '')
    // Remove notification counts anywhere in the name: "John (1) Doe"
    .replace(/\s*[\[{\(]\d+[\]}\)]\s*/g, ' ')
    // Clean up multiple spaces
    .replace(/\s+/g, ' ')
    .trim();
  
  return cleaned;
}

export async function POST(request: NextRequest) {
  try {
    const { user } = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Starting bulk profile name cleaning...');
    
    // Get all connections for the user
    const connections = await prisma.connection.findMany({
      where: { ownerId: user.id },
      select: {
        id: true,
        name: true,
      }
    });
    
    console.log(`Found ${connections.length} connections to check`);
    
    let updatedCount = 0;
    const updates: Array<{ id: string; originalName: string; cleanedName: string }> = [];
    
    for (const connection of connections) {
      const originalName = connection.name;
      const cleanedName = cleanProfileName(originalName);
      
      // Only update if the name actually changed
      if (originalName !== cleanedName) {
        console.log(`Updating connection ${connection.id}: "${originalName}" → "${cleanedName}"`);
        
        await prisma.connection.update({
          where: { id: connection.id },
          data: { name: cleanedName }
        });
        
        updatedCount++;
        updates.push({
          id: connection.id,
          originalName,
          cleanedName
        });
      }
    }
    
    console.log(`Profile name cleaning completed! Updated ${updatedCount} out of ${connections.length} connections`);
    
    return NextResponse.json({
      success: true,
      message: `Updated ${updatedCount} out of ${connections.length} connections`,
      totalConnections: connections.length,
      updatedCount,
      updates
    });
    
  } catch (error) {
    console.error('Error cleaning profile names:', error);
    return NextResponse.json(
      { error: 'Failed to clean profile names' },
      { status: 500 }
    );
  }
}
