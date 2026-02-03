import { NextRequest, NextResponse } from "next/server";
import { withPermission } from "@/lib/withPermission";
import { PERMISSIONS } from "@/lib/permissions";
import { db } from "@/db";
import { userRoles, roles } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { auth } from "@/lib/auth";

interface RouteParams {
  id: string;
}

/**
 * GET /api/users/[id]/roles
 * Get all roles assigned to a user
 */
export const GET = withPermission<RouteParams>(
  PERMISSIONS.VIEW_ALL_USERS,
  async (req: NextRequest, { params }) => {
    try {
      const { id } = await params;

      const assignedRoles = await db
        .select({
          id: roles.id,
          name: roles.name,
          description: roles.description,
          isSystem: roles.isSystem,
          assignedAt: userRoles.assignedAt,
        })
        .from(userRoles)
        .innerJoin(roles, eq(userRoles.roleId, roles.id))
        .where(eq(userRoles.userId, id));

      return NextResponse.json(assignedRoles);
    } catch (error) {
      console.error("Error fetching user roles:", error);
      return NextResponse.json(
        { error: "Failed to fetch user roles" },
        { status: 500 }
      );
    }
  }
);

/**
 * POST /api/users/[id]/roles
 * Assign a role to a user
 */
export const POST = withPermission<RouteParams>(
  PERMISSIONS.MANAGE_USER_ROLES,
  async (req: NextRequest, { params }) => {
    try {
      const { id: userId } = await params;
      const body = await req.json();
      const { roleId } = body;

      if (!roleId) {
        return NextResponse.json(
          { error: "Role ID is required" },
          { status: 400 }
        );
      }

      // Get current user
      const session = await auth();
      const currentUserId = session?.user?.id;

      // Check if role exists
      const [role] = await db
        .select()
        .from(roles)
        .where(eq(roles.id, roleId));

      if (!role) {
        return NextResponse.json(
          { error: "Role not found" },
          { status: 404 }
        );
      }

      // Check if user already has this role
      const existing = await db
        .select()
        .from(userRoles)
        .where(
          and(
            eq(userRoles.userId, userId),
            eq(userRoles.roleId, roleId)
          )
        );

      if (existing.length > 0) {
        return NextResponse.json(
          { error: "User already has this role" },
          { status: 400 }
        );
      }

      // Assign role
      const [newUserRole] = await db
        .insert(userRoles)
        .values({
          userId,
          roleId,
          assignedBy: currentUserId,
        })
        .returning();

      return NextResponse.json(newUserRole, { status: 201 });
    } catch (error) {
      console.error("Error assigning role to user:", error);
      return NextResponse.json(
        { error: "Failed to assign role" },
        { status: 500 }
      );
    }
  }
);

/**
 * DELETE /api/users/[id]/roles
 * Remove a role from a user
 */
export const DELETE = withPermission<RouteParams>(
  PERMISSIONS.MANAGE_USER_ROLES,
  async (req: NextRequest, { params }) => {
    try {
      const { id: userId } = await params;
      const { searchParams } = new URL(req.url);
      const roleId = searchParams.get("roleId");

      if (!roleId) {
        return NextResponse.json(
          { error: "Role ID is required" },
          { status: 400 }
        );
      }

      // Remove role assignment
      const result = await db
        .delete(userRoles)
        .where(
          and(
            eq(userRoles.userId, userId),
            eq(userRoles.roleId, roleId)
          )
        )
        .returning();

      if (result.length === 0) {
        return NextResponse.json(
          { error: "Role assignment not found" },
          { status: 404 }
        );
      }

      return NextResponse.json(
        { message: "Role removed successfully" },
        { status: 200 }
      );
    } catch (error) {
      console.error("Error removing role from user:", error);
      return NextResponse.json(
        { error: "Failed to remove role" },
        { status: 500 }
      );
    }
  }
);
