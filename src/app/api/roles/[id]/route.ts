import { NextRequest, NextResponse } from "next/server";
import { withPermission } from "@/lib/withPermission";
import { PERMISSIONS } from "@/lib/permissions";
import { db } from "@/db";
import { roles, rolePermissions } from "@/db/schema";
import { eq } from "drizzle-orm";

interface RouteParams {
  id: string;
}

/**
 * GET /api/roles/[id]
 * Get a specific role with its permissions
 */
export const GET = withPermission<RouteParams>(
  PERMISSIONS.VIEW_ROLES,
  async (req: NextRequest, { params }) => {
    try {
      const { id } = await params;

      const [role] = await db
        .select()
        .from(roles)
        .where(eq(roles.id, id));

      if (!role) {
        return NextResponse.json(
          { error: "Role not found" },
          { status: 404 }
        );
      }

      return NextResponse.json(role);
    } catch (error) {
      console.error("Error fetching role:", error);
      return NextResponse.json(
        { error: "Failed to fetch role" },
        { status: 500 }
      );
    }
  }
);

/**
 * PUT /api/roles/[id]
 * Update a role and its permissions
 */
export const PUT = withPermission<RouteParams>(
  PERMISSIONS.EDIT_ROLES,
  async (req: NextRequest, { params }) => {
    try {
      const { id } = await params;
      const body = await req.json();
      const { name, description, permissionIds } = body;

      // Check if role exists and is not a system role
      const [existingRole] = await db
        .select()
        .from(roles)
        .where(eq(roles.id, id));

      if (!existingRole) {
        return NextResponse.json(
          { error: "Role not found" },
          { status: 404 }
        );
      }

      if (existingRole.isSystem && name !== existingRole.name) {
        return NextResponse.json(
          { error: "Cannot rename system roles" },
          { status: 400 }
        );
      }

      // Update role
      const [updatedRole] = await db
        .update(roles)
        .set({
          name: name || existingRole.name,
          description: description !== undefined ? description : existingRole.description,
          updatedAt: new Date(),
        })
        .where(eq(roles.id, id))
        .returning();

      // Update permissions if provided
      if (permissionIds !== undefined) {
        // Remove all existing permissions
        await db
          .delete(rolePermissions)
          .where(eq(rolePermissions.roleId, id));

        // Add new permissions
        if (permissionIds.length > 0) {
          const permissionValues = permissionIds.map(
            (permissionId: string) => ({
              roleId: id,
              permissionId,
            })
          );

          await db.insert(rolePermissions).values(permissionValues);
        }
      }

      return NextResponse.json(updatedRole);
    } catch (error) {
      console.error("Error updating role:", error);
      return NextResponse.json(
        { error: "Failed to update role" },
        { status: 500 }
      );
    }
  }
);

/**
 * DELETE /api/roles/[id]
 * Delete a role
 */
export const DELETE = withPermission<RouteParams>(
  PERMISSIONS.DELETE_ROLES,
  async (req: NextRequest, { params }) => {
    try {
      const { id } = await params;

      // Check if role exists and is not a system role
      const [existingRole] = await db
        .select()
        .from(roles)
        .where(eq(roles.id, id));

      if (!existingRole) {
        return NextResponse.json(
          { error: "Role not found" },
          { status: 404 }
        );
      }

      if (existingRole.isSystem) {
        return NextResponse.json(
          { error: "Cannot delete system roles" },
          { status: 400 }
        );
      }

      // Delete role (cascade will handle role_permissions and user_roles)
      await db.delete(roles).where(eq(roles.id, id));

      return NextResponse.json(
        { message: "Role deleted successfully" },
        { status: 200 }
      );
    } catch (error) {
      console.error("Error deleting role:", error);
      return NextResponse.json(
        { error: "Failed to delete role" },
        { status: 500 }
      );
    }
  }
);
