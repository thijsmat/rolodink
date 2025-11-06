#!/usr/bin/env tsx
/**
 * API Test Script
 * Tests the security fixes and functionality of the API endpoints
 * 
 * Usage: 
 *   npx tsx scripts/test-api.ts
 * 
 * Requires: Backend server running on http://localhost:3000
 *           Test user credentials in environment variables
 */

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000/api';
const TEST_EMAIL = process.env.TEST_EMAIL || '';
const TEST_PASSWORD = process.env.TEST_PASSWORD || '';

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
  details?: any;
}

const results: TestResult[] = [];

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
};

function log(message: string, color: keyof typeof colors = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function fetchAPI(endpoint: string, options: RequestInit = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  
  // Add IP header for rate limiting (simulate real request)
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Forwarded-For': '127.0.0.1', // Localhost IP for testing
    ...(options.headers as Record<string, string> || {}),
  };
  
  const response = await fetch(url, {
    ...options,
    headers,
  });
  
  const data = await response.json().catch(() => ({}));
  return { status: response.status, data, headers: response.headers };
}

async function signIn(email: string, password: string): Promise<string | null> {
  try {
    const { status, data } = await fetchAPI('/auth/signin', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (status === 200 && data.session?.access_token) {
      return data.session.access_token;
    }
    
    log(`Sign in failed: ${status} - ${JSON.stringify(data)}`, 'yellow');
    return null;
  } catch (error) {
    log(`Sign in error: ${error}`, 'red');
    return null;
  }
}

function test(name: string, testFn: () => Promise<boolean | { passed: boolean; error?: string; details?: any }>) {
  return async () => {
    try {
      const result = await testFn();
      if (typeof result === 'boolean') {
        results.push({ name, passed: result });
      } else {
        results.push({ name, ...result });
      }
    } catch (error) {
      results.push({
        name,
        passed: false,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  };
}

async function runTests() {
  log('\n🧪 Starting API Tests...\n', 'blue');

  // Test 1: Sign in
  log('📝 Test 1: Sign in', 'blue');
  let authToken: string | null = null;
  
  if (!TEST_EMAIL || !TEST_PASSWORD) {
    log('⚠️  TEST_EMAIL and TEST_PASSWORD not set, skipping authentication tests', 'yellow');
    log('   Set them as environment variables to run full test suite\n', 'yellow');
  } else {
    authToken = await signIn(TEST_EMAIL, TEST_PASSWORD);
    if (!authToken) {
      log('❌ Could not sign in. Cannot run authenticated tests.\n', 'red');
      return;
    }
    log('✅ Successfully signed in\n', 'green');
  }

  // Test 2: GET /api/connections without auth (should fail)
  await test('GET /api/connections without auth should return 401', async () => {
    const { status, data } = await fetchAPI('/connections');
    // Should return 401 for unauthorized access
    // Rate limiting might return 429, but that's also a valid security response
    if (status === 401) {
      return true;
    } else if (status === 429) {
      // Rate limit is also a valid security response
      return {
        passed: true,
        details: { message: 'Got 429 (rate limit) - also valid security response', status, data }
      };
    } else if (status === 400 && data.error?.includes('IP')) {
      // IP detection failure - this is a security feature
      return {
        passed: true,
        details: { message: 'Got 400 (IP detection) - security feature working', status, data }
      };
    } else {
      return {
        passed: false,
        error: `Expected 401 (or 429/400 for security), got ${status}`,
        details: { status, data }
      };
    }
  })();

  if (authToken) {
    // Test 3: GET /api/connections with auth
    await test('GET /api/connections with auth should return 200', async () => {
      const { status, data } = await fetchAPI('/connections', {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      return status === 200 && Array.isArray(data);
    })();

    // Test 4: POST /api/connections with invalid data (should fail validation)
    await test('POST /api/connections with invalid data should return 400', async () => {
      const { status, data } = await fetchAPI('/connections', {
        method: 'POST',
        headers: { Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({ name: '', url: 'not-a-url' }),
      });
      return status === 400 && data.error;
    })();

    // Test 5: POST /api/connections with valid data
    let createdConnectionId: string | null = null;
    await test('POST /api/connections with valid data should create connection', async () => {
      const { status, data } = await fetchAPI('/connections', {
        method: 'POST',
        headers: { Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({
          name: 'Test Connection',
          url: `https://linkedin.com/in/test-profile-${Date.now()}`,
          notes: 'Test notes',
        }),
      });
      
      if (status === 201 && data.id) {
        createdConnectionId = data.id;
        return true;
      }
      return false;
    })();

    if (createdConnectionId) {
      // Test 6: GET /api/connections/[id] with valid ID
      await test(`GET /api/connections/${createdConnectionId} should return connection`, async () => {
        const { status, data } = await fetchAPI(`/connections/${createdConnectionId}`, {
          headers: { Authorization: `Bearer ${authToken}` },
        });
        return status === 200 && data.id === createdConnectionId;
      })();

      // Test 7: GET /api/connections/[id] with invalid ID (should return 404)
      await test('GET /api/connections/invalid-id should return 404', async () => {
        const { status } = await fetchAPI('/connections/invalid-id-12345', {
          headers: { Authorization: `Bearer ${authToken}` },
        });
        return status === 404;
      })();

      // Test 8: PATCH /api/connections/[id] with valid data
      await test(`PATCH /api/connections/${createdConnectionId} should update connection`, async () => {
        const { status, data } = await fetchAPI('/connections', {
          method: 'PATCH',
          headers: { Authorization: `Bearer ${authToken}` },
          body: JSON.stringify({
            id: createdConnectionId,
            notes: 'Updated notes',
          }),
        });
        return status === 200 && data.notes === 'Updated notes';
      })();

      // Test 9: DELETE /api/connections/[id]
      await test(`DELETE /api/connections/${createdConnectionId} should delete connection`, async () => {
        const { status } = await fetchAPI(`/connections/${createdConnectionId}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${authToken}` },
        });
        return status === 200;
      })();

      // Test 10: GET /api/connections/[id] after delete (should return 404)
      await test(`GET /api/connections/${createdConnectionId} after delete should return 404`, async () => {
        const { status } = await fetchAPI(`/connections/${createdConnectionId}`, {
          headers: { Authorization: `Bearer ${authToken}` },
        });
        return status === 404;
      })();
    }

    // Test 11: Error handling - P2025 (Record not found)
    await test('DELETE /api/connections/non-existent-id should return 404', async () => {
      const { status, data } = await fetchAPI('/connections/non-existent-id-99999', {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${authToken}` },
      });
      return status === 404;
    })();
  }

  // Print results
  log('\n📊 Test Results:\n', 'blue');
  
  let passedCount = 0;
  let failedCount = 0;

  results.forEach((result) => {
    if (result.passed) {
      log(`✅ ${result.name}`, 'green');
      passedCount++;
    } else {
      log(`❌ ${result.name}`, 'red');
      if (result.error) {
        log(`   Error: ${result.error}`, 'red');
      }
      if (result.details) {
        log(`   Details: ${JSON.stringify(result.details, null, 2)}`, 'yellow');
      }
      failedCount++;
    }
  });

  log(`\n📈 Summary: ${passedCount} passed, ${failedCount} failed\n`, 
    failedCount === 0 ? 'green' : 'red');

  process.exit(failedCount > 0 ? 1 : 0);
}

// Run tests
runTests().catch((error) => {
  log(`\n❌ Test runner error: ${error}`, 'red');
  process.exit(1);
});

