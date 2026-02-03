import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { messageReads, messages } from "@/db/schema";
import { eq, and } from "drizzle-orm";

// POST /api/messages/[id]/read - Mark message as read
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const messageId = params.id;

    if (!db) {
      return NextResponse.json({ error: "Database not configured" }, { status: 500 });
    }

    // Check if message exists
    const message = await db.query.messages.findFirst({
      where: eq(messages.id, messageId),
    });

    if (!message) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 });
    }

    // Don't create read receipt for own messages
    if (message.senderId === session.user.id) {
      return NextResponse.json({ success: true, alreadyRead: true });
    }

    // Check if already read
    const existingRead = await db.query.messageReads.findFirst({
      where: and(
        eq(messageReads.messageId, messageId),
        eq(messageReads.userId, session.user.id)
      ),
    });

    if (existingRead) {
      return NextResponse.json({ success: true, alreadyRead: true });
    }

    // Create read receipt
    await db.insert(messageReads).values({
      messageId,
      userId: session.user.id,
    });

    return NextResponse.json({ success: true, alreadyRead: false });
  } catch (error) {
    console.error("Error marking message as read:", error);
    return NextResponse.json(
      { error: "Failed to mark message as read" },
      { status: 500 }
    );
  }
}
