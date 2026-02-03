import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { messages, notifications, users, tasks } from "@/db/schema";
import { eq } from "drizzle-orm";

// GET /api/tasks/[id]/messages - Load messages for a task
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!db) {
      return NextResponse.json({ error: "Database not configured" }, { status: 500 });
    }

    const taskId = params.id;

    // Get messages with sender info
    const taskMessages = await db
      .select({
        id: messages.id,
        content: messages.content,
        createdAt: messages.createdAt,
        senderId: messages.senderId,
        senderName: users.name,
        senderEmail: users.email,
      })
      .from(messages)
      .innerJoin(users, eq(messages.senderId, users.id))
      .where(eq(messages.taskId, taskId))
      .orderBy(messages.createdAt);

    // Get all read receipts for this task's messages
    const messageIds = taskMessages.map((m) => m.id);
    const allReads =
      messageIds.length > 0
        ? await db.query.messageReads.findMany({
            where: (mr, { inArray }) => inArray(mr.messageId, messageIds),
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
      if (!readsMap[read.messageId]) {
        readsMap[read.messageId] = [];
      }
      readsMap[read.messageId].push({
        userId: read.userId,
        userName: read.user?.name ?? null,
        readAt: read.readAt,
      });
    }

    // Format response
    const formattedMessages = taskMessages.map((msg) => ({
      id: msg.id,
      content: msg.content,
      createdAt: msg.createdAt,
      sender: {
        id: msg.senderId,
        name: msg.senderName,
        email: msg.senderEmail,
        initials: getInitials(msg.senderName || msg.senderEmail || "?"),
        isCurrentUser: msg.senderId === session.user.id,
      },
      reads: readsMap[msg.id] || [],
    }));

    return NextResponse.json({ messages: formattedMessages });
  } catch (error) {
    console.error("Error fetching messages:", error);
    return NextResponse.json(
      { error: "Failed to fetch messages" },
      { status: 500 }
    );
  }
}

// POST /api/tasks/[id]/messages - Send a new message
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!db) {
      return NextResponse.json({ error: "Database not configured" }, { status: 500 });
    }

    const taskId = params.id;
    const { content } = await request.json();

    if (!content?.trim()) {
      return NextResponse.json(
        { error: "Message content required" },
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

    // Create message
    const [newMessage] = await db
      .insert(messages)
      .values({
        taskId,
        senderId: session.user.id,
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
          title: "Neue Nachricht",
          message: `${senderName}: ${content.substring(0, 100)}${
            content.length > 100 ? "..." : ""
          }`,
          taskId,
          messageId: newMessage.id,
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
          id: newMessage.id,
          content: newMessage.content,
          createdAt: newMessage.createdAt,
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
    console.error("Error creating message:", error);
    return NextResponse.json(
      { error: "Failed to create message" },
      { status: 500 }
    );
  }
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .substring(0, 2);
}
