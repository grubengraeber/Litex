import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getTasksWithoutComments } from "@/db/queries";
import { withAuditLog } from "@/lib/audit/withAuditLog";

// GET /api/tasks/without-comments - Get tasks without any comments
export const GET = withAuditLog(async (request: NextRequest) => {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : undefined;

  try {
    const tasks = await getTasksWithoutComments(
      session.user.id,
      session.user.role || "customer",
      session.user.companyId || null,
      { limit }
    );

    return NextResponse.json({ tasks });
  } catch (error) {
    console.error("Error fetching tasks without comments:", error);
    return NextResponse.json(
      { error: "Fehler beim Laden der Aufgaben" },
      { status: 500 }
    );
  }
}, {
  action: "READ",
  entityType: "task",
  skip: () => true,
});
