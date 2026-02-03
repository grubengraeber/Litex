import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { 
  getTaskById, 
  getMessagesForTask, 
  createMessage, 
  deleteMessage,
  markAllTaskMessagesAsRead,
  notifyTaskParticipantsAboutMessage
} from "@/db/queries";
import { z } from "zod";

const createMessageSchema = z.object({
  content: z.string().min(1).max(10000),
});

// GET /api/tasks/[id]/messages - List messages for a task
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const task = await getTaskById(id);

    if (!task) {
      return NextResponse.json(
        { error: "Aufgabe nicht gefunden" },
        { status: 404 }
      );
    }

    // Check access for customers
    if (
      session.user.role === "customer" &&
      task.companyId !== session.user.companyId
    ) {
      return NextResponse.json(
        { error: "Kein Zugriff auf diese Aufgabe" },
        { status: 403 }
      );
    }

    const messages = await getMessagesForTask(id);

    return NextResponse.json({ messages });
  } catch (error) {
    console.error("Error fetching messages:", error);
    return NextResponse.json(
      { error: "Fehler beim Laden der Nachrichten" },
      { status: 500 }
    );
  }
}

// POST /api/tasks/[id]/messages - Send a new message
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const task = await getTaskById(id);

    if (!task) {
      return NextResponse.json(
        { error: "Aufgabe nicht gefunden" },
        { status: 404 }
      );
    }

    // Check access for customers
    if (
      session.user.role === "customer" &&
      task.companyId !== session.user.companyId
    ) {
      return NextResponse.json(
        { error: "Kein Zugriff auf diese Aufgabe" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { content } = createMessageSchema.parse(body);

    const message = await createMessage({
      taskId: id,
      userId: session.user.id,
      content,
    });

    // Notify other participants (fire and forget)
    notifyTaskParticipantsAboutMessage(id, session.user.id, content).catch(err => {
      console.error("Error sending notifications:", err);
    });

    return NextResponse.json({ message }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Ungültige Eingabe", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error creating message:", error);
    return NextResponse.json(
      { error: "Fehler beim Erstellen der Nachricht" },
      { status: 500 }
    );
  }
}

// PATCH /api/tasks/[id]/messages - Mark all messages as read
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const task = await getTaskById(id);

    if (!task) {
      return NextResponse.json(
        { error: "Aufgabe nicht gefunden" },
        { status: 404 }
      );
    }

    // Check access for customers
    if (
      session.user.role === "customer" &&
      task.companyId !== session.user.companyId
    ) {
      return NextResponse.json(
        { error: "Kein Zugriff auf diese Aufgabe" },
        { status: 403 }
      );
    }

    await markAllTaskMessagesAsRead(id, session.user.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error marking messages as read:", error);
    return NextResponse.json(
      { error: "Fehler beim Markieren der Nachrichten" },
      { status: 500 }
    );
  }
}

// DELETE /api/tasks/[id]/messages - Delete a message
export async function DELETE(request: NextRequest) {
  const session = await auth();
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const messageId = searchParams.get("messageId");

  if (!messageId) {
    return NextResponse.json(
      { error: "messageId fehlt" },
      { status: 400 }
    );
  }

  try {
    // Only employees can delete messages
    if (session.user.role !== "employee") {
      return NextResponse.json(
        { error: "Keine Berechtigung" },
        { status: 403 }
      );
    }

    await deleteMessage(messageId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting message:", error);
    return NextResponse.json(
      { error: "Fehler beim Löschen der Nachricht" },
      { status: 500 }
    );
  }
}
