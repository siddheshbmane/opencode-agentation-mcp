/**
 * Agentation Integration Tests
 *
 * Comprehensive test suite for Agentation MCP integration
 */

import { agentationTools } from "./tools.js";
import { AgentationClient } from "./client.js";
import type { Annotation } from "./types.js";

// ============================================================================
// Test Configuration
// ============================================================================

const TEST_TIMEOUT = 30000; // 30 seconds
const client = new AgentationClient("http://localhost:4747");

// ============================================================================
// Test Utilities
// ============================================================================

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

async function runTest(name: string, fn: () => Promise<void>): Promise<void> {
  console.log(`\n🧪 Testing: ${name}`);
  try {
    await fn();
    console.log(`✅ PASSED: ${name}`);
  } catch (error) {
    console.error(`❌ FAILED: ${name}`);
    console.error(error);
    throw error;
  }
}

// ============================================================================
// Test Suite
// ============================================================================

export async function runTests(): Promise<void> {
  console.log("🚀 Starting Agentation Integration Tests");
  console.log("=" .repeat(60));

  try {
    // Health & Status Tests
    await runTest("Server health check", testHealthCheck);
    await runTest("Server status", testServerStatus);

    // Session Tests
    await runTest("List sessions", testListSessions);

    // Annotation Query Tests
    await runTest("Get all pending annotations", testGetAllPending);
    await runTest("Get annotations by severity", testGetBySeverity);
    await runTest("Get annotations by intent", testGetByIntent);

    // Annotation Action Tests
    await runTest("Acknowledge annotation", testAcknowledgeAnnotation);
    await runTest("Resolve annotation", testResolveAnnotation);
    await runTest("Dismiss annotation", testDismissAnnotation);
    await runTest("Reply to annotation", testReplyToAnnotation);

    // Utility Tests
    await runTest("Sort annotations by priority", testSortByPriority);
    await runTest("Group annotations by component", testGroupByComponent);

    // Watch Mode Test (with timeout)
    await runTest("Watch annotations (timeout)", testWatchAnnotations);

    console.log("\n" + "=".repeat(60));
    console.log("✅ All tests passed!");
  } catch (error) {
    console.log("\n" + "=".repeat(60));
    console.error("❌ Some tests failed");
    throw error;
  }
}

// ============================================================================
// Individual Tests
// ============================================================================

async function testHealthCheck(): Promise<void> {
  const health = await agentationTools.agentation_health();
  assert(health.status === "ok", "Health status should be 'ok'");
  assert(health.mode === "local", "Mode should be 'local'");
}

async function testServerStatus(): Promise<void> {
  const status = await agentationTools.agentation_status();
  assert(status.status === "running", "Status should be 'running'");
  assert(status.uptime > 0, "Uptime should be positive");
  assert(!!status.version, "Version should be defined");
  assert(status.port === 4747, "Port should be 4747");
}

async function testListSessions(): Promise<void> {
  const sessions = await agentationTools.agentation_list_sessions();
  assert(Array.isArray(sessions.sessions), "Sessions should be an array");
  assert(typeof sessions.total === "number", "Total should be a number");
  assert(sessions.total >= 0, "Total should be non-negative");
}

async function testGetAllPending(): Promise<void> {
  const pending = await agentationTools.agentation_get_all_pending();
  assert(typeof pending.count === "number", "Count should be a number");
  assert(Array.isArray(pending.annotations), "Annotations should be an array");
  assert(pending.count === pending.annotations.length, "Count should match array length");
}

async function testGetBySeverity(): Promise<void> {
  const blocking = await agentationTools.agentation_get_by_severity("blocking");
  assert(Array.isArray(blocking), "Result should be an array");

  const important = await agentationTools.agentation_get_by_severity("important");
  assert(Array.isArray(important), "Result should be an array");

  const suggestion = await agentationTools.agentation_get_by_severity("suggestion");
  assert(Array.isArray(suggestion), "Result should be an array");
}

async function testGetByIntent(): Promise<void> {
  const fixes = await agentationTools.agentation_get_by_intent("fix");
  assert(Array.isArray(fixes), "Result should be an array");

  const changes = await agentationTools.agentation_get_by_intent("change");
  assert(Array.isArray(changes), "Result should be an array");

  const questions = await agentationTools.agentation_get_by_intent("question");
  assert(Array.isArray(questions), "Result should be an array");
}

async function testAcknowledgeAnnotation(): Promise<void> {
  // First, create a test annotation
  const testAnnotation = await createTestAnnotation();

  // Acknowledge it
  const result = await agentationTools.agentation_acknowledge(testAnnotation.id);
  assert(result.status === "acknowledged", "Status should be 'acknowledged'");
  assert(result.annotationId === testAnnotation.id, "Annotation ID should match");

  // Cleanup
  await cleanupTestAnnotation(testAnnotation.id);
}

async function testResolveAnnotation(): Promise<void> {
  // First, create a test annotation
  const testAnnotation = await createTestAnnotation();

  // Resolve it
  const result = await agentationTools.agentation_resolve(
    testAnnotation.id,
    "Test resolution summary"
  );
  assert(result.status === "resolved", "Status should be 'resolved'");
  assert(result.annotationId === testAnnotation.id, "Annotation ID should match");
  assert(result.summary === "Test resolution summary", "Summary should match");

  // Cleanup
  await cleanupTestAnnotation(testAnnotation.id);
}

async function testDismissAnnotation(): Promise<void> {
  // First, create a test annotation
  const testAnnotation = await createTestAnnotation();

  // Dismiss it
  const result = await agentationTools.agentation_dismiss(
    testAnnotation.id,
    "Test dismissal reason"
  );
  assert(result.status === "dismissed", "Status should be 'dismissed'");
  assert(result.annotationId === testAnnotation.id, "Annotation ID should match");
  assert(result.reason === "Test dismissal reason", "Reason should match");

  // Cleanup
  await cleanupTestAnnotation(testAnnotation.id);
}

async function testReplyToAnnotation(): Promise<void> {
  // First, create a test annotation
  const testAnnotation = await createTestAnnotation();

  // Reply to it
  const result = await agentationTools.agentation_reply(
    testAnnotation.id,
    "Test reply message"
  );
  assert(result.status === "replied", "Status should be 'replied'");
  assert(result.annotationId === testAnnotation.id, "Annotation ID should match");
  assert(result.message === "Test reply message", "Message should match");

  // Cleanup
  await cleanupTestAnnotation(testAnnotation.id);
}

async function testSortByPriority(): Promise<void> {
  // Create test annotations with different severities
  const annotations: Annotation[] = [
    {
      id: "test_1",
      comment: "Suggestion",
      elementPath: "div",
      timestamp: Date.now(),
      x: 50,
      y: 100,
      element: "div",
      severity: "suggestion",
    },
    {
      id: "test_2",
      comment: "Blocking issue",
      elementPath: "button",
      timestamp: Date.now(),
      x: 50,
      y: 100,
      element: "button",
      severity: "blocking",
    },
    {
      id: "test_3",
      comment: "Important issue",
      elementPath: "input",
      timestamp: Date.now(),
      x: 50,
      y: 100,
      element: "input",
      severity: "important",
    },
  ];

  const sorted = agentationTools.agentation_sort_by_priority(annotations);

  assert(sorted[0].severity === "blocking", "First should be blocking");
  assert(sorted[1].severity === "important", "Second should be important");
  assert(sorted[2].severity === "suggestion", "Third should be suggestion");
}

async function testGroupByComponent(): Promise<void> {
  // Create test annotations with different components
  const annotations: Annotation[] = [
    {
      id: "test_1",
      comment: "Button issue",
      elementPath: "button",
      timestamp: Date.now(),
      x: 50,
      y: 100,
      element: "button",
      reactComponents: "App > Dashboard > Button",
    },
    {
      id: "test_2",
      comment: "Another button issue",
      elementPath: "button",
      timestamp: Date.now(),
      x: 50,
      y: 100,
      element: "button",
      reactComponents: "App > Dashboard > Button",
    },
    {
      id: "test_3",
      comment: "Input issue",
      elementPath: "input",
      timestamp: Date.now(),
      x: 50,
      y: 100,
      element: "input",
      reactComponents: "App > Dashboard > Input",
    },
  ];

  const grouped = agentationTools.agentation_group_by_component(annotations);

  assert(grouped["Button"].length === 2, "Button should have 2 annotations");
  assert(grouped["Input"].length === 1, "Input should have 1 annotation");
}

async function testWatchAnnotations(): Promise<void> {
  // Test watch mode with short timeout (should timeout and return empty)
  const result = await agentationTools.agentation_watch_annotations({
    timeoutSeconds: 2,
  });

  assert(Array.isArray(result.annotations), "Annotations should be an array");
  assert(typeof result.count === "number", "Count should be a number");
}

// ============================================================================
// Test Helpers
// ============================================================================

async function createTestAnnotation(): Promise<Annotation> {
  const annotation = await client.createAnnotation({
    comment: "Test annotation",
    elementPath: "body > div.test",
    element: "div",
    x: 50,
    y: 100,
    url: "http://localhost:3000/test",
    intent: "fix",
    severity: "suggestion",
  });

  return annotation;
}

async function cleanupTestAnnotation(annotationId: string): Promise<void> {
  try {
    await client.deleteAnnotation(annotationId);
  } catch (error) {
    // Ignore cleanup errors
    console.warn(`Failed to cleanup test annotation ${annotationId}:`, error);
  }
}

// ============================================================================
// Run Tests
// ============================================================================

if (require.main === module) {
  runTests()
    .then(() => {
      console.log("\n✅ Test suite completed successfully");
      process.exit(0);
    })
    .catch((error) => {
      console.error("\n❌ Test suite failed:", error);
      process.exit(1);
    });
}
