/**
 * Agentation MCP Tools
 *
 * Implements MCP (Model Context Protocol) tools for OpenCode agents
 * to interact with Agentation annotations
 */

import {
  AgentationClient,
  checkHealth,
  getPendingAnnotations,
  watchAnnotations,
  acknowledgeAnnotation,
  resolveAnnotation,
  dismissAnnotation,
  replyToAnnotation,
} from "./client.js";
import type {
  Annotation,
  Session,
  SessionWithAnnotations,
  PendingAnnotationsResponse,
  SessionsListResponse,
  AcknowledgeResponse,
  ResolveResponse,
  DismissResponse,
  ReplyResponse,
  WatchAnnotationsResponse,
  WatchAnnotationsOptions,
} from "./types.js";

// ============================================================================
// Configuration
// ============================================================================

const DEFAULT_CLIENT = new AgentationClient("http://localhost:4747");

// ============================================================================
// Query Tools
// ============================================================================

/**
 * List all active annotation sessions
 *
 * @returns Array of session objects with metadata
 *
 * @example
 * const sessions = await agentation_list_sessions();
 * console.log(`Found ${sessions.total} sessions`);
 */
export async function agentation_list_sessions(): Promise<SessionsListResponse> {
  return DEFAULT_CLIENT.listSessions();
}

/**
 * Get a session with all its annotations
 *
 * @param sessionId - Session ID to retrieve
 * @returns Session object with all annotations
 *
 * @example
 * const session = await agentation_get_session("sess_123");
 * console.log(`Session has ${session.annotations.length} annotations`);
 */
export async function agentation_get_session(
  sessionId: string
): Promise<SessionWithAnnotations> {
  return DEFAULT_CLIENT.getSession(sessionId);
}

/**
 * Get pending (unacknowledged) annotations for a session
 *
 * @param sessionId - Session ID to get pending annotations for
 * @returns Object with count and annotations array
 *
 * @example
 * const pending = await agentation_get_pending("sess_123");
 * console.log(`Found ${pending.count} pending annotations`);
 * for (const annotation of pending.annotations) {
 *   console.log(`- ${annotation.comment}`);
 * }
 */
export async function agentation_get_pending(
  sessionId: string
): Promise<PendingAnnotationsResponse> {
  return DEFAULT_CLIENT.getPendingAnnotations(sessionId);
}

/**
 * Get all pending annotations across ALL sessions
 *
 * @returns Object with total count and annotations array
 *
 * @example
 * const allPending = await agentation_get_all_pending();
 * console.log(`Found ${allPending.count} pending annotations across all sessions`);
 */
export async function agentation_get_all_pending(): Promise<PendingAnnotationsResponse> {
  return DEFAULT_CLIENT.getAllPendingAnnotations();
}

// ============================================================================
// Action Tools
// ============================================================================

/**
 * Mark an annotation as acknowledged
 *
 * Use this to let the user know you've seen their feedback and will address it.
 *
 * @param annotationId - Annotation ID to acknowledge
 * @returns Acknowledgment confirmation
 *
 * @example
 * await agentation_acknowledge("ann_123");
 * console.log("Annotation acknowledged");
 */
export async function agentation_acknowledge(
  annotationId: string
): Promise<AcknowledgeResponse> {
  return DEFAULT_CLIENT.acknowledgeAnnotation(annotationId);
}

/**
 * Mark an annotation as resolved
 *
 * Use this after you've addressed the feedback. Optionally include a summary.
 *
 * @param annotationId - Annotation ID to resolve
 * @param summary - Optional summary of what you did
 * @returns Resolution confirmation
 *
 * @example
 * await agentation_resolve("ann_123", "Fixed padding issue - increased from 8px to 16px");
 * console.log("Annotation resolved");
 */
export async function agentation_resolve(
  annotationId: string,
  summary?: string
): Promise<ResolveResponse> {
  return DEFAULT_CLIENT.resolveAnnotation(annotationId, summary);
}

/**
 * Dismiss an annotation
 *
 * Use when you've decided not to address the feedback, with a reason why.
 *
 * @param annotationId - Annotation ID to dismiss
 * @param reason - Reason for dismissal
 * @returns Dismissal confirmation
 *
 * @example
 * await agentation_dismiss("ann_123", "This is intentional design");
 * console.log("Annotation dismissed");
 */
export async function agentation_dismiss(
  annotationId: string,
  reason: string
): Promise<DismissResponse> {
  return DEFAULT_CLIENT.dismissAnnotation(annotationId, reason);
}

/**
 * Add a reply to an annotation's thread
 *
 * Use to ask clarifying questions or provide updates to the user.
 *
 * @param annotationId - Annotation ID to reply to
 * @param message - Your message
 * @returns Reply confirmation
 *
 * @example
 * await agentation_reply("ann_123", "Should this be 24px or 16px?");
 * console.log("Reply sent");
 */
export async function agentation_reply(
  annotationId: string,
  message: string
): Promise<ReplyResponse> {
  return DEFAULT_CLIENT.replyToAnnotation(annotationId, message);
}

// ============================================================================
// Watch Mode
// ============================================================================

/**
 * Watch for new annotations (blocks until annotations appear)
 *
 * Use in a loop for hands-free feedback processing. Triggers automatically
 * when annotations are created — the user just annotates in the browser
 * and the agent picks them up.
 *
 * @param options - Watch options
 * @returns Batch of new annotations
 *
 * @example
 * // Hands-free mode
 * while (true) {
 *   const batch = await agentation_watch_annotations({
 *     batchWindowSeconds: 10,
 *     timeoutSeconds: 120
 *   });
 *
 *   for (const annotation of batch.annotations) {
 *     await agentation_acknowledge(annotation.id);
 *     await coderAgent.fixIssue(annotation);
 *     await agentation_resolve(annotation.id, "Issue fixed");
 *   }
 * }
 */
export async function agentation_watch_annotations(
  options?: WatchAnnotationsOptions
): Promise<WatchAnnotationsResponse> {
  return DEFAULT_CLIENT.watchAnnotations(options);
}

// ============================================================================
// Health & Status
// ============================================================================

/**
 * Check if the Agentation server is running
 *
 * @returns Health status
 *
 * @example
 * const health = await agentation_health();
 * if (health.status === "ok") {
 *   console.log("Agentation server is running");
 * }
 */
export async function agentation_health(): Promise<{ status: string; mode: string }> {
  return DEFAULT_CLIENT.health();
}

/**
 * Get server status
 *
 * @returns Server status with uptime and version
 *
 * @example
 * const status = await agentation_status();
 * console.log(`Server uptime: ${status.uptime}s`);
 */
export async function agentation_status(): Promise<{
  status: string;
  uptime: number;
  version: string;
  port: number;
}> {
  return DEFAULT_CLIENT.status();
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Process all pending annotations
 *
 * Convenience function to process all pending annotations with a handler
 *
 * @param handler - Function to process each annotation
 * @returns Number of annotations processed
 *
 * @example
 * const processed = await agentation_process_all_pending(async (annotation) => {
 *   await agentation_acknowledge(annotation.id);
 *   await coderAgent.fixIssue(annotation);
 *   await agentation_resolve(annotation.id, "Fixed");
 * });
 * console.log(`Processed ${processed} annotations`);
 */
export async function agentation_process_all_pending(
  handler: (annotation: Annotation) => Promise<void>
): Promise<number> {
  const pending = await agentation_get_all_pending();
  let processed = 0;

  for (const annotation of pending.annotations) {
    try {
      await handler(annotation);
      processed++;
    } catch (error) {
      console.error(`Failed to process annotation ${annotation.id}:`, error);
    }
  }

  return processed;
}

/**
 * Get annotations by severity
 *
 * Filter pending annotations by severity level
 *
 * @param severity - Severity level to filter by
 * @returns Annotations with specified severity
 *
 * @example
 * const blocking = await agentation_get_by_severity("blocking");
 * console.log(`Found ${blocking.length} blocking issues`);
 */
export async function agentation_get_by_severity(
  severity: "blocking" | "important" | "suggestion"
): Promise<Annotation[]> {
  const pending = await agentation_get_all_pending();
  return pending.annotations.filter((a) => a.severity === severity);
}

/**
 * Get annotations by intent
 *
 * Filter pending annotations by intent type
 *
 * @param intent - Intent type to filter by
 * @returns Annotations with specified intent
 *
 * @example
 * const fixes = await agentation_get_by_intent("fix");
 * console.log(`Found ${fixes.length} fix requests`);
 */
export async function agentation_get_by_intent(
  intent: "fix" | "change" | "question" | "approve"
): Promise<Annotation[]> {
  const pending = await agentation_get_all_pending();
  return pending.annotations.filter((a) => a.intent === intent);
}

/**
 * Get annotations by page URL
 *
 * Filter pending annotations by page URL
 *
 * @param url - Page URL to filter by
 * @returns Annotations for specified page
 *
 * @example
 * const pageAnnotations = await agentation_get_by_url("http://localhost:3000/dashboard");
 * console.log(`Found ${pageAnnotations.length} annotations on dashboard`);
 */
export async function agentation_get_by_url(url: string): Promise<Annotation[]> {
  const pending = await agentation_get_all_pending();
  return pending.annotations.filter((a) => a.url === url);
}

/**
 * Sort annotations by priority
 *
 * Sort annotations by severity (blocking > important > suggestion)
 *
 * @param annotations - Annotations to sort
 * @returns Sorted annotations
 *
 * @example
 * const pending = await agentation_get_all_pending();
 * const sorted = agentation_sort_by_priority(pending.annotations);
 * // Process blocking issues first
 */
export function agentation_sort_by_priority(
  annotations: Annotation[]
): Annotation[] {
  const severityOrder = { blocking: 0, important: 1, suggestion: 2 };

  return [...annotations].sort((a, b) => {
    const orderA = severityOrder[a.severity || "suggestion"];
    const orderB = severityOrder[b.severity || "suggestion"];
    return orderA - orderB;
  });
}

/**
 * Group annotations by component
 *
 * Group annotations by React component name
 *
 * @param annotations - Annotations to group
 * @returns Object mapping component names to annotations
 *
 * @example
 * const pending = await agentation_get_all_pending();
 * const grouped = agentation_group_by_component(pending.annotations);
 * for (const [component, anns] of Object.entries(grouped)) {
 *   console.log(`${component}: ${anns.length} annotations`);
 * }
 */
export function agentation_group_by_component(
  annotations: Annotation[]
): Record<string, Annotation[]> {
  const grouped: Record<string, Annotation[]> = {};

  for (const annotation of annotations) {
    if (annotation.reactComponents) {
      const components = annotation.reactComponents.split(" > ");
      const component = components[components.length - 1] || "unknown";

      if (!grouped[component]) {
        grouped[component] = [];
      }
      grouped[component].push(annotation);
    }
  }

  return grouped;
}

// ============================================================================
// Export All Tools
// ============================================================================

export const agentationTools = {
  // Query tools
  agentation_list_sessions,
  agentation_get_session,
  agentation_get_pending,
  agentation_get_all_pending,

  // Action tools
  agentation_acknowledge,
  agentation_resolve,
  agentation_dismiss,
  agentation_reply,

  // Watch mode
  agentation_watch_annotations,

  // Health & status
  agentation_health,
  agentation_status,

  // Utility functions
  agentation_process_all_pending,
  agentation_get_by_severity,
  agentation_get_by_intent,
  agentation_get_by_url,
  agentation_sort_by_priority,
  agentation_group_by_component,
};

// ============================================================================
// Default Export
// ============================================================================

export default agentationTools;
