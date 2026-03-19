# OpenCode Agentation MCP Integration

Connect OpenCode agents to Agentation UI annotation system via MCP (Model Context Protocol).

## Overview

This MCP server enables seamless **UI feedback → AI agent → code fix** workflow by integrating Agentation's annotation system with OpenCode's AI agents.

### Features

- 🔗 **MCP Protocol Support** - Native Model Context Protocol integration
- 📝 **Real-time Annotations** - Process UI feedback as it's created
- 🤖 **AI Agent Ready** - Connect to Claude Code, Cursor, and other AI tools
- 🔧 **Multiple Modes** - Manual, hands-free, critique, and self-driving modes
- 📊 **Rich Context** - CSS selectors, React components, accessibility info
- 💬 **Two-way Communication** - Agents can ask clarifying questions

## Installation

### Prerequisites

- Node.js 18+
- npm or pnpm

### Quick Install

```bash
# Install globally
npm install -g agentation-mcp

# Or install this repository
git clone https://github.com/YOUR_USERNAME/opencode-agentation-mcp.git
cd opencode-agentation-mcp
npm install
```

### Start the Server

```bash
npm start
```

Or run in background:

```bash
npm start > /tmp/agentation-mcp.log 2>&1 &
```

## Quick Start

### 1. Verify Server is Running

```bash
curl http://localhost:4747/health
```

Expected response:
```json
{
  "status": "ok",
  "mode": "local"
}
```

### 2. Connect to OpenCode

Add to your OpenCode MCP configuration:

```json
{
  "mcpServers": {
    "agentation": {
      "command": "npx",
      "args": ["agentation-mcp", "server", "--port", "4747"]
    }
  }
}
```

## Available Tools

### Query Tools

| Tool | Description |
|------|-------------|
| `agentation_list_sessions` | List all active annotation sessions |
| `agentation_get_session` | Get session with all annotations |
| `agentation_get_pending` | Get pending annotations for a session |
| `agentation_get_all_pending` | Get all pending annotations across sessions |

### Action Tools

| Tool | Description |
|------|-------------|
| `agentation_acknowledge` | Mark annotation as acknowledged |
| `agentation_resolve` | Mark annotation as resolved |
| `agentation_dismiss` | Dismiss annotation with reason |
| `agentation_reply` | Add reply to annotation thread |

### Watch Mode

| Tool | Description |
|------|-------------|
| `agentation_watch_annotations` | Block until new annotations appear |

## Usage Examples

### Basic Workflow

```typescript
import { agentationTools } from './tools.js';

// Check for pending annotations
const pending = await agentationTools.agentation_get_all_pending();

if (pending.count > 0) {
  console.log(`Found ${pending.count} pending annotations`);

  // Process each annotation
  for (const annotation of pending.annotations) {
    // Acknowledge
    await agentationTools.agentation_acknowledge(annotation.id);

    // Fix the issue
    await coderAgent.fixIssue(annotation);

    // Resolve
    await agentationTools.agentation_resolve(
      annotation.id,
      "Fixed padding issue"
    );
  }
}
```

### Hands-Free Mode

```typescript
// Automatically process annotations as they're created
while (true) {
  const batch = await agentationTools.agentation_watch_annotations({
    batchWindowSeconds: 10,
    timeoutSeconds: 120,
  });

  for (const annotation of batch.annotations) {
    await agentationTools.agentation_acknowledge(annotation.id);
    await coderAgent.fixIssue(annotation);
    await agentationTools.agentation_resolve(annotation.id, "Issue fixed");
  }
}
```

### Priority-Based Processing

```typescript
const pending = await agentationTools.agentation_get_all_pending();

// Sort by priority (blocking > important > suggestion)
const sorted = agentationTools.agentation_sort_by_priority(pending.annotations);

// Process blocking issues first
for (const annotation of sorted) {
  await agentationTools.agentation_acknowledge(annotation.id);
  await coderAgent.fixIssue(annotation);
  await agentationTools.agentation_resolve(annotation.id, "Issue fixed");
}
```

## API Endpoints

### Health & Status

- `GET /health` - Server health check
- `GET /status` - Server status with uptime

### Sessions

- `GET /sessions` - List all sessions
- `POST /sessions` - Create new session
- `GET /sessions/:id` - Get session with annotations

### Annotations

- `GET /pending` - Get all pending annotations
- `GET /sessions/:id/pending` - Get pending for session
- `POST /sessions/:id/annotations` - Create annotation
- `POST /annotations/:id/acknowledge` - Acknowledge
- `POST /annotations/:id/resolve` - Resolve
- `POST /annotations/:id/dismiss` - Dismiss
- `POST /annotations/:id/thread` - Reply

### Events

- `GET /events` - Global event stream (SSE)
- `GET /sessions/:id/events` - Session event stream (SSE)

## Annotation Object

```typescript
{
  id: string;              // Unique identifier
  comment: string;         // User's feedback
  elementPath: string;     // CSS selector path
  timestamp: number;       // Unix timestamp (ms)
  x: number;               // % of viewport width (0-100)
  y: number;               // px from document top
  element: string;         // Tag name ("button", "div")
  url?: string;            // Page URL
  boundingBox?: {          // Element dimensions
    x: number;
    y: number;
    width: number;
    height: number;
  };
  reactComponents?: string;   // Component tree
  cssClasses?: string;        // Class list
  computedStyles?: string;    // Key CSS properties
  accessibility?: string;     // ARIA attributes
  nearbyText?: string;        // Visible text
  selectedText?: string;      // Highlighted text
  intent?: "fix" | "change" | "question" | "approve";
  severity?: "blocking" | "important" | "suggestion";
  status?: "pending" | "acknowledged" | "resolved" | "dismissed";
  thread?: ThreadMessage[];   // Conversation thread
}
```

## Architecture

```
User (Browser) → Agentation Toolbar → Agentation MCP Server (localhost:4747)
                                                    ↓
                                            OpenCode Agents
                                                    ↓
                                            Code Changes
                                                    ↓
                                            Annotation Resolved
```

## Project Structure

```
opencode-agentation-mcp/
├── types.ts              # TypeScript type definitions
├── client.ts             # HTTP client for Agentation API
├── tools.ts              # MCP tool implementations
├── test.ts               # Test suite
├── demo.ts               # Demo script
├── package.json          # Package configuration
├── LICENSE               # MIT License
├── .gitignore            # Git ignore file
└── README.md             # Documentation
```

## Scripts

```bash
npm install           # Install dependencies
npm run test          # Run test suite
npm run demo          # Run demo script
npm run type-check    # Type check TypeScript
npm start             # Start MCP server
```

## Testing

### Manual Testing

```bash
# Health check
curl http://localhost:4747/health

# List sessions
curl http://localhost:4747/sessions

# Get pending annotations
curl http://localhost:4747/pending
```

### Automated Testing

```bash
npm test
```

## Troubleshooting

### Server Not Running

```bash
# Check if server is running
curl http://localhost:4747/health

# Start server
npm start

# Check logs
tail -f /tmp/agentation-mcp.log
```

### No Annotations Found

```bash
# Check sessions
curl http://localhost:4747/sessions

# Check pending annotations
curl http://localhost:4747/pending
```

### Connection Issues

```bash
# Verify server is accessible
npx agentation-mcp doctor

# Check server logs
tail -f /tmp/agentation-mcp.log
```

## Resources

- [Agentation Documentation](https://www.agentation.com/)
- [MCP Protocol](https://modelcontextprotocol.io/)
- [Agentation GitHub](https://github.com/benjitaylor/agentation)

## License

MIT License - see LICENSE file for details.

## Support

For issues or questions:
1. Check server is running: `curl http://localhost:4747/health`
2. Run diagnostics: `npx agentation-mcp doctor`
3. Review this documentation
4. Open an issue on GitHub

## Contributing

Contributions are welcome! Please open an issue or pull request on GitHub.

---

**Version:** 1.0.0
**Last Updated:** 2026-03-16
**Status:** ✅ Production Ready
