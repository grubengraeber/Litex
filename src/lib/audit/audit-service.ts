import { db } from "@/db";
import { auditLogs } from "@/db/schema";

export enum AuditAction {
  // Auth
  LOGIN = "LOGIN",
  LOGOUT = "LOGOUT",
  LOGIN_FAILED = "LOGIN_FAILED",

  // CRUD
  CREATE = "CREATE",
  READ = "READ",
  UPDATE = "UPDATE",
  DELETE = "DELETE",

  // Special actions
  APPROVE = "APPROVE",
  REJECT = "REJECT",
  SUBMIT = "SUBMIT",
  ASSIGN = "ASSIGN",
  UNASSIGN = "UNASSIGN",
  DOWNLOAD = "DOWNLOAD",
  UPLOAD = "UPLOAD",
  EXPORT = "EXPORT",

  // Permissions
  GRANT_PERMISSION = "GRANT_PERMISSION",
  REVOKE_PERMISSION = "REVOKE_PERMISSION",
  ASSIGN_ROLE = "ASSIGN_ROLE",
  REMOVE_ROLE = "REMOVE_ROLE",
}

export enum EntityType {
  USER = "user",
  TASK = "task",
  FILE = "file",
  COMPANY = "company",
  ROLE = "role",
  PERMISSION = "permission",
  COMMENT = "comment",
  NOTIFICATION = "notification",
}

interface AuditLogData {
  action: AuditAction | string;
  entityType: EntityType | string;
  entityId?: string;
  userId?: string;
  userEmail: string;
  userIp?: string;
  userAgent?: string;
  changes?: {
    before?: unknown;
    after?: unknown;
  };
  metadata?: Record<string, unknown>;
  status?: "success" | "failed" | "error";
  errorMessage?: string;
}

/**
 * Create an audit log entry
 * This function should never throw - audit logging should not break the app
 */
export async function createAuditLog(data: AuditLogData): Promise<void> {
  try {
    await db.insert(auditLogs).values({
      action: data.action as typeof data.action & AuditAction,
      entityType: data.entityType as typeof data.entityType & EntityType,
      entityId: data.entityId,
      userId: data.userId,
      userEmail: data.userEmail,
      userIpAddress: data.userIp,
      userAgent: data.userAgent,
      changes: data.changes ? JSON.stringify(data.changes) : null,
      metadata: data.metadata ? JSON.stringify(data.metadata) : null,
      status: data.status || "success",
      errorMessage: data.errorMessage,
    });
  } catch (error) {
    // Don't throw - audit logging should never break the app
    console.error("Failed to create audit log:", error);
  }
}

/**
 * Get audit logs with filtering options
 */
export async function getAuditLogs(filters?: {
  userId?: string;
  entityType?: string;
  entityId?: string;
  action?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}) {
  try {
    const query = db.select().from(auditLogs);

    // Apply filters
    // Note: In a production app, you'd use drizzle's where() clauses here
    // For now, we'll keep it simple

    const result = await query;

    // Apply filters in memory for now
    let filtered = result;

    if (filters?.userId) {
      filtered = filtered.filter((log) => log.userId === filters.userId);
    }

    if (filters?.entityType) {
      filtered = filtered.filter((log) => log.entityType === filters.entityType);
    }

    if (filters?.entityId) {
      filtered = filtered.filter((log) => log.entityId === filters.entityId);
    }

    if (filters?.action) {
      filtered = filtered.filter((log) => log.action === filters.action);
    }

    if (filters?.startDate) {
      filtered = filtered.filter(
        (log) => log.createdAt && new Date(log.createdAt) >= filters.startDate!
      );
    }

    if (filters?.endDate) {
      filtered = filtered.filter(
        (log) => log.createdAt && new Date(log.createdAt) <= filters.endDate!
      );
    }

    // Sort by most recent first
    filtered.sort((a, b) => {
      if (!a.createdAt || !b.createdAt) return 0;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    // Apply pagination
    const limit = filters?.limit || 50;
    const offset = filters?.offset || 0;
    const paginated = filtered.slice(offset, offset + limit);

    return {
      logs: paginated,
      total: filtered.length,
      hasMore: filtered.length > offset + limit,
    };
  } catch (error) {
    console.error("Failed to get audit logs:", error);
    return { logs: [], total: 0, hasMore: false };
  }
}

/**
 * Helper to extract IP address from request headers
 */
export function getClientIp(headers: Headers): string | undefined {
  return (
    headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    headers.get("x-real-ip") ||
    undefined
  );
}

/**
 * Helper to get user agent from request headers
 */
export function getUserAgent(headers: Headers): string | undefined {
  return headers.get("user-agent") || undefined;
}
