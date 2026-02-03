import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createAuditLog, getClientIp, getUserAgent } from "./audit-service";

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
type RouteHandler<TParams = Record<string, never>> = (
  req: NextRequest,
  context: { params: Promise<TParams> }
) => Promise<NextResponse> | NextResponse;

interface AuditConfig {
  /**
   * If true, automatically logs based on HTTP method and path
   * GET = READ, POST = CREATE, PUT/PATCH = UPDATE, DELETE = DELETE
   */
  auto?: boolean;

  /**
   * Custom action override (if you don't want auto-detection)
   */
  action?: string;

  /**
   * Entity type (e.g., "task", "user", "company")
   * Will be auto-detected from path if not provided
   */
  entityType?: string;

  /**
   * Function to extract entity ID from the request
   */
  getEntityId?: (req: NextRequest, params?: Record<string, string>) => string | undefined;

  /**
   * Skip logging for certain conditions
   */
  skip?: (req: NextRequest) => boolean;

  /**
   * Extract additional metadata
   */
  getMetadata?: (req: NextRequest, response: NextResponse) => Record<string, unknown>;
}

/**
 * Higher-order function to wrap API routes with automatic audit logging
 *
 * @example
 * export const POST = withAuditLog(
 *   async (req) => {
 *     // Your route logic
 *     return NextResponse.json({ success: true });
 *   },
 *   { auto: true, entityType: "task" }
 * );
 */
export function withAuditLog<TParams = Record<string, never>>(
  handler: RouteHandler<TParams>,
  config: AuditConfig = { auto: true }
): RouteHandler<TParams> {
  return async (req: NextRequest, context: { params: Promise<TParams> }) => {
    // Check if we should skip logging
    if (config.skip?.(req)) {
      return handler(req, context);
    }

    const session = await auth();
    const startTime = Date.now();
    const method = req.method as HttpMethod;

    // Execute the route handler
    const response = await handler(req, context);

    // Only log if we have a user (skip for unauthenticated requests)
    if (!session?.user?.email) {
      return response;
    }
    let action = config.action;

    if (config.auto && !action) {
      const actionMap: Record<HttpMethod, string> = {
        GET: "READ",
        POST: "CREATE",
        PUT: "UPDATE",
        PATCH: "UPDATE",
        DELETE: "DELETE",
      };
      action = actionMap[method] || method;
    }

    // Extract entity type from path if not provided
    let entityType = config.entityType;
    if (!entityType) {
      const pathMatch = req.nextUrl.pathname.match(/\/api\/([^/]+)/);
      entityType = pathMatch?.[1] || "unknown";

      // Singularize common plural forms
      entityType = entityType.replace(/s$/, "");
    }

    // Get entity ID
    let entityId: string | undefined;
    if (config.getEntityId) {
      const params = await context.params;
      entityId = config.getEntityId(req, params as Record<string, string>);
    } else {
      // Try to extract ID from params
      const params = await context.params;
      entityId = (params as Record<string, string>)?.id;

      // Or from query params
      if (!entityId) {
        entityId = req.nextUrl.searchParams.get("id") || undefined;
      }
    }

    // Determine status
    const status = response.status >= 200 && response.status < 300
      ? "success"
      : response.status >= 400 && response.status < 500
      ? "failed"
      : "error";

    // Get additional metadata
    const metadata = config.getMetadata?.(req, response) || {};

    // Log the action (fire and forget - don't block the response)
    createAuditLog({
      action: action || method,
      entityType: entityType || "unknown",
      entityId,
      userId: session.user.id,
      userEmail: session.user.email,
      userIp: getClientIp(req.headers),
      userAgent: getUserAgent(req.headers),
      metadata: {
        ...metadata,
        path: req.nextUrl.pathname,
        method,
        responseStatus: response.status,
        durationMs: Date.now() - startTime,
      },
      status,
      errorMessage: status !== "success" ? `HTTP ${response.status}` : undefined,
    }).catch((error) => {
      // Don't throw - audit logging should never break the app
      console.error("Audit logging failed:", error);
    });

    return response;
  };
}

/**
 * Convenience wrapper specifically for operations that need detailed change tracking
 * Use this for UPDATE/DELETE operations where you want to log before/after states
 */
export function withDetailedAuditLog<TParams = Record<string, never>>(
  handler: RouteHandler<TParams>,
  config: AuditConfig & {
    /**
     * Function to get the entity state before the operation
     */
    getBeforeState?: (req: NextRequest, params?: TParams) => Promise<unknown>;

    /**
     * Function to get the entity state after the operation
     */
    getAfterState?: (response: NextResponse) => Promise<unknown>;
  }
): RouteHandler<TParams> {
  return async (req: NextRequest, context: { params: Promise<TParams> }) => {
    const session = await auth();
    const params = await context.params;

    // Get before state if needed
    let beforeState: unknown;
    if (config.getBeforeState && session?.user?.email) {
      beforeState = await config.getBeforeState(req, params);
    }

    // Execute the route handler
    const response = await handler(req, context);

    // Only log if we have a user
    if (!session?.user?.email) {
      return response;
    }

    // Get after state if needed
    let afterState: unknown;
    if (config.getAfterState && response.status >= 200 && response.status < 300) {
      afterState = await config.getAfterState(response);
    }

    // Use the base audit log wrapper but include changes
    const method = req.method as HttpMethod;
    let action = config.action;

    if (config.auto && !action) {
      const actionMap: Record<HttpMethod, string> = {
        GET: "READ",
        POST: "CREATE",
        PUT: "UPDATE",
        PATCH: "UPDATE",
        DELETE: "DELETE",
      };
      action = actionMap[method] || method;
    }

    let entityType = config.entityType;
    if (!entityType) {
      const pathMatch = req.nextUrl.pathname.match(/\/api\/([^/]+)/);
      entityType = pathMatch?.[1] || "unknown";
      entityType = entityType.replace(/s$/, "");
    }

    let entityId: string | undefined;
    if (config.getEntityId) {
      entityId = config.getEntityId(req, params as Record<string, string>);
    } else {
      entityId = (params as Record<string, string>)?.id;
      if (!entityId) {
        entityId = req.nextUrl.searchParams.get("id") || undefined;
      }
    }

    const status = response.status >= 200 && response.status < 300
      ? "success"
      : response.status >= 400 && response.status < 500
      ? "failed"
      : "error";

    const metadata = config.getMetadata?.(req, response) || {};

    createAuditLog({
      action: action || method,
      entityType: entityType || "unknown",
      entityId,
      userId: session.user.id,
      userEmail: session.user.email,
      userIp: getClientIp(req.headers),
      userAgent: getUserAgent(req.headers),
      changes: beforeState || afterState ? {
        before: beforeState,
        after: afterState,
      } : undefined,
      metadata: {
        ...metadata,
        path: req.nextUrl.pathname,
        method,
        responseStatus: response.status,
      },
      status,
      errorMessage: status !== "success" ? `HTTP ${response.status}` : undefined,
    }).catch((error) => {
      console.error("Audit logging failed:", error);
    });

    return response;
  };
}
