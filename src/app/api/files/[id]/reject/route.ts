import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { files } from "@/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { userHasPermission, PERMISSIONS } from "@/lib/permissions";
import { auditLog } from "@/lib/audit/audit-middleware";

const rejectSchema = z.object({
  reason: z.string().min(1).max(500),
});

// POST /api/files/[id]/reject - Reject a file
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
    const canReject = await userHasPermission(
      session.user.id,
      PERMISSIONS.REJECT_FILES
    );

    if (!canReject) {
      return NextResponse.json(
        { error: "Keine Berechtigung zum Ablehnen von Dateien" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { reason } = rejectSchema.parse(body);

    // Update file status
    const [updated] = await db
      .update(files)
      .set({
        status: "rejected",
        rejectedBy: session.user.id,
        rejectedAt: new Date(),
        rejectionReason: reason,
      })
      .where(eq(files.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json(
        { error: "Datei nicht gefunden" },
        { status: 404 }
      );
    }

    // Audit log
    await auditLog(request, "REJECT", "file", {
      entityId: id,
      metadata: {
        fileName: updated.fileName,
        taskId: updated.taskId,
        reason,
      },
    });

    return NextResponse.json({ file: updated });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Ungültige Eingabe", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error rejecting file:", error);
    return NextResponse.json(
      { error: "Fehler beim Ablehnen der Datei" },
      { status: 500 }
    );
  }
}
