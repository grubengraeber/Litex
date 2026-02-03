import { NextRequest, NextResponse } from "next/server";
import { withPermission } from "@/lib/withPermission";
import { PERMISSIONS } from "@/lib/permissions";
import { getAuditLogs } from "@/lib/audit/audit-service";

/**
 * GET /api/audit-logs
 * Get audit logs with optional filtering
 * Requires VIEW_AUDIT_LOGS permission
 */
export const GET = withPermission(
  PERMISSIONS.VIEW_AUDIT_LOGS,
  async (req: NextRequest) => {
    try {
      const { searchParams } = new URL(req.url);

      const filters = {
        userId: searchParams.get("userId") || undefined,
        entityType: searchParams.get("entityType") || undefined,
        entityId: searchParams.get("entityId") || undefined,
        action: searchParams.get("action") || undefined,
        startDate: searchParams.get("startDate")
          ? new Date(searchParams.get("startDate")!)
          : undefined,
        endDate: searchParams.get("endDate")
          ? new Date(searchParams.get("endDate")!)
          : undefined,
        limit: searchParams.get("limit")
          ? parseInt(searchParams.get("limit")!)
          : 50,
        offset: searchParams.get("offset")
          ? parseInt(searchParams.get("offset")!)
          : 0,
      };

      const result = await getAuditLogs(filters);

      return NextResponse.json(result);
    } catch (error) {
      console.error("Error fetching audit logs:", error);
      return NextResponse.json(
        { error: "Failed to fetch audit logs" },
        { status: 500 }
      );
    }
  }
);
