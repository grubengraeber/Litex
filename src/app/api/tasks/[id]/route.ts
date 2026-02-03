import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getTaskById, updateTask, deleteTask } from "@/db/queries";
import { z } from "zod";
import { userHasPermission, PERMISSIONS } from "@/lib/permissions";

const updateTaskSchema = z.object({
  status: z.enum(["open", "submitted", "completed"]).optional(),
  trafficLight: z.enum(["green", "yellow", "red"]).optional(),
});

// GET /api/tasks/[id] - Get single task
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check permission
  const canViewTasks = await userHasPermission(
    session.user.id,
    PERMISSIONS.VIEW_TASKS
  );

  if (!canViewTasks) {
    return NextResponse.json(
      { error: "Keine Berechtigung zum Anzeigen von Aufgaben" },
      { status: 403 }
    );
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

    // Check if user can view all tasks or just own company tasks
    const canViewAllTasks = await userHasPermission(
      session.user.id,
      PERMISSIONS.VIEW_ALL_TASKS
    );

    if (!canViewAllTasks && task.companyId !== session.user.companyId) {
      return NextResponse.json(
        { error: "Kein Zugriff auf diese Aufgabe" },
        { status: 403 }
      );
    }

    return NextResponse.json({ task });
  } catch (error) {
    console.error("Error fetching task:", error);
    return NextResponse.json(
      { error: "Fehler beim Laden der Aufgabe" },
      { status: 500 }
    );
  }
}

// PATCH /api/tasks/[id] - Update task
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check permission
  const canEditTasks = await userHasPermission(
    session.user.id,
    PERMISSIONS.EDIT_TASKS
  );

  const canSubmitTasks = await userHasPermission(
    session.user.id,
    PERMISSIONS.SUBMIT_TASKS
  );

  const canCompleteTasks = await userHasPermission(
    session.user.id,
    PERMISSIONS.COMPLETE_TASKS
  );

  const { id } = await params;

  try {
    const task = await getTaskById(id);

    if (!task) {
      return NextResponse.json(
        { error: "Aufgabe nicht gefunden" },
        { status: 404 }
      );
    }

    // Check access
    const canViewAllTasks = await userHasPermission(
      session.user.id,
      PERMISSIONS.VIEW_ALL_TASKS
    );

    if (!canViewAllTasks && task.companyId !== session.user.companyId) {
      return NextResponse.json(
        { error: "Kein Zugriff auf diese Aufgabe" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const data = updateTaskSchema.parse(body);

    // Check specific status change permissions
    if (data.status === "submitted" && !canSubmitTasks) {
      return NextResponse.json(
        { error: "Keine Berechtigung zum Einreichen von Aufgaben" },
        { status: 403 }
      );
    }

    if (data.status === "completed" && !canCompleteTasks) {
      return NextResponse.json(
        { error: "Keine Berechtigung zum Abschließen von Aufgaben" },
        { status: 403 }
      );
    }

    if (!canEditTasks && data.status !== "submitted" && data.status !== "completed") {
      return NextResponse.json(
        { error: "Keine Berechtigung zum Bearbeiten von Aufgaben" },
        { status: 403 }
      );
    }

    // If completing, add completion info
    const updateData: Parameters<typeof updateTask>[1] = { ...data };
    if (data.status === "completed") {
      updateData.completedAt = new Date();
      updateData.completedBy = session.user.id;
    } else if (data.status === "open") {
      updateData.completedAt = null;
      updateData.completedBy = null;
    }

    const updated = await updateTask(id, updateData);

    return NextResponse.json({ task: updated });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Ungültige Eingabe", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error updating task:", error);
    return NextResponse.json(
      { error: "Fehler beim Aktualisieren der Aufgabe" },
      { status: 500 }
    );
  }
}

// DELETE /api/tasks/[id] - Delete task
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check permission
  const canDeleteTasks = await userHasPermission(
    session.user.id,
    PERMISSIONS.DELETE_TASKS
  );

  if (!canDeleteTasks) {
    return NextResponse.json(
      { error: "Keine Berechtigung zum Löschen von Aufgaben" },
      { status: 403 }
    );
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

    await deleteTask(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting task:", error);
    return NextResponse.json(
      { error: "Fehler beim Löschen der Aufgabe" },
      { status: 500 }
    );
  }
}
