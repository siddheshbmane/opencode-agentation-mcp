/**
 * Agentation Demo Script
 *
 * Demonstrates how to use the Agentation integration with OpenCode
 */

import { agentationTools } from "./tools.js";
import { AgentationClient } from "./client.js";

// ============================================================================
// Demo Configuration
// ============================================================================

const client = new AgentationClient("http://localhost:4747");

// ============================================================================
// Demo Functions
// ============================================================================

/**
 * Demo 1: Basic Workflow
 */
async function demo1_BasicWorkflow() {
  console.log("\n" + "=".repeat(60));
  console.log("📝 Demo 1: Basic Workflow");
  console.log("=".repeat(60));

  // Check server health
  console.log("\n1️⃣ Checking server health...");
  const health = await agentationTools.agentation_health();
  console.log(`   Status: ${health.status}`);
  console.log(`   Mode: ${health.mode}`);

  // List sessions
  console.log("\n2️⃣ Listing sessions...");
  const sessions = await agentationTools.agentation_list_sessions();
  console.log(`   Found ${sessions.total} session(s)`);

  // Get pending annotations
  console.log("\n3️⃣ Getting pending annotations...");
  const pending = await agentationTools.agentation_get_all_pending();
  console.log(`   Found ${pending.count} pending annotation(s)`);

  if (pending.count > 0) {
    console.log("\n4️⃣ Processing annotations...");
    for (const annotation of pending.annotations) {
      console.log(`   - Annotation: ${annotation.comment}`);
      console.log(`     Element: ${annotation.elementPath}`);
      console.log(`     Severity: ${annotation.severity}`);

      // Acknowledge
      console.log("     → Acknowledging...");
      await agentationTools.agentation_acknowledge(annotation.id);

      // In a real scenario, you would fix the issue here
      console.log("     → Fixing issue (simulated)...");

      // Resolve
      console.log("     → Resolving...");
      await agentationTools.agentation_resolve(
        annotation.id,
        "Issue fixed (demo)"
      );
      console.log("     ✅ Done!");
    }
  } else {
    console.log("\n4️⃣ No pending annotations to process");
  }
}

/**
 * Demo 2: Priority-Based Processing
 */
async function demo2_PriorityBasedProcessing() {
  console.log("\n" + "=".repeat(60));
  console.log("📝 Demo 2: Priority-Based Processing");
  console.log("=".repeat(60));

  // Get all pending annotations
  console.log("\n1️⃣ Getting all pending annotations...");
  const pending = await agentationTools.agentation_get_all_pending();
  console.log(`   Found ${pending.count} annotation(s)`);

  if (pending.count > 0) {
    // Sort by priority
    console.log("\n2️⃣ Sorting by priority...");
    const sorted = agentationTools.agentation_sort_by_priority(pending.annotations);

    console.log("\n3️⃣ Processing in priority order:");
    for (const annotation of sorted) {
      console.log(`   [${annotation.severity?.toUpperCase()}] ${annotation.comment}`);
    }
  } else {
    console.log("\n2️⃣ No annotations to sort");
  }
}

/**
 * Demo 3: Component-Based Grouping
 */
async function demo3_ComponentBasedGrouping() {
  console.log("\n" + "=".repeat(60));
  console.log("📝 Demo 3: Component-Based Grouping");
  console.log("=".repeat(60));

  // Get all pending annotations
  console.log("\n1️⃣ Getting all pending annotations...");
  const pending = await agentationTools.agentation_get_all_pending();
  console.log(`   Found ${pending.count} annotation(s)`);

  if (pending.count > 0) {
    // Group by component
    console.log("\n2️⃣ Grouping by component...");
    const grouped = agentationTools.agentation_group_by_component(pending.annotations);

    console.log("\n3️⃣ Annotations by component:");
    for (const [component, annotations] of Object.entries(grouped)) {
      console.log(`   📦 ${component}: ${annotations.length} annotation(s)`);
      for (const annotation of annotations) {
        console.log(`      - ${annotation.comment}`);
      }
    }
  } else {
    console.log("\n2️⃣ No annotations to group");
  }
}

/**
 * Demo 4: Filter by Severity
 */
async function demo4_FilterBySeverity() {
  console.log("\n" + "=".repeat(60));
  console.log("📝 Demo 4: Filter by Severity");
  console.log("=".repeat(60));

  // Get annotations by severity
  console.log("\n1️⃣ Filtering by severity...");

  const blocking = await agentationTools.agentation_get_by_severity("blocking");
  console.log(`   🔴 Blocking: ${blocking.length} annotation(s)`);

  const important = await agentationTools.agentation_get_by_severity("important");
  console.log(`   🟡 Important: ${important.length} annotation(s)`);

  const suggestion = await agentationTools.agentation_get_by_severity("suggestion");
  console.log(`   🟢 Suggestion: ${suggestion.length} annotation(s)`);
}

/**
 * Demo 5: Filter by Intent
 */
async function demo5_FilterByIntent() {
  console.log("\n" + "=".repeat(60));
  console.log("📝 Demo 5: Filter by Intent");
  console.log("=".repeat(60));

  // Get annotations by intent
  console.log("\n1️⃣ Filtering by intent...");

  const fixes = await agentationTools.agentation_get_by_intent("fix");
  console.log(`   🔧 Fix: ${fixes.length} annotation(s)`);

  const changes = await agentationTools.agentation_get_by_intent("change");
  console.log(`   ✏️ Change: ${changes.length} annotation(s)`);

  const questions = await agentationTools.agentation_get_by_intent("question");
  console.log(`   ❓ Question: ${questions.length} annotation(s)`);

  const approves = await agentationTools.agentation_get_by_intent("approve");
  console.log(`   ✅ Approve: ${approves.length} annotation(s)`);
}

/**
 * Demo 6: Create Test Annotation
 */
async function demo6_CreateTestAnnotation() {
  console.log("\n" + "=".repeat(60));
  console.log("📝 Demo 6: Create Test Annotation");
  console.log("=".repeat(60));

  console.log("\n1️⃣ Creating test annotation...");
  const annotation = await client.createAnnotation({
    comment: "Demo annotation - button alignment issue",
    elementPath: "body > main > .hero > button.cta",
    element: "button",
    x: 50,
    y: 100,
    url: "http://localhost:3000/demo",
    intent: "fix",
    severity: "important",
    reactComponents: "App > DemoPage > HeroSection > CTAButton",
  });

  console.log(`   ✅ Created annotation: ${annotation.id}`);
  console.log(`   Comment: ${annotation.comment}`);
  console.log(`   Element: ${annotation.elementPath}`);

  // Acknowledge it
  console.log("\n2️⃣ Acknowledging annotation...");
  await agentationTools.agentation_acknowledge(annotation.id);
  console.log("   ✅ Acknowledged");

  // Resolve it
  console.log("\n3️⃣ Resolving annotation...");
  await agentationTools.agentation_resolve(
    annotation.id,
    "Fixed button alignment (demo)"
  );
  console.log("   ✅ Resolved");

  // Cleanup
  console.log("\n4️⃣ Cleaning up...");
  await client.deleteAnnotation(annotation.id);
  console.log("   ✅ Deleted");
}

/**
 * Demo 7: Statistics
 */
async function demo7_Statistics() {
  console.log("\n" + "=".repeat(60));
  console.log("📝 Demo 7: Statistics");
  console.log("=".repeat(60));

  // Get server status
  console.log("\n1️⃣ Server status:");
  const status = await agentationTools.agentation_status();
  console.log(`   Status: ${status.status}`);
  console.log(`   Uptime: ${status.uptime}s`);
  console.log(`   Version: ${status.version}`);
  console.log(`   Port: ${status.port}`);

  // Get sessions
  console.log("\n2️⃣ Sessions:");
  const sessions = await agentationTools.agentation_list_sessions();
  console.log(`   Total sessions: ${sessions.total}`);

  // Get pending annotations
  console.log("\n3️⃣ Pending annotations:");
  const pending = await agentationTools.agentation_get_all_pending();
  console.log(`   Total pending: ${pending.count}`);

  // Calculate statistics
  const bySeverity: Record<string, number> = {};
  const byIntent: Record<string, number> = {};

  for (const annotation of pending.annotations) {
    if (annotation.severity) {
      bySeverity[annotation.severity] = (bySeverity[annotation.severity] || 0) + 1;
    }
    if (annotation.intent) {
      byIntent[annotation.intent] = (byIntent[annotation.intent] || 0) + 1;
    }
  }

  console.log("\n4️⃣ By severity:");
  for (const [severity, count] of Object.entries(bySeverity)) {
    console.log(`   ${severity}: ${count}`);
  }

  console.log("\n5️⃣ By intent:");
  for (const [intent, count] of Object.entries(byIntent)) {
    console.log(`   ${intent}: ${count}`);
  }
}

// ============================================================================
// Main Demo Runner
// ============================================================================

async function runDemos() {
  console.log("🚀 Agentation Integration Demo");
  console.log("=" .repeat(60));

  try {
    // Run all demos
    await demo1_BasicWorkflow();
    await demo2_PriorityBasedProcessing();
    await demo3_ComponentBasedGrouping();
    await demo4_FilterBySeverity();
    await demo5_FilterByIntent();
    await demo6_CreateTestAnnotation();
    await demo7_Statistics();

    console.log("\n" + "=".repeat(60));
    console.log("✅ All demos completed successfully!");
    console.log("=".repeat(60));
  } catch (error) {
    console.error("\n❌ Demo failed:", error);
    process.exit(1);
  }
}

// ============================================================================
// Run Demo
// ============================================================================

if (require.main === module) {
  runDemos()
    .then(() => {
      console.log("\n✅ Demo completed successfully");
      process.exit(0);
    })
    .catch((error) => {
      console.error("\n❌ Demo failed:", error);
      process.exit(1);
    });
}

export { runDemos };
