import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { comments, notifications, users, tasks } from "@/db/schema";
import { eq } from "drizzle-orm";
import { withAuditLog } from "@/lib/audit/withAuditLog";

// GET /api/tasks/[id]/messages - Load comments for a task
export const GET = withAuditLog(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!db) {
      return NextResponse.json({ error: "Database not configured" }, { status: 500 });
    }

    const { id: taskId } = await params;

    // Get comments with sender info
    const taskComments = await db
      .select({
        id: comments.id,
        content: comments.content,
        createdAt: comments.createdAt,
        userId: comments.userId,
        userName: users.name,
        userEmail: users.email,
      })
      .from(comments)
      .innerJoin(users, eq(comments.userId, users.id))
      .where(eq(comments.taskId, taskId))
      .orderBy(comments.createdAt);

    // Get all read receipts for this task's comments
    const commentIds = taskComments.map((c) => c.id);
    const allReads =
      commentIds.length > 0
        ? await db.query.commentReads.findMany({
            where: (cr, { inArray }) => inArray(cr.commentId, commentIds),
            with: {
              user: {
                columns: { id: true, name: true },
              },
            },
          })
        : [];

    // Build reads map
    const readsMap: Record<
      string,
      Array<{ userId: string; userName: string | null; readAt: Date | null }>
    > = {};
    for (const read of allReads) {
      if (!readsMap[read.commentId]) {
        readsMap[read.commentId] = [];
      }
      readsMap[read.commentId].push({
        userId: read.userId,
        userName: read.user?.name ?? null,
        readAt: read.readAt,
      });
    }

    // Format response
    const formattedMessages = taskComments.map((comment) => ({
      id: comment.id,
      content: comment.content,
      createdAt: comment.createdAt,
      sender: {
        id: comment.userId,
        name: comment.userName,
        email: comment.userEmail,
        initials: getInitials(comment.userName || comment.userEmail || "?"),
        isCurrentUser: comment.userId === session.user.id,
      },
      reads: readsMap[comment.id] || [],
    }));

    return NextResponse.json({ messages: formattedMessages });
  } catch (error) {
    console.error("Error fetching comments:", error);
    return NextResponse.json(
      { error: "Failed to fetch comments" },
      { status: 500 }
    );
  }
}, { auto: true, entityType: "message", skip: () => true });

// POST /api/tasks/[id]/messages - Send a new comment
export const POST = withAuditLog(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!db) {
      return NextResponse.json({ error: "Database not configured" }, { status: 500 });
    }

    const { id: taskId } = await params;
    const { content } = await request.json();

    if (!content?.trim()) {
      return NextResponse.json(
        { error: "Comment content required" },
        { status: 400 }
      );
    }

    // Verify task exists and user has access
    const task = await db.query.tasks.findFirst({
      where: eq(tasks.id, taskId),
      with: {
        company: {
          with: {
            users: true,
          },
        },
      },
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Create comment
    const [newComment] = await db
      .insert(comments)
      .values({
        taskId,
        userId: session.user.id,
        content: content.trim(),
      })
      .returning();

    // Create notifications for other users in the company
    const otherUsers =
      task.company?.users?.filter((u) => u.id !== session.user.id) || [];

    if (otherUsers.length > 0) {
      const senderName = session.user.name || session.user.email || "Jemand";
      await db.insert(notifications).values(
        otherUsers.map((user) => ({
          userId: user.id,
          type: "new_message" as const,
          title: "Neuer Kommentar",
          message: `${senderName}: ${content.substring(0, 100)}${
            content.length > 100 ? "..." : ""
          }`,
          taskId,
          commentId: newComment.id,
        }))
      );
    }

    // Get sender info for response
    const sender = await db.query.users.findFirst({
      where: eq(users.id, session.user.id),
    });

    return NextResponse.json(
      {
        message: {
          id: newComment.id,
          content: newComment.content,
          createdAt: newComment.createdAt,
          sender: {
            id: session.user.id,
            name: sender?.name,
            email: sender?.email,
            initials: getInitials(sender?.name || sender?.email || "?"),
            isCurrentUser: true,
          },
          reads: [],
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating comment:", error);
    return NextResponse.json(
      { error: "Failed to create comment" },
      { status: 500 }
    );
  }
}, { auto: true, entityType: "message" });

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .substring(0, 2);
}
