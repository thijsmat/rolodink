// Script to clean notification counts from existing profile names in the database
// Run with: node scripts/clean-profile-names.js

const { PrismaClient } = require('@prisma/client');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const prisma = new PrismaClient();

// Function to clean notification counts from profile names
function cleanProfileName(name) {
  if (!name) return name;
  
  console.log('Cleaning profile name:', name);
  
  // Remove various notification patterns
  let cleaned = name
    // Remove leading notification counts: (1), [1], {1}
    .replace(/^[\[{\(]\d+[\]}\)]\s*/, '')
    // Remove leading numbers with spaces: "1 John Doe"
    .replace(/^\d+\s+/, '')
    // Remove notification counts anywhere in the name: "John (1) Doe"
    .replace(/\s*[\[{\(]\d+[\]}\)]\s*/g, ' ')
    // Clean up multiple spaces
    .replace(/\s+/g, ' ')
    .trim();
  
  console.log('Cleaned profile name:', cleaned);
  return cleaned;
}

async function cleanAllProfileNames() {
  try {
    console.log('Starting profile name cleaning...');
    
    // Get all connections
    const connections = await prisma.connection.findMany({
      select: {
        id: true,
        name: true,
      }
    });
    
    console.log(`Found ${connections.length} connections to check`);
    
    let updatedCount = 0;
    
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
      }
    }
    
    console.log(`\n✅ Profile name cleaning completed!`);
    console.log(`📊 Updated ${updatedCount} out of ${connections.length} connections`);
    
    if (updatedCount === 0) {
      console.log('🎉 All profile names are already clean!');
    }
    
  } catch (error) {
    console.error('❌ Error cleaning profile names:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
cleanAllProfileNames();
