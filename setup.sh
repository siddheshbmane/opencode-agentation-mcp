#!/bin/bash

# Agentation MCP Setup Script
# Run this script to configure Agentation with OpenCode

echo "🚀 Agentation MCP Setup Script"
echo "=============================="

# Variables
AGENTATION_URL="https://opencode-agentation-mcp-production.up.railway.app"

echo ""
echo "📝 Step 1: Testing Connection to Railway Deployment"
echo "--------------------------------------------------"

# Test if server is accessible
response=$(curl -s -o /dev/null -w "%{http_code}" "$AGENTATION_URL/health" 2>/dev/null)

if [ "$response" = "200" ]; then
    echo "✅ Server is accessible at: $AGENTATION_URL"
    curl -s "$AGENTATION_URL/health" | jq .
else
    echo "❌ Server not accessible (HTTP $response)"
    echo ""
    echo "📋 Please check in Railway dashboard:"
    echo "   1. Go to: https://railway.com/project/15d21ba2-523b-48b9-a741-0f58c21f823d"
    echo "   2. Make sure your service is deployed"
    echo "   3. Go to Networking → Generate Domain"
    echo "   4. Update the AGENTATION_URL in this script"
fi

echo ""
echo "📝 Step 2: OpenCode MCP Configuration"
echo "-------------------------------------"

# Create OpenCode MCP config directory
OPENCODE_MCP_DIR="$HOME/.opencode/mcp"
mkdir -p "$OPENCODE_MCP_DIR"

# Create MCP config
cat > "$OPENCODE_MCP_DIR/agentation.json" <<EOF
{
  "command": "npx",
  "args": ["-y", "agentation-mcp", "server", "--http-url", "$AGENTATION_URL"]
}
EOF

echo "✅ Created: $OPENCODE_MCP_DIR/agentation.json"

echo ""
echo "📝 Step 3: Testing MCP Connection"
echo "---------------------------------"

# Test MCP connection
echo "Testing MCP tools..."

echo ""
echo "📝 Step 4: Documentation"
echo "-----------------------"
echo ""
echo "📚 Available Documentation:"
echo "   - README.md: General usage guide"
echo "   - SKILL.md: OpenCode skill definition"
echo "   - DEPLOYMENT.md: Deployment options"
echo ""
echo "🔧 Tools Available:"
echo "   - agentation_list_sessions"
echo "   - agentation_get_all_pending"
echo "   - agentation_acknowledge"
echo "   - agentation_resolve"
echo "   - agentation_reply"
echo "   - agentation_watch_annotations"
echo ""
echo "✅ Setup Complete!"
echo ""
echo "📌 Next Steps:"
echo "   1. Restart OpenCode to load the MCP server"
echo "   2. Test with: curl $AGENTATION_URL/health"
echo "   3. View docs: cat README.md"
