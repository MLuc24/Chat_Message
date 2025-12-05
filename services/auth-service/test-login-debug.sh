#!/bin/bash

# Test Login Debug Logging Script
# This script demonstrates the debug logging for login function

echo "=========================================="
echo "🧪 Testing Login Debug Logging"
echo "=========================================="
echo ""

API_URL="${API_URL:-http://localhost:3001}"

echo "📍 API URL: $API_URL"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: Successful Login
echo "=========================================="
echo "Test 1: Successful Login"
echo "=========================================="
echo ""

echo "Creating test user..."
REGISTER_RESPONSE=$(curl -s -X POST "$API_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "debug-test@example.com",
    "password": "Test123!@#",
    "name": "Debug Test User"
  }')

echo "Response: $REGISTER_RESPONSE"
echo ""

sleep 2

echo "Attempting login with correct credentials..."
LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -H "X-Request-Id: test-req-001" \
  -d '{
    "email": "debug-test@example.com",
    "password": "Test123!@#"
  }')

if echo "$LOGIN_RESPONSE" | grep -q "accessToken"; then
  echo -e "${GREEN}✅ Login successful${NC}"
else
  echo -e "${RED}❌ Login failed${NC}"
fi

echo "Response: $LOGIN_RESPONSE"
echo ""

# Test 2: Failed Login - Wrong Password
echo "=========================================="
echo "Test 2: Failed Login - Wrong Password"
echo "=========================================="
echo ""

echo "Attempting login with wrong password..."
WRONG_PASSWORD_RESPONSE=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -H "X-Request-Id: test-req-002" \
  -d '{
    "email": "debug-test@example.com",
    "password": "WrongPassword123"
  }')

if echo "$WRONG_PASSWORD_RESPONSE" | grep -q "Invalid credentials"; then
  echo -e "${YELLOW}⚠️  Login failed as expected (wrong password)${NC}"
else
  echo -e "${RED}❌ Unexpected response${NC}"
fi

echo "Response: $WRONG_PASSWORD_RESPONSE"
echo ""

# Test 3: Failed Login - User Not Found
echo "=========================================="
echo "Test 3: Failed Login - User Not Found"
echo "=========================================="
echo ""

echo "Attempting login with non-existent user..."
NOT_FOUND_RESPONSE=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -H "X-Request-Id: test-req-003" \
  -d '{
    "email": "nonexistent@example.com",
    "password": "SomePassword123"
  }')

if echo "$NOT_FOUND_RESPONSE" | grep -q "Invalid credentials"; then
  echo -e "${YELLOW}⚠️  Login failed as expected (user not found)${NC}"
else
  echo -e "${RED}❌ Unexpected response${NC}"
fi

echo "Response: $NOT_FOUND_RESPONSE"
echo ""

# Test 4: Multiple Rapid Logins (Performance Test)
echo "=========================================="
echo "Test 4: Multiple Rapid Logins (Performance)"
echo "=========================================="
echo ""

echo "Sending 5 login requests rapidly..."
for i in {1..5}; do
  echo "Request $i..."
  curl -s -X POST "$API_URL/auth/login" \
    -H "Content-Type: application/json" \
    -H "X-Request-Id: test-req-perf-$i" \
    -d '{
      "email": "debug-test@example.com",
      "password": "Test123!@#"
    }' > /dev/null &
done

wait
echo -e "${GREEN}✅ All requests completed${NC}"
echo ""

# Instructions for viewing logs
echo "=========================================="
echo "📋 View Debug Logs"
echo "=========================================="
echo ""
echo "To view the debug logs, run one of these commands:"
echo ""
echo "1. View all logs:"
echo "   docker logs messenger-auth-service"
echo ""
echo "2. View only login logs:"
echo "   docker logs messenger-auth-service 2>&1 | grep '[LOGIN]'"
echo ""
echo "3. View logs for specific request:"
echo "   docker logs messenger-auth-service 2>&1 | grep 'test-req-001'"
echo ""
echo "4. View successful logins:"
echo "   docker logs messenger-auth-service 2>&1 | grep '✅ User logged in'"
echo ""
echo "5. View failed logins:"
echo "   docker logs messenger-auth-service 2>&1 | grep '❌ Login failed'"
echo ""
echo "6. Follow logs in real-time:"
echo "   docker logs -f messenger-auth-service"
echo ""

echo "=========================================="
echo "✅ Test completed!"
echo "=========================================="
