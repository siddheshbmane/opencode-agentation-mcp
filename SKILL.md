---
name: agentation
description: Connect OpenCode agents to Agentation UI annotation system via MCP. Enables real-time UI feedback processing, bug fixing, UI review, critique mode, and self-driving mode.
---

# Agentation Integration for OpenCode

## Overview

This skill enables OpenCode agents to interact with Agentation annotations, providing seamless **UI feedback → AI agent → code fix** workflow.

Agentation is a tool that transforms UI annotations into structured, AI-readable context. When users click on UI elements and add feedback, Agentation captures:
- CSS selectors for code lookup
- React component tree for context
- Computed styles for appearance
- Accessibility information
- User feedback with intent and priority

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

## MCP Tools Available

### Query Tools

#### `agentation_list_sessions`
List all active annotation sessions.

**Returns:** Array of session objects with metadata

**Example:**
```typescript
const sessions = await agentation_list_sessions();
// Returns: [{ id: "sess_123", url: "http://localhost:3000", status: "active" }]
```

#### `agentation_get_session`
Get a session with all its annotations.

**Parameters:**
- `sessionId` (string): Session ID

**Returns:** Session object with all annotations

**Example:**
```typescript
const session = await agentation_get_session("sess_123");
// Returns: { id: "sess_123", annotations: [...], url: "..." }
```

#### `agentation_get_pending`
Get pending (unacknowledged) annotations for a session.

**Parameters:**
- `sessionId` (string): Session ID

**Returns:** Object with count and annotations array

**Example:**
```typescript
const pending = await agentation_get_pending("sess_123");
// Returns: { count: 3, annotations: [...] }
```

#### `agentation_get_all_pending`
Get all pending annotations across ALL sessions.

**Returns:** Object with total count and annotations array

**Example:**
```typescript
const allPending = await agentation_get_all_pending();
// Returns: { count: 5, annotations: [...] }
```

### Action Tools

#### `agentation_acknowledge`
Mark an annotation as acknowledged. Use this to let the user know you've seen their feedback.

**Parameters:**
- `annotationId` (string): Annotation ID

**Returns:** Acknowledgment confirmation

**Example:**
```typescript
await agentation_acknowledge("ann_123");
// Returns: { status: "acknowledged", annotationId: "ann_123" }
```

#### `agentation_resolve`
Mark an annotation as resolved. Use this after you've addressed the feedback.

**Parameters:**
- `annotationId` (string): Annotation ID
- `summary` (string, optional): Summary of what you did

**Returns:** Resolution confirmation

**Example:**
```typescript
await agentation_resolve("ann_123", "Fixed padding issue - increased from 8px to 16px");
// Returns: { status: "resolved", annotationId: "ann_123" }
```

#### `agentation_dismiss`
Dismiss an annotation. Use when you've decided not to address the feedback.

**Parameters:**
- `annotationId` (string): Annotation ID
- `reason` (string): Reason for dismissal

**Returns:** Dismissal confirmation

**Example:**
```typescript
await agentation_dismiss("ann_123", "This is intentional design");
// Returns: { status: "dismissed", annotationId: "ann_123", reason: "..." }
```

#### `agentation_reply`
Add a reply to an annotation's thread. Use to ask clarifying questions.

**Parameters:**
- `annotationId` (string): Annotation ID
- `message` (string): Your message

**Returns:** Reply confirmation

**Example:**
```typescript
await agentation_reply("ann_123", "Should this be 24px or 16px?");
// Returns: { status: "replied", annotationId: "ann_123", message: "..." }
```

### Watch Mode

#### `agentation_watch_annotations`
Block until new annotations appear, then return batch. Use for hands-free mode.

**Parameters:**
- `sessionId` (string, optional): Filter by session
- `batchWindowSeconds` (number, optional): Wait time to collect batch (default: 10, max: 60)
- `timeoutSeconds` (number, optional): Max wait time (default: 120, max: 300)

**Returns:** Batch of new annotations

**Example:**
```typescript
const batch = await agentation_watch_annotations({
  batchWindowSeconds: 10,
  timeoutSeconds: 120
});
// Returns: { annotations: [...], count: 3 }
```

## Annotation Object Structure

When you receive an annotation, it contains:

```typescript
{
  // Required fields
  id: string;              // Unique identifier
  comment: string;         // User's feedback
  elementPath: string;     // CSS selector path
  timestamp: number;       // Unix timestamp (ms)
  x: number;               // % of viewport width (0-100)
  y: number;               // px from document top
  element: string;         // Tag name ("button", "div")

  // Recommended fields
  url?: string;            // Page URL
  boundingBox?: {          // Element dimensions
    x: number;
    y: number;
    width: number;
    height: number;
  };

  // Optional context
  reactComponents?: string;   // Component tree ("App > Dashboard > Button")
  cssClasses?: string;        // Class list
  computedStyles?: string;    // Key CSS properties
  accessibility?: string;     // ARIA attributes, role
  nearbyText?: string;        // Visible text in/around element
  selectedText?: string;      // Text highlighted by user

  // Feedback classification
  intent?: "fix" | "change" | "question" | "approve";
  severity?: "blocking" | "important" | "suggestion";

  // Lifecycle
  status?: "pending" | "acknowledged" | "resolved" | "dismissed";
  thread?: ThreadMessage[];   // Conversation thread
}
```

## Usage Workflows

### Workflow 1: Manual Bug Fixing

**Scenario:** User annotates a bug in the UI

```typescript
// 1. Check for pending annotations
const pending = await agentation_get_all_pending();

// 2. Process each annotation
for (const annotation of pending.annotations) {
  // 3. Acknowledge to let user know you're working on it
  await agentation_acknowledge(annotation.id);

  // 4. Use elementPath to find the code
  const codeFiles = await grep(annotation.elementPath);

  // 5. Make the fix
  await coderAgent.fixIssue(annotation, codeFiles);

  // 6. Resolve with summary
  await agentation_resolve(annotation.id, "Fixed button alignment issue");
}
```

### Workflow 2: Hands-Free Mode

**Scenario:** Automatically process annotations as they're created

```typescript
// Run in a loop for continuous processing
while (true) {
  // 1. Wait for new annotations
  const batch = await agentation_watch_annotations({
    batchWindowSeconds: 10,
    timeoutSeconds: 120
  });

  // 2. Process each annotation in the batch
  for (const annotation of batch.annotations) {
    await agentation_acknowledge(annotation.id);
    await coderAgent.fixIssue(annotation);
    await agentation_resolve(annotation.id, "Issue fixed");
  }
}
```

### Workflow 3: UI Review with Questions

**Scenario:** Need clarification from user

```typescript
const pending = await agentation_get_all_pending();

for (const annotation of pending.annotations) {
  await agentation_acknowledge(annotation.id);

  // If unclear, ask for clarification
  if (annotation.comment === "Fix this") {
    await agentation_reply(annotation.id, "What specifically needs to be fixed?");

    // Wait for user response (poll or use watch mode)
    const response = await waitForUserReply(annotation.id);

    // Then fix based on clarification
    await coderAgent.fixIssue(response);
  } else {
    await coderAgent.fixIssue(annotation);
  }

  await agentation_resolve(annotation.id, "Fixed based on your feedback");
}
```

### Workflow 4: Critique Mode (Advanced)

**Scenario:** Agent opens browser and critiques UI automatically

```typescript
// 1. Open browser to the page
const browser = await chromium.launch({ headless: false });
const page = await browser.newPage();
await page.goto('http://localhost:3000');

// 2. Scroll through page and find issues
const elements = await page.$$('*');
const critiques = [];

for (const element of elements.slice(0, 50)) {
  const critique = await analyzeElement(page, element);
  if (critique) {
    critiques.push(critique);
  }
}

// 3. Create annotations via Agentation API
for (const critique of critiques) {
  await createAnnotation(critique);
}

await browser.close();
```

### Workflow 5: Self-Driving Mode (Advanced)

**Scenario:** Agent critiques AND fixes issues automatically

```typescript
// 1. Critique the UI
const critiques = await critiqueUI('http://localhost:3000');

// 2. Fix each issue
for (const critique of critiques) {
  // Create annotation
  const annotation = await createAnnotation(critique);

  // Acknowledge
  await agentation_acknowledge(annotation.id);

  // Fix the issue
  await coderAgent.fixIssue(annotation);

  // Resolve
  await agentation_resolve(annotation.id, "Fixed automatically");

  // Verify fix in browser
  await verifyFix('http://localhost:3000', annotation);
}
```

## Best Practices

### 1. Always Acknowledge First
```typescript
// Good
await agentation_acknowledge(annotation.id);
await coderAgent.fixIssue(annotation);

// Bad - user doesn't know you're working on it
await coderAgent.fixIssue(annotation);
await agentation_acknowledge(annotation.id);
```

### 2. Provide Detailed Summaries
```typescript
// Good
await agentation_resolve(annotation.id, "Fixed padding issue - increased from 8px to 16px in Button component");

// Bad - too vague
await agentation_resolve(annotation.id, "Fixed");
```

### 3. Use Severity for Prioritization
```typescript
const pending = await agentation_get_all_pending();

// Sort by severity
const sorted = pending.annotations.sort((a, b) => {
  const severityOrder = { blocking: 0, important: 1, suggestion: 2 };
  return severityOrder[a.severity] - severityOrder[b.severity];
});

// Process blocking issues first
for (const annotation of sorted) {
  await processAnnotation(annotation);
}
```

### 4. Leverage React Component Tree
```typescript
// Use reactComponents to navigate codebase
if (annotation.reactComponents) {
  const components = annotation.reactComponents.split(' > ');
  // ["App", "Dashboard", "Button"]

  // Find the Button component file
  const buttonFile = await findComponentFile('Button');
  await editFile(buttonFile, annotation);
}
```

### 5. Handle Errors Gracefully
```typescript
try {
  await agentation_acknowledge(annotation.id);
  await coderAgent.fixIssue(annotation);
  await agentation_resolve(annotation.id, "Fixed successfully");
} catch (error) {
  // If you can't fix it, dismiss with reason
  await agentation_dismiss(
    annotation.id,
    `Unable to fix: ${error.message}. Please provide more details.`
  );
}
```

## Integration with OpenCode SuperAgent

The Agentation skill integrates seamlessly with OpenCode's SuperAgent system:

```typescript
// SuperAgent automatically checks for annotations
class SuperAgent {
  async execute(task: string) {
    // 1. Check for pending annotations first
    const agentation = new AgentationClient();
    const pending = await agentation.getAllPendingAnnotations();

    if (pending.count > 0) {
      console.log(`📝 Found ${pending.count} pending annotations`);
      await this.processAnnotations(pending.annotations);
    }

    // 2. Execute original task
    return await this.executeTask(task);
  }

  private async processAnnotations(annotations: Annotation[]) {
    for (const annotation of annotations) {
      // Route to appropriate agent based on intent
      const agent = this.selectAgent(annotation);
      await agent.handleAnnotation(annotation);
    }
  }
}
```

## Troubleshooting

### Server Not Running
```bash
# Check if server is running
curl http://localhost:4747/health

# Start server
npx agentation-mcp server --port 4747
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

## Examples

### Example 1: Fix Button Alignment
```typescript
const annotation = {
  id: "ann_123",
  comment: "Button is misaligned with text",
  elementPath: "body > main > .hero > button.cta",
  reactComponents: "App > LandingPage > HeroSection > CTAButton",
  intent: "fix",
  severity: "important"
};

// 1. Acknowledge
await agentation_acknowledge(annotation.id);

// 2. Find the component
const componentFile = await findFile('CTAButton.tsx');

// 3. Fix alignment
await editFile(componentFile, {
  search: 'textAlign: "left"',
  replace: 'textAlign: "center"'
});

// 4. Resolve
await agentation_resolve(annotation.id, "Centered button alignment");
```

### Example 2: Improve Accessibility
```typescript
const annotation = {
  id: "ann_456",
  comment: "Missing aria-label on button",
  elementPath: "button.icon-only",
  accessibility: "Missing aria-label",
  intent: "fix",
  severity: "blocking"
};

await agentation_acknowledge(annotation.id);

const componentFile = await findFile('IconButton.tsx');
await editFile(componentFile, {
  search: '<button className="icon-only">',
  replace: '<button className="icon-only" aria-label="Close">'
});

await agentation_resolve(annotation.id, "Added aria-label for accessibility");
```

### Example 3: Ask for Clarification
```typescript
const annotation = {
  id: "ann_789",
  comment: "Change the color",
  elementPath: "button.primary",
  intent: "change",
  severity: "suggestion"
};

await agentation_acknowledge(annotation.id);

// Ask what color to change to
await agentation_reply(annotation.id, "What color would you like? (e.g., blue, green, red)");

// Wait for user response (in real implementation, you'd poll or use SSE)
// User replies: "blue"

// Then make the change
await editFile('Button.tsx', {
  search: 'backgroundColor: "red"',
  replace: 'backgroundColor: "blue"'
});

await agentation_resolve(annotation.id, "Changed button color to blue");
```

## Advanced Features

### Real-Time Events (SSE)
Subscribe to annotation events in real-time:

```typescript
const eventSource = new EventSource('http://localhost:4747/events');

eventSource.addEventListener('annotation.created', (event) => {
  const annotation = JSON.parse(event.data);
  console.log('New annotation:', annotation);
});

eventSource.addEventListener('annotation.updated', (event) => {
  const annotation = JSON.parse(event.data);
  console.log('Annotation updated:', annotation);
});
```

### Batch Processing
Process multiple annotations efficiently:

```typescript
const pending = await agentation_get_all_pending();

// Group by component
const byComponent = pending.annotations.reduce((acc, ann) => {
  const component = ann.reactComponents?.split(' > ').pop() || 'unknown';
  if (!acc[component]) acc[component] = [];
  acc[component].push(ann);
  return acc;
}, {});

// Process all annotations for each component at once
for (const [component, annotations] of Object.entries(byComponent)) {
  await coderAgent.fixMultipleIssues(component, annotations);
}
```

### Analytics
Track annotation patterns:

```typescript
const sessions = await agentation_list_sessions();

const stats = {
  totalAnnotations: 0,
  bySeverity: { blocking: 0, important: 0, suggestion: 0 },
  byIntent: { fix: 0, change: 0, question: 0, approve: 0 },
  byPage: {}
};

for (const session of sessions) {
  const fullSession = await agentation_get_session(session.id);
  stats.totalAnnotations += fullSession.annotations.length;

  for (const ann of fullSession.annotations) {
    stats.bySeverity[ann.severity]++;
    stats.byIntent[ann.intent]++;

    const page = new URL(ann.url).pathname;
    stats.byPage[page] = (stats.byPage[page] || 0) + 1;
  }
}

console.log('Annotation Statistics:', stats);
```

## Resources

- **Agentation Docs:** https://www.agentation.com/
- **MCP Protocol:** https://modelcontextprotocol.io/
- **OpenCode Docs:** Available in OpenCode system
- **Agentation GitHub:** https://github.com/benjitaylor/agentation

## Support

For issues or questions:
1. Check Agentation MCP server is running: `curl http://localhost:4747/health`
2. Run diagnostics: `npx agentation-mcp doctor`
3. Check server logs: `tail -f /tmp/agentation-mcp.log`
4. Review this skill documentation

---

**Version:** 1.0
**Last Updated:** 2026-03-16
**Status:** ✅ Production Ready
