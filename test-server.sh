#!/bin/bash

# Test Agentation MCP Server
# Usage: ./test.sh [URL]

AGENTATION_URL="${1:-https://earnest-nurturing-production-d469.up.railway.app}"

echo "🧪 Testing Agentation MCP Server"
echo "================================="
echo ""
echo "URL: $AGENTATION_URL"
echo ""

# Test 1: Health Check
echo "1️⃣  Health Check"
echo "----------------"
health_response=$(curl -s "$AGENTATION_URL/health")
if [ $? -eq 0 ]; then
    echo "✅ Server is accessible"
    echo "$health_response" | jq .
else
    echo "❌ Server not accessible"
    echo ""
    echo "Please make sure:"
    echo "1. Service is deployed in Railway"
    echo "2. Domain is generated in Railway dashboard"
    echo "3. URL is correct: $AGENTATION_URL"
    exit 1
fi

echo ""

# Test 2: Status Check
echo "2️⃣  Status Check"
echo "----------------"
curl -s "$AGENTATION_URL/status" | jq .

echo ""

# Test 3: List Sessions
echo "3️⃣  List Sessions"
echo "-----------------"
curl -s "$AGENTATION_URL/sessions" | jq .

echo ""

# Test 4: Create Session
echo "4️⃣  Create Test Session"
echo "-----------------------"
session_response=$(curl -s -X POST "$AGENTATION_URL/sessions" \
    -H "Content-Type: application/json" \
    -d '{"url":"http://localhost:3000/test"}')
echo "$session_response" | jq .
session_id=$(echo "$session_response" | jq -r '.id')

echo ""

# Test 5: Get Pending Annotations
echo "5️⃣  Get Pending Annotations"
echo "---------------------------"
curl -s "$AGENTATION_URL/pending" | jq .

echo ""
echo "✅ All tests completed!"
echo ""
echo "📚 Documentation:"
echo "   - README.md: General usage guide"
echo "   - SKILL.md: OpenCode skill definition"
echo ""
echo "🔧 Next Steps:"
echo "   1. Open browser with Agentation toolbar"
echo "   2. Annotate some UI elements"
echo "   3. Check pending annotations here"
echo "   4. Connect OpenCode agents to process annotations"
