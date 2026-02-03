import { NextResponse } from "next/server";
import { withPermission } from "@/lib/withPermission";
import { PERMISSIONS } from "@/lib/permissions";
import { db } from "@/db";
import { permissions, rolePermissions, roles } from "@/db/schema";
import { eq } from "drizzle-orm";

/**
 * GET /api/permissions
 * Get all permissions with the roles that have them
 */
export const GET = withPermission(
  PERMISSIONS.VIEW_PERMISSIONS,
  async () => {
    try {
      const allPermissions = await db
        .select({
          id: permissions.id,
          name: permissions.name,
          description: permissions.description,
          category: permissions.category,
          createdAt: permissions.createdAt,
          roleId: roles.id,
          roleName: roles.name,
        })
        .from(permissions)
        .leftJoin(
          rolePermissions,
          eq(permissions.id, rolePermissions.permissionId)
        )
        .leftJoin(roles, eq(rolePermissions.roleId, roles.id));

      // Group roles by permission
      const permissionsMap = new Map();

      for (const perm of allPermissions) {
        if (!permissionsMap.has(perm.id)) {
          permissionsMap.set(perm.id, {
            id: perm.id,
            name: perm.name,
            description: perm.description,
            category: perm.category,
            createdAt: perm.createdAt,
            roles: [],
          });
        }

        if (perm.roleId) {
          permissionsMap.get(perm.id).roles.push({
            id: perm.roleId,
            name: perm.roleName,
          });
        }
      }

      const result = Array.from(permissionsMap.values());

      // Group by category for easier display
      const categorized = result.reduce((acc: Record<string, typeof result>, perm) => {
        const category = perm.category || "other";
        if (!acc[category]) {
          acc[category] = [];
        }
        acc[category].push(perm);
        return acc;
      }, {});

      return NextResponse.json({
        permissions: result,
        categorized,
      });
    } catch (error) {
      console.error("Error fetching permissions:", error);
      return NextResponse.json(
        { error: "Failed to fetch permissions" },
        { status: 500 }
      );
    }
  }
);
