import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { 
  getNotificationsForUser, 
  getUnreadNotificationCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification
} from "@/db/queries";
import { z } from "zod";

const patchSchema = z.object({
  notificationId: z.string().uuid().optional(),
  markAllRead: z.boolean().optional(),
});

// GET /api/notifications - Get user notifications
export async function GET(request: NextRequest) {
  const session = await auth();
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get("limit") || "50", 10);
  const offset = parseInt(searchParams.get("offset") || "0", 10);
  const isReadParam = searchParams.get("isRead");
  const type = searchParams.get("type") as "new_message" | "task_assigned" | "deadline_warning" | null;

  try {
    const notifications = await getNotificationsForUser(session.user.id, {
      isRead: isReadParam === null ? undefined : isReadParam === "true",
      type: type || undefined,
      limit,
      offset,
    });

    const unreadCount = await getUnreadNotificationCount(session.user.id);

    return NextResponse.json({ 
      notifications,
      unreadCount,
      pagination: {
        limit,
        offset,
        hasMore: notifications.length === limit,
      }
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json(
      { error: "Fehler beim Laden der Benachrichtigungen" },
      { status: 500 }
    );
  }
}

// PATCH /api/notifications - Mark notification(s) as read
export async function PATCH(request: NextRequest) {
  const session = await auth();
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { notificationId, markAllRead } = patchSchema.parse(body);

    if (markAllRead) {
      await markAllNotificationsAsRead(session.user.id);
      return NextResponse.json({ success: true, markedAll: true });
    }

    if (notificationId) {
      const updated = await markNotificationAsRead(notificationId, session.user.id);
      
      if (!updated) {
        return NextResponse.json(
          { error: "Benachrichtigung nicht gefunden" },
          { status: 404 }
        );
      }

      return NextResponse.json({ notification: updated });
    }

    return NextResponse.json(
      { error: "notificationId oder markAllRead erforderlich" },
      { status: 400 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Ungültige Eingabe", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error marking notification as read:", error);
    return NextResponse.json(
      { error: "Fehler beim Aktualisieren der Benachrichtigung" },
      { status: 500 }
    );
  }
}

// DELETE /api/notifications - Delete a notification
export async function DELETE(request: NextRequest) {
  const session = await auth();
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const notificationId = searchParams.get("notificationId");

  if (!notificationId) {
    return NextResponse.json(
      { error: "notificationId fehlt" },
      { status: 400 }
    );
  }

  try {
    await deleteNotification(notificationId, session.user.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting notification:", error);
    return NextResponse.json(
      { error: "Fehler beim Löschen der Benachrichtigung" },
      { status: 500 }
    );
  }
}
