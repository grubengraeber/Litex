import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { files } from "@/db/schema";
import { eq } from "drizzle-orm";
import { userHasPermission, PERMISSIONS } from "@/lib/permissions";

// POST /api/files/[id]/approve - Approve a file
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
    // Check permission
    const canApprove = await userHasPermission(
      session.user.id,
      PERMISSIONS.APPROVE_FILES
    );

    if (!canApprove) {
      return NextResponse.json(
        { error: "Keine Berechtigung zum Freigeben von Dateien" },
        { status: 403 }
      );
    }

    // Update file status
    const [updated] = await db
      .update(files)
      .set({
        status: "approved",
        approvedBy: session.user.id,
        approvedAt: new Date(),
      })
      .where(eq(files.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json(
        { error: "Datei nicht gefunden" },
        { status: 404 }
      );
    }

    return NextResponse.json({ file: updated });
  } catch (error) {
    console.error("Error approving file:", error);
    return NextResponse.json(
      { error: "Fehler beim Freigeben der Datei" },
      { status: 500 }
    );
  }
}
