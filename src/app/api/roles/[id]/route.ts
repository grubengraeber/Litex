import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { roles, userRoles } from "@/db/schema";
import { eq, count } from "drizzle-orm";
import { auth } from "@/lib/auth";

// GET /api/roles/[id] - Get a single role
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!db) {
      return NextResponse.json({ error: "Database not configured" }, { status: 500 });
    }

    const { id } = await params;

    const [role] = await db
      .select({
        id: roles.id,
        name: roles.name,
        description: roles.description,
        permissions: roles.permissions,
        isSystem: roles.isSystem,
        createdAt: roles.createdAt,
        userCount: count(userRoles.id),
      })
      .from(roles)
      .leftJoin(userRoles, eq(roles.id, userRoles.roleId))
      .where(eq(roles.id, id))
      .groupBy(roles.id);

    if (!role) {
      return NextResponse.json({ error: "Role not found" }, { status: 404 });
    }

    return NextResponse.json(role);
  } catch (error) {
    console.error("Error fetching role:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PUT /api/roles/[id] - Update a role
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!db) {
      return NextResponse.json({ error: "Database not configured" }, { status: 500 });
    }

    const { id } = await params;
    const body = await request.json();
    const { name, description, permissions } = body;

    // Check if role exists
    const [existingRole] = await db
      .select()
      .from(roles)
      .where(eq(roles.id, id));

    if (!existingRole) {
      return NextResponse.json({ error: "Role not found" }, { status: 404 });
    }

    // Don't allow renaming system roles
    if (existingRole.isSystem && name && name !== existingRole.name) {
      return NextResponse.json(
        { error: "Cannot rename system roles" },
        { status: 400 }
      );
    }

    const [updatedRole] = await db
      .update(roles)
      .set({
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(permissions && { permissions }),
        updatedAt: new Date(),
      })
      .where(eq(roles.id, id))
      .returning();

    return NextResponse.json(updatedRole);
  } catch (error) {
    console.error("Error updating role:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/roles/[id] - Delete a role
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!db) {
      return NextResponse.json({ error: "Database not configured" }, { status: 500 });
    }

    const { id } = await params;

    // Check if role exists and is not a system role
    const [existingRole] = await db
      .select()
      .from(roles)
      .where(eq(roles.id, id));

    if (!existingRole) {
      return NextResponse.json({ error: "Role not found" }, { status: 404 });
    }

    if (existingRole.isSystem) {
      return NextResponse.json(
        { error: "Cannot delete system roles" },
        { status: 400 }
      );
    }

    // Delete role (cascade will handle user_roles)
    await db.delete(roles).where(eq(roles.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting role:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
