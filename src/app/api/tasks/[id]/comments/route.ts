import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getTaskById, getCommentsForTask, createComment, deleteComment } from "@/db/queries";
import { z } from "zod";

const createCommentSchema = z.object({
  content: z.string().min(1).max(5000),
});

// GET /api/tasks/[id]/comments - List comments for a task
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

    const comments = await getCommentsForTask(id);

    return NextResponse.json({ comments });
  } catch (error) {
    console.error("Error fetching comments:", error);
    return NextResponse.json(
      { error: "Fehler beim Laden der Kommentare" },
      { status: 500 }
    );
  }
}

// POST /api/tasks/[id]/comments - Add comment
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
    const { content } = createCommentSchema.parse(body);

    const comment = await createComment({
      taskId: id,
      userId: session.user.id,
      content,
    });

    return NextResponse.json({ comment }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Ungültige Eingabe", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error creating comment:", error);
    return NextResponse.json(
      { error: "Fehler beim Erstellen des Kommentars" },
      { status: 500 }
    );
  }
}

// DELETE /api/tasks/[id]/comments - Delete comment
export async function DELETE(request: NextRequest) {
  const session = await auth();
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const commentId = searchParams.get("commentId");

  if (!commentId) {
    return NextResponse.json(
      { error: "commentId fehlt" },
      { status: 400 }
    );
  }

  try {
    // Only employees or comment owner can delete
    // Note: Would need to add ownership check here
    if (session.user.role !== "employee") {
      return NextResponse.json(
        { error: "Keine Berechtigung" },
        { status: 403 }
      );
    }

    await deleteComment(commentId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting comment:", error);
    return NextResponse.json(
      { error: "Fehler beim Löschen des Kommentars" },
      { status: 500 }
    );
  }
}
