/**
 * Agentation HTTP Client
 *
 * Provides methods to interact with the Agentation MCP server HTTP API
 * Server runs on localhost:4747 by default
 */

import type {
  Annotation,
  Session,
  SessionWithAnnotations,
  PendingAnnotationsResponse,
  SessionsListResponse,
  SessionsArrayResponse,
  AcknowledgeResponse,
  ResolveResponse,
  DismissResponse,
  ReplyResponse,
  WatchAnnotationsResponse,
  HealthResponse,
  ServerStatusResponse,
  WatchAnnotationsOptions,
  CreateAnnotationOptions,
} from "./types.js";

import {
  AgentationError,
  ConnectionError,
  TimeoutError,
  NotFoundError,
  ValidationError,
} from "./types.js";

// ============================================================================
// Configuration
// ============================================================================

const DEFAULT_BASE_URL = "http://localhost:4747";
const DEFAULT_TIMEOUT = 30000; // 30 seconds

// ============================================================================
// Agentation Client Class
// ============================================================================

export class AgentationClient {
  private baseUrl: string;
  private timeout: number;
  private headers: Record<string, string>;

  constructor(
    baseUrl: string = DEFAULT_BASE_URL,
    options: { timeout?: number; headers?: Record<string, string> } = {}
  ) {
    this.baseUrl = baseUrl.replace(/\/$/, ""); // Remove trailing slash
    this.timeout = options.timeout || DEFAULT_TIMEOUT;
    this.headers = {
      "Content-Type": "application/json",
      ...options.headers,
    };
  }

  // ============================================================================
  // Health & Status
  // ============================================================================

  /**
   * Check if the Agentation server is running
   */
  async health(): Promise<HealthResponse> {
    return this.get<HealthResponse>("/health");
  }

  /**
   * Get server status
   */
  async status(): Promise<ServerStatusResponse> {
    return this.get<ServerStatusResponse>("/status");
  }

  // ============================================================================
  // Sessions
  // ============================================================================

  /**
   * List all sessions
   */
  async listSessions(): Promise<SessionsListResponse> {
    const response = await this.get<Session[] | SessionsListResponse>("/sessions");

    // Handle both array and object response formats
    if (Array.isArray(response)) {
      return {
        sessions: response,
        total: response.length,
      };
    }
    return response;
  }

  /**
   * Get a specific session with all annotations
   */
  async getSession(sessionId: string): Promise<SessionWithAnnotations> {
    return this.get<SessionWithAnnotations>(`/sessions/${sessionId}`);
  }

  /**
   * Create a new session
   */
  async createSession(url: string): Promise<Session> {
    return this.post<Session>("/sessions", { url });
  }

  // ============================================================================
  // Annotations - Query
  // ============================================================================

  /**
   * Get pending annotations for a specific session
   */
  async getPendingAnnotations(sessionId: string): Promise<PendingAnnotationsResponse> {
    return this.get<PendingAnnotationsResponse>(`/sessions/${sessionId}/pending`);
  }

  /**
   * Get all pending annotations across all sessions
   */
  async getAllPendingAnnotations(): Promise<PendingAnnotationsResponse> {
    return this.get<PendingAnnotationsResponse>("/pending");
  }

  /**
   * Get a specific annotation
   */
  async getAnnotation(annotationId: string): Promise<Annotation> {
    return this.get<Annotation>(`/annotations/${annotationId}`);
  }

  // ============================================================================
  // Annotations - Actions
  // ============================================================================

  /**
   * Create a new annotation
   */
  async createAnnotation(options: CreateAnnotationOptions): Promise<Annotation> {
    const annotation: Partial<Annotation> = {
      id: this.generateId(),
      timestamp: Date.now(),
      ...options,
    };

    // Determine session from URL
    const sessions = await this.listSessions();
    let session = sessions.sessions.find((s) => s.url === options.url);

    if (!session) {
      session = await this.createSession(options.url || "unknown");
    }

    return this.post<Annotation>(`/sessions/${session.id}/annotations`, annotation);
  }

  /**
   * Acknowledge an annotation
   */
  async acknowledgeAnnotation(annotationId: string): Promise<AcknowledgeResponse> {
    return this.patch<AcknowledgeResponse>(`/annotations/${annotationId}`, {
      status: "acknowledged",
    });
  }

  /**
   * Resolve an annotation
   */
  async resolveAnnotation(
    annotationId: string,
    summary?: string
  ): Promise<ResolveResponse> {
    // Note: The server currently doesn't persist summary, but status change works
    return this.patch<ResolveResponse>(`/annotations/${annotationId}`, {
      status: "resolved",
    });
  }

  /**
   * Dismiss an annotation
   */
  async dismissAnnotation(annotationId: string, reason: string): Promise<DismissResponse> {
    // Note: The server currently doesn't persist reason, but status change works
    return this.patch<DismissResponse>(`/annotations/${annotationId}`, {
      status: "dismissed",
    });
  }

  /**
   * Reply to an annotation
   */
  async replyToAnnotation(annotationId: string, message: string): Promise<ReplyResponse> {
    return this.post<ReplyResponse>(`/annotations/${annotationId}/thread`, {
      role: "agent",
      content: message,
    });
  }

  /**
   * Delete an annotation
   */
  async deleteAnnotation(annotationId: string): Promise<void> {
    return this.delete<void>(`/annotations/${annotationId}`);
  }

  // ============================================================================
  // Watch Mode
  // ============================================================================

  /**
   * Watch for new annotations using SSE
   */
  async watchAnnotations(
    options?: WatchAnnotationsOptions
  ): Promise<WatchAnnotationsResponse> {
    const params = new URLSearchParams();

    if (options?.sessionId) {
      params.set("sessionId", options.sessionId);
    }

    const queryString = params.toString();
    const url = `${this.baseUrl}/events${queryString ? `?${queryString}` : ""}`;

    const timeout = (options?.timeoutSeconds || 120) * 1000;
    const batchWindow = (options?.batchWindowSeconds || 10) * 1000;

    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        eventSource.close();
        resolve({
          annotations: [],
          count: 0,
          sessionId: options?.sessionId,
          timestamp: new Date().toISOString(),
        });
      }, timeout);

      const annotations: Annotation[] = [];
      let batchTimeoutId: NodeJS.Timeout | null = null;

      const eventSource = new EventSource(url);

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          // Handle different event types
          if (data.type === "annotation.created" || data.type === "annotation.updated") {
            const annotation = data.payload as Annotation;
            // Only add pending annotations
            if (annotation.status === "pending") {
              annotations.push(annotation);
            }
          }

          // Clear and restart batch timer on each event
          if (batchTimeoutId) {
            clearTimeout(batchTimeoutId);
          }

          batchTimeoutId = setTimeout(() => {
            eventSource.close();
            clearTimeout(timeoutId);

            // Get fresh pending annotations
            this.getAllPendingAnnotations().then((pending) => {
              resolve({
                annotations: pending.annotations,
                count: pending.count,
                sessionId: options?.sessionId,
                timestamp: new Date().toISOString(),
              });
            });
          }, batchWindow);
        } catch (error) {
          console.error("Error parsing SSE event:", error);
        }
      };

      eventSource.onerror = (error) => {
        clearTimeout(timeoutId);
        if (batchTimeoutId) {
          clearTimeout(batchTimeoutId);
        }
        eventSource.close();

        // If timeout, return empty
        if (annotations.length === 0) {
          resolve({
            annotations: [],
            count: 0,
            sessionId: options?.sessionId,
            timestamp: new Date().toISOString(),
          });
        } else {
          resolve({
            annotations,
            count: annotations.length,
            sessionId: options?.sessionId,
            timestamp: new Date().toISOString(),
          });
        }
      };
    });
  }

  // ============================================================================
  // Real-Time Events (SSE)
  // ============================================================================

  /**
   * Subscribe to session-level events
   */
  subscribeToSessionEvents(
    sessionId: string,
    callback: (event: any) => void,
    onError?: (error: Error) => void
  ): EventSource {
    const eventSource = new EventSource(`${this.baseUrl}/sessions/${sessionId}/events`);

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        callback(data);
      } catch (error) {
        onError?.(error as Error);
      }
    };

    eventSource.onerror = (error) => {
      onError?.(new Error("EventSource connection error"));
    };

    return eventSource;
  }

  /**
   * Subscribe to global events
   */
  subscribeToGlobalEvents(
    callback: (event: any) => void,
    options?: { domain?: string },
    onError?: (error: Error) => void
  ): EventSource {
    const params = new URLSearchParams();
    if (options?.domain) {
      params.set("domain", options.domain);
    }

    const queryString = params.toString();
    const url = `${this.baseUrl}/events${queryString ? `?${queryString}` : ""}`;

    const eventSource = new EventSource(url);

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        callback(data);
      } catch (error) {
        onError?.(error as Error);
      }
    };

    eventSource.onerror = (error) => {
      onError?.(new Error("EventSource connection error"));
    };

    return eventSource;
  }

  // ============================================================================
  // Statistics
  // ============================================================================

  /**
   * Get annotation statistics
   */
  async getStatistics(): Promise<{
    totalAnnotations: number;
    totalSessions: number;
    byStatus: Record<string, number>;
    bySeverity: Record<string, number>;
  }> {
    const sessions = await this.listSessions();
    const allPending = await this.getAllPendingAnnotations();

    const stats = {
      totalAnnotations: 0,
      totalSessions: sessions.total,
      byStatus: {} as Record<string, number>,
      bySeverity: {} as Record<string, number>,
    };

    // Count pending annotations
    stats.totalAnnotations += allPending.count;

    // Count by severity
    for (const annotation of allPending.annotations) {
      if (annotation.severity) {
        stats.bySeverity[annotation.severity] =
          (stats.bySeverity[annotation.severity] || 0) + 1;
      }
    }

    return stats;
  }

  // ============================================================================
  // HTTP Helper Methods
  // ============================================================================

  private async get<T>(path: string): Promise<T> {
    return this.request<T>("GET", path);
  }

  private async post<T>(path: string, body?: any): Promise<T> {
    return this.request<T>("POST", path, body);
  }

  private async delete<T>(path: string): Promise<T> {
    return this.request<T>("DELETE", path);
  }

  private async put<T>(path: string, body?: any): Promise<T> {
    return this.request<T>("PUT", path, body);
  }

  private async patch<T>(path: string, body?: any): Promise<T> {
    return this.request<T>("PATCH", path, body);
  }

  private async request<T>(
    method: string,
    path: string,
    body?: any
  ): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        method,
        headers: this.headers,
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        await this.handleError(response);
      }

      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof Error) {
        if (error.name === "AbortError") {
          throw new TimeoutError(`Request timeout after ${this.timeout}ms`);
        }
        if (error instanceof TypeError) {
          throw new ConnectionError(`Failed to connect to ${this.baseUrl}`);
        }
      }

      throw error;
    }
  }

  private async handleError(response: Response): Promise<never> {
    let errorData: any;
    try {
      errorData = await response.json();
    } catch {
      errorData = { message: response.statusText };
    }

    switch (response.status) {
      case 400:
        throw new ValidationError(
          errorData.message || "Validation error",
          errorData.errors
        );
      case 404:
        throw new NotFoundError(errorData.message || "Resource not found");
      case 408:
        throw new TimeoutError(errorData.message || "Request timeout");
      default:
        throw new AgentationError(
          errorData.message || `HTTP ${response.status}: ${response.statusText}`,
          response.status,
          errorData
        );
    }
  }

  // ============================================================================
  // Utility Methods
  // ============================================================================

  /**
   * Generate a unique ID
   */
  private generateId(): string {
    return `ann_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Set custom headers
   */
  setHeaders(headers: Record<string, string>): void {
    this.headers = { ...this.headers, ...headers };
  }

  /**
   * Set timeout
   */
  setTimeout(timeout: number): void {
    this.timeout = timeout;
  }

  /**
   * Get base URL
   */
  getBaseUrl(): string {
    return this.baseUrl;
  }
}

// ============================================================================
// Default Client Instance
// ============================================================================

/**
 * Default Agentation client instance
 */
export const defaultClient = new AgentationClient();

// ============================================================================
// Convenience Functions
// ============================================================================

/**
 * Quick health check
 */
export async function checkHealth(): Promise<boolean> {
  try {
    const health = await defaultClient.health();
    return health.status === "ok";
  } catch {
    return false;
  }
}

/**
 * Get all pending annotations (convenience function)
 */
export async function getPendingAnnotations(): Promise<PendingAnnotationsResponse> {
  return defaultClient.getAllPendingAnnotations();
}

/**
 * Watch for annotations (convenience function)
 */
export async function watchAnnotations(
  options?: WatchAnnotationsOptions
): Promise<WatchAnnotationsResponse> {
  return defaultClient.watchAnnotations(options);
}

/**
 * Acknowledge annotation (convenience function)
 */
export async function acknowledgeAnnotation(annotationId: string): Promise<AcknowledgeResponse> {
  return defaultClient.acknowledgeAnnotation(annotationId);
}

/**
 * Resolve annotation (convenience function)
 */
export async function resolveAnnotation(
  annotationId: string,
  summary?: string
): Promise<ResolveResponse> {
  return defaultClient.resolveAnnotation(annotationId, summary);
}

/**
 * Dismiss annotation (convenience function)
 */
export async function dismissAnnotation(
  annotationId: string,
  reason: string
): Promise<DismissResponse> {
  return defaultClient.dismissAnnotation(annotationId, reason);
}

/**
 * Reply to annotation (convenience function)
 */
export async function replyToAnnotation(
  annotationId: string,
  message: string
): Promise<ReplyResponse> {
  return defaultClient.replyToAnnotation(annotationId, message);
}
