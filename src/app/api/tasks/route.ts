import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getTasksForUser, createTask } from "@/db/queries";
import { z } from "zod";

const createTaskSchema = z.object({
  companyId: z.string().uuid(),
  bmdBookingId: z.string().optional(),
  bookingText: z.string().optional(),
  amount: z.string().optional(),
  documentDate: z.string().optional(),
  bookingDate: z.string().optional(),
  period: z.string().optional(),
  dueDate: z.string().optional(),
});

// GET /api/tasks - List tasks (filtered by user role)
export async function GET(request: NextRequest) {
  const session = await auth();
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const includeComments = searchParams.get("includeComments") === "true";

  const filters = {
    companyId: searchParams.get("companyId") || undefined,
    status: searchParams.get("status") as "open" | "submitted" | "completed" | undefined,
    trafficLight: searchParams.get("trafficLight") as "green" | "yellow" | "red" | undefined,
    period: searchParams.get("period") || undefined,
    search: searchParams.get("search") || undefined,
    limit: searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : undefined,
    offset: searchParams.get("offset") ? parseInt(searchParams.get("offset")!) : undefined,
    includeComments,
  };

  try {
    const tasks = await getTasksForUser(
      session.user.id,
      session.user.role || "customer",
      session.user.companyId || null,
      filters
    );

    return NextResponse.json({ tasks });
  } catch (error) {
    console.error("Error fetching tasks:", error);
    return NextResponse.json(
      { error: "Fehler beim Laden der Aufgaben" },
      { status: 500 }
    );
  }
}

// POST /api/tasks - Create task (employees only)
export async function POST(request: NextRequest) {
  const session = await auth();
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Only employees can create tasks
  if (session.user.role !== "employee") {
    return NextResponse.json(
      { error: "Nur Mitarbeiter können Aufgaben erstellen" },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const data = createTaskSchema.parse(body);

    const task = await createTask(data);

    return NextResponse.json({ task }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Ungültige Eingabe", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error creating task:", error);
    return NextResponse.json(
      { error: "Fehler beim Erstellen der Aufgabe" },
      { status: 500 }
    );
  }
}
