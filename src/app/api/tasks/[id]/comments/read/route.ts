import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { commentReadStatus, comments } from "@/db/schema";
import { eq, and, inArray } from "drizzle-orm";

// POST /api/tasks/[id]/comments/read - Mark comments as read
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const taskId = params.id;
    const body = await request.json();
    const { commentIds } = body;

    if (!commentIds || !Array.isArray(commentIds) || commentIds.length === 0) {
      return NextResponse.json({ error: "commentIds array required" }, { status: 400 });
    }

    // Verify all comments belong to this task
    const taskComments = await db.query.comments.findMany({
      where: and(eq(comments.taskId, taskId), inArray(comments.id, commentIds)),
      columns: { id: true },
    });

    const validCommentIds = taskComments.map(c => c.id);

    // Insert read status for each comment (ignore duplicates)
    for (const commentId of validCommentIds) {
      // Check if already read
      const existing = await db.query.commentReadStatus.findFirst({
        where: and(
          eq(commentReadStatus.commentId, commentId),
          eq(commentReadStatus.userId, session.user.id)
        ),
      });

      if (!existing) {
        await db.insert(commentReadStatus).values({
          commentId,
          userId: session.user.id,
        });
      }
    }

    return NextResponse.json({ success: true, marked: validCommentIds.length });
  } catch (error) {
    console.error("Error marking comments as read:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// GET /api/tasks/[id]/comments/read - Get read status for task comments
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const taskId = params.id;

    // Get all comments for this task with their read statuses
    const taskComments = await db.query.comments.findMany({
      where: eq(comments.taskId, taskId),
      with: {
        readStatuses: {
          columns: { userId: true, readAt: true },
        },
      },
    });

    // Format response: commentId -> list of users who read it
    const readStatusMap = taskComments.map(comment => ({
      commentId: comment.id,
      readers: comment.readStatuses.map(rs => ({
        userId: rs.userId,
        readAt: rs.readAt,
      })),
      isReadByMe: comment.readStatuses.some(rs => rs.userId === session.user.id),
    }));

    return NextResponse.json({ readStatus: readStatusMap });
  } catch (error) {
    console.error("Error getting read status:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
