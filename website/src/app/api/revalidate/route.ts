import { timingSafeEqual } from 'node:crypto'
import { revalidateTag } from 'next/cache'
import { NextResponse, type NextRequest } from 'next/server'
import { CMS_CACHE_TAG } from '@/lib/cms'

/**
 * Wordt door het CMS (cms.rolodink.app, zie /cms/config/bootstrap.php) aangeroepen
 * zodra een artikel is opgeslagen of verwijderd. Maakt de Data Cache met tag "cms"
 * ongeldig, zodat /over direct de nieuwe inhoud toont in plaats van na 10 minuten.
 */

const SECRET_HEADER = 'x-cms-secret'

function secretMatches(given: string | null): boolean {
  const expected = process.env.CMS_REVALIDATE_SECRET?.trim()
  if (!expected || !given) return false

  const a = Buffer.from(given)
  const b = Buffer.from(expected)
  return a.length === b.length && timingSafeEqual(a, b)
}

export async function POST(request: NextRequest) {
  if (!secretMatches(request.headers.get(SECRET_HEADER))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  revalidateTag(CMS_CACHE_TAG, 'max')

  return NextResponse.json({ revalidated: true, at: new Date().toISOString() })
}
