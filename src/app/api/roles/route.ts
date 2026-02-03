import { NextRequest, NextResponse } from "next/server";
import { withPermission } from "@/lib/withPermission";
import { PERMISSIONS } from "@/lib/permissions";
import { db } from "@/db";
import { roles, rolePermissions, permissions } from "@/db/schema";
import { eq } from "drizzle-orm";

/**
 * GET /api/roles
 * Get all roles with their permissions
 */
export const GET = withPermission(
  PERMISSIONS.VIEW_ROLES,
  async () => {
    try {
      const allRoles = await db
        .select({
          id: roles.id,
          name: roles.name,
          description: roles.description,
          isSystem: roles.isSystem,
          createdAt: roles.createdAt,
          updatedAt: roles.updatedAt,
          permissionId: permissions.id,
          permissionName: permissions.name,
          permissionDescription: permissions.description,
          permissionCategory: permissions.category,
        })
        .from(roles)
        .leftJoin(rolePermissions, eq(roles.id, rolePermissions.roleId))
        .leftJoin(
          permissions,
          eq(rolePermissions.permissionId, permissions.id)
        );

      // Group permissions by role
      const rolesMap = new Map();

      for (const role of allRoles) {
        if (!rolesMap.has(role.id)) {
          rolesMap.set(role.id, {
            id: role.id,
            name: role.name,
            description: role.description,
            isSystem: role.isSystem,
            createdAt: role.createdAt,
            updatedAt: role.updatedAt,
            permissions: [],
          });
        }

        if (role.permissionId) {
          rolesMap.get(role.id).permissions.push({
            id: role.permissionId,
            name: role.permissionName,
            description: role.permissionDescription,
            category: role.permissionCategory,
          });
        }
      }

      const result = Array.from(rolesMap.values());

      return NextResponse.json(result);
    } catch (error) {
      console.error("Error fetching roles:", error);
      return NextResponse.json(
        { error: "Failed to fetch roles" },
        { status: 500 }
      );
    }
  }
);

/**
 * POST /api/roles
 * Create a new role
 */
export const POST = withPermission(
  PERMISSIONS.CREATE_ROLES,
  async (req: NextRequest) => {
    try {
      const body = await req.json();
      const { name, description, permissionIds } = body;

      if (!name) {
        return NextResponse.json(
          { error: "Role name is required" },
          { status: 400 }
        );
      }

      // Create the role
      const [newRole] = await db
        .insert(roles)
        .values({
          name,
          description,
          isSystem: false,
        })
        .returning();

      // Assign permissions if provided
      if (permissionIds && permissionIds.length > 0) {
        const permissionValues = permissionIds.map((permissionId: string) => ({
          roleId: newRole.id,
          permissionId,
        }));

        await db.insert(rolePermissions).values(permissionValues);
      }

      return NextResponse.json(newRole, { status: 201 });
    } catch (error) {
      console.error("Error creating role:", error);
      return NextResponse.json(
        { error: "Failed to create role" },
        { status: 500 }
      );
    }
  }
);
