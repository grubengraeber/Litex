import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import {
  createAuditLog,
  AuditAction,
  EntityType,
  getClientIp,
  getUserAgent,
} from "./audit-service";

/**
 * Middleware to automatically log API actions
 * Use this in API routes to track important operations
 */
export async function auditLog(
  req: NextRequest,
  action: AuditAction | string,
  entityType: EntityType | string,
  options?: {
    entityId?: string;
    changes?: { before?: unknown; after?: unknown };
    metadata?: Record<string, unknown>;
    status?: "success" | "failed" | "error";
    errorMessage?: string;
  }
): Promise<void> {
  try {
    const session = await auth();

    // If no session, use email from request if available (for login attempts)
    const userEmail =
      session?.user?.email || options?.metadata?.email as string || "anonymous";
    const userId = session?.user?.id;

    const userIp = getClientIp(req.headers);
    const userAgent = getUserAgent(req.headers);

    await createAuditLog({
      action,
      entityType,
      entityId: options?.entityId,
      userId,
      userEmail,
      userIp,
      userAgent,
      changes: options?.changes,
      metadata: {
        ...options?.metadata,
        path: req.nextUrl.pathname,
        method: req.method,
      },
      status: options?.status,
      errorMessage: options?.errorMessage,
    });
  } catch (error) {
    // Don't throw - audit logging should never break the app
    console.error("Audit middleware error:", error);
  }
}

/**
 * Helper to create audit log for authentication events
 */
export async function auditAuth(
  req: NextRequest,
  action: "LOGIN" | "LOGOUT" | "LOGIN_FAILED",
  email: string,
  options?: {
    metadata?: Record<string, unknown>;
    status?: "success" | "failed" | "error";
    errorMessage?: string;
  }
): Promise<void> {
  const userIp = getClientIp(req.headers);
  const userAgent = getUserAgent(req.headers);

  await createAuditLog({
    action,
    entityType: EntityType.USER,
    userEmail: email,
    userIp,
    userAgent,
    metadata: {
      ...options?.metadata,
      path: req.nextUrl.pathname,
    },
    status: options?.status,
    errorMessage: options?.errorMessage,
  });
}
