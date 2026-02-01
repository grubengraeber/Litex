import { NextResponse } from "next/server";
import { db } from "@/db";
import { userRoles, roles } from "@/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { mergePermissions } from "@/lib/permissions";
import type { RolePermissions } from "@/db/schema";

// GET /api/auth/permissions - Get current user's permissions
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ 
        permissions: {},
        roles: []
      });
    }

    if (!db) {
      return NextResponse.json({ permissions: {}, roles: [] });
    }

    // Get all roles for the user
    const userRolesList = await db
      .select({
        id: roles.id,
        name: roles.name,
        permissions: roles.permissions,
      })
      .from(userRoles)
      .innerJoin(roles, eq(userRoles.roleId, roles.id))
      .where(eq(userRoles.userId, session.user.id));

    // Merge all permissions from all roles
    const allPermissions = userRolesList.map(r => r.permissions as RolePermissions);
    const mergedPermissions = mergePermissions(allPermissions);

    return NextResponse.json({
      permissions: mergedPermissions,
      roles: userRolesList.map(r => ({ id: r.id, name: r.name })),
    });
  } catch (error) {
    console.error("Error fetching permissions:", error);
    return NextResponse.json({ 
      permissions: {},
      roles: []
    });
  }
}
