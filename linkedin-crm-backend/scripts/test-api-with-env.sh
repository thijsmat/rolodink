#!/bin/bash
# Helper script om API tests uit te voeren met credentials uit .env.test
#
# Gebruik:
#   1. Maak .env.test bestand: cp .env.test.example .env.test
#   2. Vul je credentials in: nano .env.test
#   3. Voer tests uit: ./scripts/test-api-with-env.sh

set -e

# Check if .env.test exists
if [ ! -f .env.test ]; then
    echo "❌ .env.test bestand niet gevonden!"
    echo ""
    echo "📝 Maak het aan:"
    echo "   cp test-credentials.example .env.test"
    echo "   nano .env.test  # Vul je credentials in"
    echo ""
    exit 1
fi

# Load environment variables from .env.test
export $(cat .env.test | grep -v '^#' | xargs)

# Check if credentials are set
if [ -z "$TEST_EMAIL" ] || [ -z "$TEST_PASSWORD" ]; then
    echo "❌ TEST_EMAIL of TEST_PASSWORD niet ingesteld in .env.test"
    echo ""
    echo "📝 Zorg dat .env.test de volgende variabelen bevat:"
    echo "   TEST_EMAIL=your-email@example.com"
    echo "   TEST_PASSWORD=your-password"
    echo ""
    exit 1
fi

echo "🧪 Starting API Tests with credentials from .env.test..."
echo "📧 Test Email: $TEST_EMAIL"
echo "🔗 API Base URL: ${API_BASE_URL:-http://localhost:3000/api}"
echo ""

# Run the test script
npm run test:api

