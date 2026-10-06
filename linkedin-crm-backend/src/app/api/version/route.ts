import { NextRequest, NextResponse } from 'next/server';
import { rateLimitMiddleware } from '@/lib/rate-limit';
import { buildCorsHeaders } from '@/lib/cors';
import { LATEST_EXTENSION_VERSION } from '@/lib/version';

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, { headers: buildCorsHeaders(request) });
}

export async function GET(request: NextRequest) {
  // Rate limiting
  const rateLimitResponse = rateLimitMiddleware(request);
  if (rateLimitResponse) {
    const corsHeaders = buildCorsHeaders(request);
    const responseHeaders = new Headers(rateLimitResponse.headers);
    Object.entries(corsHeaders).forEach(([key, value]) => {
      if (value) responseHeaders.set(key, value);
    });
    return new Response(rateLimitResponse.body, {
      status: rateLimitResponse.status,
      headers: responseHeaders,
    });
  }

  const corsHeaders = buildCorsHeaders(request);

  try {
    // Get current version from query parameter with validation
    const { searchParams } = new URL(request.url);
    const currentVersion = searchParams.get('version');

    // Validate version format if provided
    if (currentVersion && !/^\d+\.\d+\.\d+$/.test(currentVersion)) {
      return NextResponse.json(
        { error: 'Invalid version format. Expected format: x.y.z' },
        {
          status: 400,
          headers: corsHeaders,
        }
      );
    }

    // Define latest version info. The value lives in @/lib/version, where
    // bump-version.sh rewrites it and version.test.ts asserts it still matches
    // both extension manifests.
    const latestVersion = LATEST_EXTENSION_VERSION;
    const versionInfo = {
      latest: latestVersion,
      current: currentVersion,
      updateAvailable: false,
      updateType: null as 'major' | 'minor' | 'patch' | null,
      releaseNotes: '',
      downloadUrl: '',
      features: [] as string[],
      bugFixes: [] as string[],
      breakingChanges: [] as string[],
    };

    // Check if update is available (only if latest version is actually newer)
    if (currentVersion && currentVersion !== latestVersion) {
      // Determine update type based on version comparison
      const currentParts = currentVersion.split('.').map(Number);
      const latestParts = latestVersion.split('.').map(Number);

      // Validate that we have exactly 3 version parts
      if (currentParts.length !== 3 || latestParts.length !== 3) {
        return NextResponse.json(
          { error: 'Invalid version format' },
          {
            status: 400,
            headers: corsHeaders,
          }
        );
      }

      // Check if latest version is actually newer than current version
      const isLatestNewer = (
        latestParts[0] > currentParts[0] ||
        (latestParts[0] === currentParts[0] && latestParts[1] > currentParts[1]) ||
        (latestParts[0] === currentParts[0] && latestParts[1] === currentParts[1] && latestParts[2] > currentParts[2])
      );

      if (isLatestNewer) {
        versionInfo.updateAvailable = true;

        // Semantic versioning hierarchy: major > minor > patch
        if (latestParts[0] > currentParts[0]) {
          versionInfo.updateType = 'major';
          versionInfo.releaseNotes = `Nieuwe hoofdversie ${latestVersion} beschikbaar!`;
        } else if (latestParts[0] === currentParts[0] && latestParts[1] > currentParts[1]) {
          versionInfo.updateType = 'minor';
          versionInfo.releaseNotes = `Nieuwe functies toegevoegd in versie ${latestVersion}`;
        } else if (latestParts[0] === currentParts[0] && latestParts[1] === currentParts[1] && latestParts[2] > currentParts[2]) {
          versionInfo.updateType = 'patch';
          versionInfo.releaseNotes = `Bugfixes en verbeteringen in versie ${latestVersion}`;
        }
      } else {
        // Current version is newer than or equal to latest version
        versionInfo.updateAvailable = false;
        versionInfo.updateType = null;
        versionInfo.releaseNotes = 'Je gebruikt al de nieuwste versie!';
        console.log(`Current version ${currentVersion} is newer than or equal to latest version ${latestVersion}`);
      }

      // Geen lijsten met functies of fixes: die stonden hier met de hand en
      // bleven releases lang staan (1.3.8 meldde nog de fixes van 1.3.6). De
      // releasenotes staan op de changelogpagina waar de knop naartoe leidt.
      // De browser werkt een extensie uit de store vanzelf bij; dat zeggen we
      // er eerlijk bij, want de nieuwe versie kan nog in review zijn.
      if (versionInfo.updateAvailable) {
        versionInfo.releaseNotes = `${versionInfo.releaseNotes.replace(/[.!]?$/, '.')} ` +
          'Je browser installeert de update meestal vanzelf binnen een paar dagen.';
      }

      // Set download URL with comprehensive validation
      const configuredUrl = process.env.EXTENSION_DOWNLOAD_URL;
      // De downloadpagina linkt naar de juiste store per browser. De oude
      // standaard wees naar de GitHub-releases van een repo die niet meer
      // zo heet, met een zip die een storegebruiker niet nodig heeft.
      const defaultUrl = 'https://rolodink.app/download';

      // Validate and sanitize download URL
      const validateDownloadUrl = (url: string): string => {
        try {
          const parsedUrl = new URL(url);

          // Security checks
          if (parsedUrl.protocol !== 'https:') {
            throw new Error('Only HTTPS URLs are allowed');
          }

          // Allow only trusted domains
          const allowedDomains = [
            'rolodink.app',
            'github.com',
            'githubusercontent.com',
            'vercel.app',
            'linkedin.com'
          ];

          const hostname = parsedUrl.hostname.toLowerCase();
          const isAllowed = allowedDomains.some(domain =>
            hostname === domain || hostname.endsWith('.' + domain)
          );

          if (!isAllowed) {
            throw new Error(`Domain ${hostname} is not in allowed list`);
          }

          return url;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          console.warn('URL validation failed:', errorMessage, 'URL:', url);
          return defaultUrl;
        }
      };

      // Validate default URL first
      const validatedDefaultUrl = validateDownloadUrl(defaultUrl);

      if (configuredUrl) {
        const validatedUrl = validateDownloadUrl(configuredUrl);
        versionInfo.downloadUrl = validatedUrl;

        if (validatedUrl === configuredUrl) {
          console.log('Using configured download URL:', configuredUrl);
        } else {
          console.warn('Configured URL failed validation, using default');
        }
      } else {
        versionInfo.downloadUrl = validatedDefaultUrl;
        console.log('Using default download URL:', validatedDefaultUrl);
      }
    }

    return NextResponse.json(versionInfo, {
      status: 200,
      headers: {
        ...corsHeaders,
        'Cache-Control': 'public, max-age=300', // Cache for 5 minutes
      },
    });

  } catch (error) {
    console.error('Version check error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      {
        status: 500,
        headers: buildCorsHeaders(request),
      }
    );
  }
}
