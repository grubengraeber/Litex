import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { notifications } from "@/db/schema";
import { eq, desc, and, sql } from "drizzle-orm";

// GET /api/notifications - Get user's notifications
export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");
    const unreadOnly = searchParams.get("unread") === "true";

    const whereClause = unreadOnly
      ? and(eq(notifications.userId, session.user.id), eq(notifications.isRead, false))
      : eq(notifications.userId, session.user.id);

    const [userNotifications, countResult] = await Promise.all([
      db.query.notifications.findMany({
        where: whereClause,
        orderBy: [desc(notifications.createdAt)],
        limit,
        offset,
        with: {
          task: {
            columns: { id: true, bookingText: true },
          },
        },
      }),
      db.select({ count: sql<number>`count(*)` })
        .from(notifications)
        .where(whereClause),
    ]);

    // Get unread count
    const unreadCount = await db.select({ count: sql<number>`count(*)` })
      .from(notifications)
      .where(and(eq(notifications.userId, session.user.id), eq(notifications.isRead, false)));

    return NextResponse.json({
      notifications: userNotifications,
      total: countResult[0]?.count || 0,
      unreadCount: unreadCount[0]?.count || 0,
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// PATCH /api/notifications - Mark notifications as read
export async function PATCH(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { notificationIds, markAllRead } = body;

    if (markAllRead) {
      // Mark all user's notifications as read
      await db.update(notifications)
        .set({ isRead: true })
        .where(eq(notifications.userId, session.user.id));

      return NextResponse.json({ success: true, message: "All notifications marked as read" });
    }

    if (!notificationIds || !Array.isArray(notificationIds) || notificationIds.length === 0) {
      return NextResponse.json({ error: "notificationIds array required" }, { status: 400 });
    }

    // Mark specific notifications as read (only if they belong to the user)
    for (const id of notificationIds) {
      await db.update(notifications)
        .set({ isRead: true })
        .where(and(eq(notifications.id, id), eq(notifications.userId, session.user.id)));
    }

    return NextResponse.json({ success: true, markedRead: notificationIds.length });
  } catch (error) {
    console.error("Error updating notifications:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// DELETE /api/notifications - Delete a notification
export async function DELETE(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const notificationId = searchParams.get("id");

    if (!notificationId) {
      return NextResponse.json({ error: "Notification ID required" }, { status: 400 });
    }

    // Only delete if it belongs to the user
    await db.delete(notifications)
      .where(and(eq(notifications.id, notificationId), eq(notifications.userId, session.user.id)));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting notification:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
