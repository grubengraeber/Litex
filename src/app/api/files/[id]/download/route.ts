import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { files } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getDownloadUrl } from "@/lib/s3";

// GET /api/files/[id]/download - Get a presigned download URL and redirect
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
    const [file] = await db
      .select({
        id: files.id,
        storageKey: files.storageKey,
        fileName: files.fileName,
        uploadedBy: files.uploadedBy,
      })
      .from(files)
      .where(eq(files.id, id))
      .limit(1);

    if (!file) {
      return NextResponse.json(
        { error: "Datei nicht gefunden" },
        { status: 404 }
      );
    }

    const { downloadUrl } = await getDownloadUrl(
      file.storageKey,
      file.fileName
    );

    return NextResponse.redirect(downloadUrl);
  } catch (error) {
    console.error("Error downloading file:", error);
    return NextResponse.json(
      { error: "Fehler beim Herunterladen der Datei" },
      { status: 500 }
    );
  }
}
