import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { files } from "@/db/schema";
import { eq } from "drizzle-orm";

// POST /api/documents/[id]/approve - Approve a document (employees only)
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Only employees can approve documents
  if (session.user.role !== "employee") {
    return NextResponse.json(
      { error: "Nur Mitarbeiter können Belege freigeben" },
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

    // Update file status to approved
    const updatedFile = await db
      .update(files)
      .set({ 
        status: "approved",
        approvedAt: new Date(),
        approvedBy: session.user.id,
        rejectedAt: null,
        rejectedBy: null,
        rejectionReason: null,
      })
      .where(eq(files.id, id))
      .returning();

    return NextResponse.json({ 
      success: true,
      message: "Beleg wurde freigegeben",
      file: updatedFile[0]
    });
  } catch (error) {
    console.error("Error approving document:", error);
    return NextResponse.json(
      { error: "Fehler beim Freigeben des Belegs" },
      { status: 500 }
    );
  }
}
