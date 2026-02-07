import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { files, users, tasks, companies } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { userHasPermission, PERMISSIONS } from "@/lib/permissions";
import { withAuditLog } from "@/lib/audit/withAuditLog";

// GET /api/files - List all files (with access control)
export const GET = withAuditLog(async () => {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Check if user can view files
    const canApproveFiles = await userHasPermission(
      session.user.id,
      PERMISSIONS.APPROVE_FILES
    );

    let rawFiles;

    if (canApproveFiles) {
      // Employees can see all files
      rawFiles = await db
        .select({
          id: files.id,
          fileName: files.fileName,
          mimeType: files.mimeType,
          fileSize: files.fileSize,
          status: files.status,
          createdAt: files.createdAt,
          storageKey: files.storageKey,
          bucket: files.bucket,
          userId: users.id,
          userName: users.name,
          userEmail: users.email,
          taskId: tasks.id,
          taskBookingText: tasks.bookingText,
          companyName: companies.name,
        })
        .from(files)
        .leftJoin(users, eq(files.uploadedBy, users.id))
        .leftJoin(tasks, eq(files.taskId, tasks.id))
        .leftJoin(companies, eq(tasks.companyId, companies.id))
        .orderBy(desc(files.createdAt));
    } else {
      // Regular users can only see their own files
      rawFiles = await db
        .select({
          id: files.id,
          fileName: files.fileName,
          mimeType: files.mimeType,
          fileSize: files.fileSize,
          status: files.status,
          createdAt: files.createdAt,
          storageKey: files.storageKey,
          bucket: files.bucket,
          userId: users.id,
          userName: users.name,
          userEmail: users.email,
          taskId: tasks.id,
          taskBookingText: tasks.bookingText,
          companyName: companies.name,
        })
        .from(files)
        .leftJoin(users, eq(files.uploadedBy, users.id))
        .leftJoin(tasks, eq(files.taskId, tasks.id))
        .leftJoin(companies, eq(tasks.companyId, companies.id))
        .where(eq(files.uploadedBy, session.user.id))
        .orderBy(desc(files.createdAt));
    }

    // Transform to nested structure
    const filesList = rawFiles.map((file) => ({
      id: file.id,
      fileName: file.fileName,
      mimeType: file.mimeType,
      fileSize: file.fileSize,
      storageKey: file.storageKey,
      status: file.status,
      createdAt: file.createdAt,
      user: {
        id: file.userId!,
        name: file.userName,
        email: file.userEmail!,
      },
      task: file.taskId
        ? {
            id: file.taskId,
            bookingText: file.taskBookingText,
            company: {
              name: file.companyName!,
            },
          }
        : null,
    }));

    return NextResponse.json({ files: filesList });
  } catch (error) {
    console.error("Error fetching files:", error);
    return NextResponse.json(
      { error: "Fehler beim Laden der Dateien" },
      { status: 500 }
    );
  }
}, { auto: true, entityType: "file", skip: () => true });
