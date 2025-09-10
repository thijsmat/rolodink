import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

export async function GET() {
  const prisma = new PrismaClient();

  try {
    // Check 1: Zijn de Supabase URL's aanwezig in de environment variables?
    const supabaseUrlOk = !!process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKeyOk = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    // Check 2: Is de database connectie string aanwezig?
    const dbUrlOk = !!process.env.DATABASE_URL;

    // Check 3: Kunnen we een simpele query uitvoeren op de database?
    // We tellen het aantal gebruikers in de auth.users tabel.
    // Dit zal een fout geven als de verbinding mislukt.
    const userCount = await prisma.user.count();

    // Als alle checks slagen, stuur een succesbericht terug.
    return NextResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      checks: {
        supabaseUrl: supabaseUrlOk ? 'ok' : 'MISSING',
        supabaseAnonKey: anonKeyOk ? 'ok' : 'MISSING',
        databaseUrl: dbUrlOk ? 'Present' : 'MISSING',
        databaseConnection: 'ok',
        userCount: userCount,
      }
    });

  } catch (error: unknown) {
    // Als een van de checks mislukt, stuur een foutbericht.
    console.error("Health check failed:", error);
    const message = error instanceof Error ? error.message : 'An unknown error occurred during the health check.';
    return NextResponse.json({
      status: 'error',
      error: 'Database connection or query failed.',
      message,
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}