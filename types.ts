/**
 * Agentation Integration - TypeScript Type Definitions
 *
 * Based on Agentation Format Schema v1.0
 * https://www.agentation.com/schema
 */

// ============================================================================
// Core Types
// ============================================================================

/**
 * Annotation intent - what the user wants to do
 */
export type AnnotationIntent = "fix" | "change" | "question" | "approve";

/**
 * Annotation severity - how important the issue is
 */
export type AnnotationSeverity = "blocking" | "important" | "suggestion";

/**
 * Annotation status - lifecycle state
 */
export type AnnotationStatus = "pending" | "acknowledged" | "resolved" | "dismissed";

/**
 * Session status
 */
export type SessionStatus = "active" | "approved" | "closed";

/**
 * Who resolved the annotation
 */
export type ResolvedBy = "human" | "agent";

// ============================================================================
// Annotation Types
// ============================================================================

/**
 * Thread message in annotation conversation
 */
export interface ThreadMessage {
  id: string;
  role: "human" | "agent";
  content: string;
  timestamp: number;
}

/**
 * Element bounding box
 */
export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Main Annotation object
 */
export interface Annotation {
  // Required fields
  id: string;
  comment: string;
  elementPath: string;
  timestamp: number;
  x: number; // % of viewport width (0-100)
  y: number; // px from document top
  element: string; // Tag name

  // Recommended fields
  url?: string;
  boundingBox?: BoundingBox;

  // Optional context
  reactComponents?: string; // Component tree
  cssClasses?: string;
  computedStyles?: string;
  accessibility?: string;
  nearbyText?: string;
  selectedText?: string;

  // Browser component fields
  isFixed?: boolean;
  isMultiSelect?: boolean;
  fullPath?: string;
  nearbyElements?: string;

  // Feedback classification
  intent?: AnnotationIntent;
  severity?: AnnotationSeverity;

  // Lifecycle
  status?: AnnotationStatus;
  resolvedAt?: string;
  resolvedBy?: ResolvedBy;
  resolvedSummary?: string;
  dismissReason?: string;
  thread?: ThreadMessage[];
}

// ============================================================================
// Session Types
// ============================================================================

/**
 * Session object
 */
export interface Session {
  id: string;
  url: string;
  status: SessionStatus;
  createdAt: string;
  updatedAt: string;
  annotationCount?: number;
}

/**
 * Session with annotations
 */
export interface SessionWithAnnotations extends Session {
  annotations: Annotation[];
}

// ============================================================================
// Response Types
// ============================================================================

/**
 * Pending annotations response
 */
export interface PendingAnnotationsResponse {
  count: number;
  annotations: Annotation[];
}

/**
 * Sessions list response
 */
export interface SessionsListResponse {
  sessions: Session[];
  total: number;
}

/**
 * Sessions list (raw array response)
 */
export type SessionsArrayResponse = Session[];

/**
 * Acknowledge response
 */
export interface AcknowledgeResponse {
  status: "acknowledged";
  annotationId: string;
  timestamp: string;
}

/**
 * Resolve response
 */
export interface ResolveResponse {
  status: "resolved";
  annotationId: string;
  summary?: string;
  timestamp: string;
}

/**
 * Dismiss response
 */
export interface DismissResponse {
  status: "dismissed";
  annotationId: string;
  reason: string;
  timestamp: string;
}

/**
 * Reply response
 */
export interface ReplyResponse {
  status: "replied";
  annotationId: string;
  message: string;
  timestamp: string;
}

/**
 * Watch annotations response
 */
export interface WatchAnnotationsResponse {
  annotations: Annotation[];
  count: number;
  sessionId?: string;
  timestamp: string;
}

/**
 * Health check response
 */
export interface HealthResponse {
  status: "ok" | "error";
  mode: "local" | "remote";
  version?: string;
}

/**
 * Server status response
 */
export interface ServerStatusResponse {
  status?: "running" | "stopped";
  uptime?: number;
  version?: string;
  port?: number;
  mode: "local" | "remote";
  webhooksConfigured: boolean;
  webhookCount: number;
  activeListeners: number;
  agentListeners: number;
}

// ============================================================================
// Event Types (SSE)
// ============================================================================

/**
 * Event types for Server-Sent Events
 */
export type AFSEventType =
  | "annotation.created"
  | "annotation.updated"
  | "annotation.deleted"
  | "session.created"
  | "session.updated"
  | "session.closed"
  | "thread.message"
  | "action.requested";

/**
 * Agentation event envelope
 */
export interface AgentationEvent {
  type: AFSEventType;
  timestamp: string; // ISO 8601
  sessionId: string;
  sequence: number; // Monotonic for ordering/replay
  payload: Annotation | Session | ThreadMessage | ActionRequest;
}

/**
 * Action request from agent
 */
export interface ActionRequest {
  id: string;
  type: "fix" | "change" | "question";
  annotationId: string;
  agent: string;
  timestamp: number;
}

// ============================================================================
// Watch Options
// ============================================================================

/**
 * Options for watching annotations
 */
export interface WatchAnnotationsOptions {
  sessionId?: string;
  batchWindowSeconds?: number; // default: 10, max: 60
  timeoutSeconds?: number; // default: 120, max: 300
}

// ============================================================================
// Create Annotation Options
// ============================================================================

/**
 * Options for creating an annotation
 */
export interface CreateAnnotationOptions {
  comment: string;
  elementPath: string;
  element: string;
  x: number;
  y: number;
  url?: string;
  boundingBox?: BoundingBox;
  reactComponents?: string;
  cssClasses?: string;
  computedStyles?: string;
  accessibility?: string;
  nearbyText?: string;
  selectedText?: string;
  intent?: AnnotationIntent;
  severity?: AnnotationSeverity;
}

// ============================================================================
// Error Types
// ============================================================================

/**
 * Agentation API error
 */
export class AgentationError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public details?: any
  ) {
    super(message);
    this.name = "AgentationError";
  }
}

/**
 * Connection error
 */
export class ConnectionError extends AgentationError {
  constructor(message: string) {
    super(message, 0);
    this.name = "ConnectionError";
  }
}

/**
 * Timeout error
 */
export class TimeoutError extends AgentationError {
  constructor(message: string) {
    super(message, 408);
    this.name = "TimeoutError";
  }
}

/**
 * Not found error
 */
export class NotFoundError extends AgentationError {
  constructor(message: string) {
    super(message, 404);
    this.name = "NotFoundError";
  }
}

/**
 * Validation error
 */
export class ValidationError extends AgentationError {
  constructor(message: string, public validationErrors?: any[]) {
    super(message, 400);
    this.name = "ValidationError";
  }
}

// ============================================================================
// Utility Types
// ============================================================================

/**
 * Partial annotation with required fields
 */
export type PartialAnnotation = Pick<
  Annotation,
  "id" | "comment" | "elementPath" | "timestamp" | "x" | "y" | "element"
>;

/**
 * Annotation with context
 */
export type AnnotationWithContext = Annotation & {
  sessionId: string;
  createdAt: string;
  updatedAt: string;
};

/**
 * Annotation statistics
 */
export interface AnnotationStatistics {
  total: number;
  byStatus: Record<AnnotationStatus, number>;
  bySeverity: Record<AnnotationSeverity, number>;
  byIntent: Record<AnnotationIntent, number>;
  byPage: Record<string, number>;
  averageResolutionTime?: number;
}

/**
 * Session statistics
 */
export interface SessionStatistics {
  totalSessions: number;
  activeSessions: number;
  totalAnnotations: number;
  averageAnnotationsPerSession: number;
  mostAnnotatedPages: Array<{ url: string; count: number }>;
}

// ============================================================================
// Export All
// ============================================================================

// All types are already exported above with their declarations
