import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { commentReads, comments } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { withAuditLog } from "@/lib/audit/withAuditLog";

// POST /api/messages/[id]/read - Mark comment as read
export const POST = withAuditLog(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: commentId } = await params;

    if (!db) {
      return NextResponse.json({ error: "Database not configured" }, { status: 500 });
    }

    // Check if comment exists
    const comment = await db.query.comments.findFirst({
      where: eq(comments.id, commentId),
    });

    if (!comment) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }

    // Don't create read receipt for own comments
    if (comment.userId === session.user.id) {
      return NextResponse.json({ success: true, alreadyRead: true });
    }

    // Check if already read
    const existingRead = await db.query.commentReads.findFirst({
      where: and(
        eq(commentReads.commentId, commentId),
        eq(commentReads.userId, session.user.id)
      ),
    });

    if (existingRead) {
      return NextResponse.json({ success: true, alreadyRead: true });
    }

    // Create read receipt
    await db.insert(commentReads).values({
      commentId,
      userId: session.user.id,
    });

    return NextResponse.json({ success: true, alreadyRead: false });
  } catch (error) {
    console.error("Error marking comment as read:", error);
    return NextResponse.json(
      { error: "Failed to mark comment as read" },
      { status: 500 }
    );
  }
}, { auto: true, entityType: "message", skip: () => true });
