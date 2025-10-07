import { NextRequest, NextResponse } from 'next/server';

export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin');
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': origin || '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

export async function GET(request: NextRequest) {
  try {
    const origin = request.headers.get('origin');
    
    // Get current version from query parameter with validation
    const { searchParams } = new URL(request.url);
    const currentVersion = searchParams.get('version');
    
    // Validate version format if provided
    if (currentVersion && !/^\d+\.\d+\.\d+$/.test(currentVersion)) {
      return NextResponse.json(
        { error: 'Invalid version format. Expected format: x.y.z' },
        { 
          status: 400,
          headers: {
            'Access-Control-Allow-Origin': origin || '*',
          },
        }
      );
    }
    
    // Define latest version info
    const latestVersion = '1.0.0';
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

    // Check if update is available
    if (currentVersion && currentVersion !== latestVersion) {
      versionInfo.updateAvailable = true;
      
      // Determine update type based on version comparison
      const currentParts = currentVersion.split('.').map(Number);
      const latestParts = latestVersion.split('.').map(Number);
      
      // Validate that we have exactly 3 version parts
      if (currentParts.length !== 3 || latestParts.length !== 3) {
        return NextResponse.json(
          { error: 'Invalid version format' },
          { 
            status: 400,
            headers: {
              'Access-Control-Allow-Origin': origin || '*',
            },
          }
        );
      }
      
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
      
      // Add version-specific features and fixes
      if (versionInfo.updateType === 'major' || versionInfo.updateType === 'minor') {
        versionInfo.features = [
          'GDPR compliance features toegevoegd',
          'Uitgebreide help pagina met documentatie',
          'Verbeterde instellingen interface',
          'Moderne UI/UX design updates',
          'Automatische update notificaties'
        ];
      }
      
      if (versionInfo.updateType === 'patch') {
        versionInfo.bugFixes = [
          'Performance verbeteringen',
          'Stabiliteit fixes',
          'UI/UX verbeteringen'
        ];
      }
      
      // Set download URL with comprehensive validation
      const configuredUrl = process.env.EXTENSION_DOWNLOAD_URL;
      const defaultUrl = 'https://github.com/thijsmat/linkedin-crm-backend/releases/latest';
      
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
          console.warn('URL validation failed:', error.message, 'URL:', url);
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
        'Access-Control-Allow-Origin': origin || '*',
        'Cache-Control': 'public, max-age=300', // Cache for 5 minutes
      },
    });

  } catch (error) {
    console.error('Version check error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { 
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': request.headers.get('origin') || '*',
        },
      }
    );
  }
}
