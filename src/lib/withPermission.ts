import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { userHasPermission, PermissionName } from "@/lib/permissions";

/**
 * Middleware to protect API routes with permission checks
 *
 * Usage:
 * export const GET = withPermission("view_tasks", async (req, { params }) => {
 *   // Your route handler code
 * });
 */
export function withPermission<T = unknown>(
  permission: PermissionName,
  handler: (
    req: NextRequest,
    context: { params: T }
  ) => Promise<NextResponse>
) {
  return async (req: NextRequest, context: { params: T }) => {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const hasPermission = await userHasPermission(
      session.user.id,
      permission
    );

    if (!hasPermission) {
      return NextResponse.json(
        { error: "Forbidden: Insufficient permissions" },
        { status: 403 }
      );
    }

    return handler(req, context);
  };
}

/**
 * Middleware to protect API routes with multiple permission checks (ANY)
 */
export function withAnyPermission<T = unknown>(
  permissions: PermissionName[],
  handler: (
    req: NextRequest,
    context: { params: T }
  ) => Promise<NextResponse>
) {
  return async (req: NextRequest, context: { params: T }) => {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const hasAnyPermission = await Promise.all(
      permissions.map((p) => userHasPermission(session.user.id, p))
    ).then((results) => results.some((r) => r));

    if (!hasAnyPermission) {
      return NextResponse.json(
        { error: "Forbidden: Insufficient permissions" },
        { status: 403 }
      );
    }

    return handler(req, context);
  };
}

/**
 * Middleware to check authentication only (no permission check)
 */
export function withAuth<T = unknown>(
  handler: (
    req: NextRequest,
    context: { params: T }
  ) => Promise<NextResponse>
) {
  return async (req: NextRequest, context: { params: T }) => {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    return handler(req, context);
  };
}

/**
 * Get the current user session or throw an error
 */
export async function requireAuth() {
  const session = await auth();

  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  return session;
}
