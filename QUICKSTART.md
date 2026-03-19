# Quick Start Guide

## 🚀 Your Agentation MCP Server

**URL:** `https://opencode-agentation-mcp-production.up.railway.app`

**Status:** ⏳ Waiting for deployment

---

## Step 1: Deploy to Railway

1. **Open Railway Dashboard:**
   ```
   https://railway.com/project/15d21ba2-523b-48b9-a741-0f58c21f823d
   ```

2. **Create New Service:**
   - Click "+ New Service"
   - Select "Empty Service"
   - Name it: `agentation-mcp`

3. **Configure Service:**
   ```
   Builder: Nixpacks
   Start Command: npx agentation-mcp server --port 4747
   Port: 4747
   ```

4. **Deploy:**
   - Click "Deploy"
   - Wait for build to complete

5. **Get Domain:**
   - Go to "Networking" tab
   - Click "Generate Domain"
   - Copy the URL

---

## Step 2: Test Your Deployment

```bash
# Test the server
curl https://YOUR-DOMAIN.up.railway.app/health

# Should return:
# {"status":"ok","mode":"remote"}
```

---

## Step 3: Connect to OpenCode

### Option A: MCP Configuration

Create `~/.opencode/mcp/agentation.json`:

```json
{
  "command": "npx",
  "args": ["-y", "agentation-mcp", "server", "--http-url", "https://YOUR-DOMAIN.up.railway.app"]
}
```

### Option B: Use Helper Tools

```typescript
// Use the tools we created
import { agentationTools } from './tools.js';

const pending = await agentationTools.agentation_get_all_pending();
console.log(`Found ${pending.count} pending annotations`);
```

---

## Step 4: Use with Agentation Browser Extension

1. Install Agentation browser extension
2. Open any web app in browser
3. Click Agentation icon
4. Annotate UI elements
5. Check annotations via API

---

## Available API Endpoints

```
GET  /health              - Health check
GET  /status              - Server status
GET  /sessions            - List sessions
POST /sessions            - Create session
GET  /sessions/:id        - Get session with annotations
GET  /pending             - Get all pending annotations
GET  /sessions/:id/pending - Get pending for session
POST /annotations/:id/acknowledge - Acknowledge
POST /annotations/:id/resolve     - Resolve
POST /annotations/:id/dismiss     - Dismiss
POST /annotations/:id/thread     - Reply
GET  /events              - SSE events stream
```

---

## Example Workflow

### 1. Create Session
```bash
curl -X POST https://YOUR-DOMAIN.up.railway.app/sessions \
  -H "Content-Type: application/json" \
  -d '{"url":"http://localhost:3000"}'
```

### 2. Add Annotation (via browser extension)
- Open http://localhost:3000 in browser
- Click Agentation icon
- Click on UI element
- Add comment

### 3. Get Pending Annotations
```bash
curl https://YOUR-DOMAIN.up.railway.app/pending
```

### 4. Process and Resolve
```bash
# Acknowledge
curl -X POST https://YOUR-DOMAIN.up.railway.app/annotations/ann_123/acknowledge

# Fix the issue in your code

# Resolve
curl -X POST https://YOUR-DOMAIN.up.railway.app/annotations/ann_123/resolve \
  -H "Content-Type: application/json" \
  -d '{"summary":"Fixed padding issue"}'
```

---

## Troubleshooting

### Server Not Accessible?

1. Check Railway dashboard for deployment status
2. Make sure service is running
3. Generate domain in Networking tab
4. Verify URL is correct

### No Annotations Found?

1. Create a session first: `POST /sessions`
2. Use Agentation browser extension to add annotations
3. Check pending: `GET /pending`

### Connection Refused?

1. Verify server is running
2. Check firewall settings
3. Try HTTP instead of HTTPS

---

## Next Steps

- 📖 Read `README.md` for full documentation
- 📦 Check `SKILL.md` for OpenCode integration
- 🚢 See `DEPLOYMENT.md` for deployment options
- 🧪 Run `test-server.sh` to test your deployment

---

## Support

- GitHub: https://github.com/siddheshbmane/opencode-agentation-mcp
- Agentation Docs: https://www.agentation.com/

---

**Status:** ⏳ Awaiting Railway Deployment
**Last Updated:** 2026-03-19
