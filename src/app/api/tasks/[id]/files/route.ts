import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getTaskById, getFilesForTask, createFile, deleteFile as deleteFileRecord } from "@/db/queries";
import { getUploadUrl, getDownloadUrl, deleteFile as deleteS3File } from "@/lib/s3";
import { z } from "zod";
import { withAuditLog } from "@/lib/audit/withAuditLog";

const requestUploadSchema = z.object({
  fileName: z.string().min(1).max(255),
  mimeType: z.string().optional(),
  fileSize: z.number().optional(),
});

const confirmUploadSchema = z.object({
  storageKey: z.string(),
  bucket: z.string(),
  fileName: z.string(),
  mimeType: z.string().optional(),
  fileSize: z.number().optional(),
});

// GET /api/tasks/[id]/files - List files and optionally get download URL
export const GET = withAuditLog(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const session = await auth();
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const fileId = searchParams.get("fileId");

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

    // If fileId provided, return download URL
    if (fileId) {
      const files = await getFilesForTask(id);
      const file = files.find(f => f.id === fileId);
      
      if (!file) {
        return NextResponse.json(
          { error: "Datei nicht gefunden" },
          { status: 404 }
        );
      }

      const { downloadUrl } = await getDownloadUrl(file.storageKey, file.fileName);

      return NextResponse.json({
        file,
        downloadUrl,
      });
    }

    // Return all files
    const files = await getFilesForTask(id);

    return NextResponse.json({ files });
  } catch (error) {
    console.error("Error fetching files:", error);
    return NextResponse.json(
      { error: "Fehler beim Laden der Dateien" },
      { status: 500 }
    );
  }
}, {
  action: "DOWNLOAD",
  entityType: "file",
  skip: (req) => !req.nextUrl.searchParams.get("fileId"), // Only log when downloading specific file
  getEntityId: (req) => req.nextUrl.searchParams.get("fileId") || undefined,
  getMetadata: (req) => ({
    taskId: req.nextUrl.pathname.split('/')[3],
  }),
});

// POST /api/tasks/[id]/files - Request upload URL or confirm upload
export const POST = withAuditLog(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const session = await auth();
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const action = searchParams.get("action") || "requestUpload";

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

    if (action === "requestUpload") {
      // Generate presigned upload URL
      const { fileName, mimeType } = requestUploadSchema.parse(body);
      
      const { uploadUrl, storageKey, bucket } = await getUploadUrl(
        id,
        fileName,
        mimeType || "application/octet-stream"
      );

      return NextResponse.json({
        uploadUrl,
        storageKey,
        bucket,
      });
    } else if (action === "confirmUpload") {
      // Confirm upload and create file record
      const data = confirmUploadSchema.parse(body);

      const file = await createFile({
        taskId: id,
        uploadedBy: session.user.id,
        fileName: data.fileName,
        mimeType: data.mimeType,
        fileSize: data.fileSize,
        bucket: data.bucket,
        storageKey: data.storageKey,
      });

      return NextResponse.json({ file }, { status: 201 });
    }

    return NextResponse.json(
      { error: "Ungültige Aktion" },
      { status: 400 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Ungültige Eingabe", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error handling file upload:", error);
    return NextResponse.json(
      { error: "Fehler beim Hochladen der Datei" },
      { status: 500 }
    );
  }
}, { auto: true, entityType: "file" });

// DELETE /api/tasks/[id]/files - Delete file
export const DELETE = withAuditLog(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const session = await auth();
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const fileId = searchParams.get("fileId");

  if (!fileId) {
    return NextResponse.json(
      { error: "fileId fehlt" },
      { status: 400 }
    );
  }

  try {
    const task = await getTaskById(id);

    if (!task) {
      return NextResponse.json(
        { error: "Aufgabe nicht gefunden" },
        { status: 404 }
      );
    }

    // Only employees or file uploader can delete
    if (session.user.role !== "employee") {
      return NextResponse.json(
        { error: "Keine Berechtigung" },
        { status: 403 }
      );
    }

    // Delete file record and get storage info
    const file = await deleteFileRecord(fileId);

    // Delete from S3
    if (file?.storageKey) {
      try {
        await deleteS3File(file.storageKey);
      } catch (s3Error) {
        console.error("Error deleting from S3:", s3Error);
        // Continue anyway - file record is deleted
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting file:", error);
    return NextResponse.json(
      { error: "Fehler beim Löschen der Datei" },
      { status: 500 }
    );
  }
}, { auto: true, entityType: "file" });
