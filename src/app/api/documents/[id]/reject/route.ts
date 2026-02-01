import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { files, comments } from "@/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

const rejectSchema = z.object({
  reason: z.string().min(1, "Bitte geben Sie einen Ablehnungsgrund an"),
});

// POST /api/documents/[id]/reject - Reject a document (employees only)
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Only employees can reject documents
  if (session.user.role !== "employee") {
    return NextResponse.json(
      { error: "Nur Mitarbeiter können Belege ablehnen" },
      { status: 403 }
    );
  }

  if (!db) {
    return NextResponse.json(
      { error: "Datenbank nicht verfügbar" },
      { status: 500 }
    );
  }

  const { id } = params;

  try {
    const body = await request.json();
    const { reason } = rejectSchema.parse(body);

    // Check if file exists
    const file = await db.query.files.findFirst({
      where: eq(files.id, id),
    });

    if (!file) {
      return NextResponse.json(
        { error: "Beleg nicht gefunden" },
        { status: 404 }
      );
    }

    // Update file status to rejected
    const updatedFile = await db
      .update(files)
      .set({ 
        status: "rejected",
        rejectedAt: new Date(),
        rejectedBy: session.user.id,
        rejectionReason: reason,
        approvedAt: null,
        approvedBy: null,
      })
      .where(eq(files.id, id))
      .returning();

    // Create a comment on the task with the rejection reason
    if (file.taskId) {
      await db.insert(comments).values({
        taskId: file.taskId,
        userId: session.user.id,
        content: `Beleg "${file.fileName}" wurde abgelehnt: ${reason}`,
      });
    }

    return NextResponse.json({ 
      success: true,
      message: "Beleg wurde abgelehnt",
      file: updatedFile[0]
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Ungültige Eingabe", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error rejecting document:", error);
    return NextResponse.json(
      { error: "Fehler beim Ablehnen des Belegs" },
      { status: 500 }
    );
  }
}
