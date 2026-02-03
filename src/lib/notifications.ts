import { db } from "@/db";
import { notifications, users, tasks } from "@/db/schema";
import { eq, and, ne } from "drizzle-orm";

type NotificationType = "new_comment" | "task_assigned" | "deadline_warning" | "file_uploaded";

interface CreateNotificationParams {
  userId: string;
  type: NotificationType;
  title: string;
  body?: string;
  taskId?: string;
  commentId?: string;
}

/**
 * Create a notification for a user
 */
export async function createNotification(params: CreateNotificationParams) {
  const { userId, type, title, body, taskId, commentId } = params;

  await db.insert(notifications).values({
    userId,
    type,
    title,
    body,
    taskId,
    commentId,
  });
}

/**
 * Notify all users related to a task about a new comment
 * (except the comment author)
 */
export async function notifyNewComment(
  taskId: string,
  commentAuthorId: string,
  commentContent: string
) {
  // Get the task to find the company
  const task = await db.query.tasks.findFirst({
    where: eq(tasks.id, taskId),
    with: {
      company: true,
    },
  });

  if (!task) return;

  // Get all users related to this company (customers) + all employees
  const relatedUsers = await db.query.users.findMany({
    where: and(
      ne(users.id, commentAuthorId), // Exclude the author
      eq(users.status, "active")
    ),
  });

  // Filter to users who should be notified:
  // - Users from the same company (customers)
  // - All employees
  const usersToNotify = relatedUsers.filter(
    user => user.companyId === task.companyId || user.role === "employee"
  );

  // Create notifications
  const truncatedContent = commentContent.length > 100 
    ? commentContent.substring(0, 100) + "..." 
    : commentContent;

  for (const user of usersToNotify) {
    await createNotification({
      userId: user.id,
      type: "new_comment",
      title: `Neuer Kommentar: ${task.bookingText || "Aufgabe"}`,
      body: truncatedContent,
      taskId,
    });
  }
}

/**
 * Notify user about task assignment
 */
export async function notifyTaskAssigned(taskId: string, assignedUserId: string) {
  const task = await db.query.tasks.findFirst({
    where: eq(tasks.id, taskId),
  });

  if (!task) return;

  await createNotification({
    userId: assignedUserId,
    type: "task_assigned",
    title: "Neue Aufgabe zugewiesen",
    body: task.bookingText || "Eine neue Aufgabe wurde Ihnen zugewiesen",
    taskId,
  });
}

/**
 * Notify about deadline warning
 */
export async function notifyDeadlineWarning(taskId: string, userIds: string[]) {
  const task = await db.query.tasks.findFirst({
    where: eq(tasks.id, taskId),
  });

  if (!task) return;

  for (const userId of userIds) {
    await createNotification({
      userId,
      type: "deadline_warning",
      title: "Frist-Warnung",
      body: `Aufgabe "${task.bookingText}" nähert sich der Frist`,
      taskId,
    });
  }
}

/**
 * Notify about file upload
 */
export async function notifyFileUploaded(
  taskId: string,
  uploaderId: string,
  fileName: string
) {
  const task = await db.query.tasks.findFirst({
    where: eq(tasks.id, taskId),
    with: {
      company: true,
    },
  });

  if (!task) return;

  // Notify employees about the upload
  const employees = await db.query.users.findMany({
    where: and(
      eq(users.role, "employee"),
      eq(users.status, "active"),
      ne(users.id, uploaderId)
    ),
  });

  for (const employee of employees) {
    await createNotification({
      userId: employee.id,
      type: "file_uploaded",
      title: "Neuer Beleg hochgeladen",
      body: `${fileName} für "${task.bookingText}"`,
      taskId,
    });
  }
}
