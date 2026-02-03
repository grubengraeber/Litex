import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { notifications } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";

// GET /api/notifications - Get user's notifications
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!db) {
      return NextResponse.json({ error: "Database not configured" }, { status: 500 });
    }

    const searchParams = request.nextUrl.searchParams;
    const unreadOnly = searchParams.get("unread") === "true";
    const limit = parseInt(searchParams.get("limit") || "20");

    // Get notifications with task info
    const userNotifications = await db.query.notifications.findMany({
      where: unreadOnly
        ? and(
            eq(notifications.userId, session.user.id),
            eq(notifications.read, false)
          )
        : eq(notifications.userId, session.user.id),
      with: {
        task: {
          columns: {
            id: true,
            bookingText: true,
          },
        },
      },
      orderBy: [desc(notifications.createdAt)],
      limit,
    });

    // Get unread count
    const unreadNotifications = await db.query.notifications.findMany({
      where: and(
        eq(notifications.userId, session.user.id),
        eq(notifications.read, false)
      ),
    });

    return NextResponse.json({
      notifications: userNotifications,
      unreadCount: unreadNotifications.length,
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json(
      { error: "Failed to fetch notifications" },
      { status: 500 }
    );
  }
}
