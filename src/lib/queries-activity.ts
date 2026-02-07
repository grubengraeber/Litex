import { db } from "@/db";
import { auditLogs, notifications } from "@/db/schema";
import { desc, eq } from "drizzle-orm";

export interface ActivityItem {
  id: string;
  type: "audit" | "notification";
  action: string;
  title: string;
  message: string | null;
  entityType?: string;
  entityId?: string;
  userId?: string;
  userEmail?: string;
  createdAt: Date;
}

export async function getActivityFeed(
  userId: string,
  userRole: "admin" | "employee" | "customer",
  options: { limit?: number; offset?: number } = {}
): Promise<ActivityItem[]> {
  if (!db) throw new Error("Database not configured");

  const limit = options.limit || 30;
  const offset = options.offset || 0;

  if (userRole === "customer") {
    // Customers only see their notifications
    const userNotifications = await db.query.notifications.findMany({
      where: eq(notifications.userId, userId),
      orderBy: [desc(notifications.createdAt)],
      limit,
      offset,
    });

    return userNotifications.map((n) => ({
      id: n.id,
      type: "notification" as const,
      action: n.type,
      title: n.title,
      message: n.message,
      entityType: "task",
      entityId: n.taskId || undefined,
      userId: n.userId,
      createdAt: n.createdAt!,
    }));
  }

  // Employees/Admins see audit logs
  const logs = await db.query.auditLogs.findMany({
    orderBy: [desc(auditLogs.createdAt)],
    limit,
    offset,
  });

  return logs.map((log) => ({
    id: log.id,
    type: "audit" as const,
    action: log.action,
    title: formatAuditAction(log.action, log.entityType),
    message: log.changes ? summarizeChanges(log.changes) : null,
    entityType: log.entityType,
    entityId: log.entityId || undefined,
    userId: log.userId || undefined,
    userEmail: log.userEmail,
    createdAt: log.createdAt!,
  }));
}

function formatAuditAction(action: string, entityType: string): string {
  const actions: Record<string, string> = {
    CREATE: "erstellt",
    UPDATE: "aktualisiert",
    DELETE: "gelöscht",
    SUBMIT: "eingereicht",
    APPROVE: "genehmigt",
    REJECT: "abgelehnt",
    UPLOAD: "hochgeladen",
    LOGIN: "angemeldet",
    LOGOUT: "abgemeldet",
    ASSIGN_ROLE: "Rolle zugewiesen",
  };

  const entities: Record<string, string> = {
    task: "Aufgabe",
    file: "Datei",
    user: "Benutzer",
    company: "Mandant",
    comment: "Kommentar",
    role: "Rolle",
  };

  const actionLabel = actions[action] || action;
  const entityLabel = entities[entityType] || entityType;

  return `${entityLabel} ${actionLabel}`;
}

function summarizeChanges(changesJson: string): string | null {
  try {
    const changes = JSON.parse(changesJson);
    if (typeof changes === "object" && changes !== null) {
      const keys = Object.keys(changes);
      if (keys.length === 0) return null;
      return `${keys.length} Felder geändert`;
    }
    return null;
  } catch {
    return null;
  }
}

export function groupActivityByMonth(
  items: ActivityItem[]
): Record<string, ActivityItem[]> {
  const groups: Record<string, ActivityItem[]> = {};

  for (const item of items) {
    const date = new Date(item.createdAt);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    if (!groups[key]) groups[key] = [];
    groups[key].push(item);
  }

  return groups;
}
