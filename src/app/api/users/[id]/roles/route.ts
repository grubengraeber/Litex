import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { userRoles, roles, users } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { auth } from "@/lib/auth";

// GET /api/users/[id]/roles - Get roles for a user
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

    const userRolesList = await db
      .select({
        id: roles.id,
        name: roles.name,
        description: roles.description,
        permissions: roles.permissions,
        assignedAt: userRoles.assignedAt,
      })
      .from(userRoles)
      .innerJoin(roles, eq(userRoles.roleId, roles.id))
      .where(eq(userRoles.userId, id));

    return NextResponse.json(userRolesList);
  } catch (error) {
    console.error("Error fetching user roles:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/users/[id]/roles - Assign a role to a user
export async function POST(
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

    const { id: userId } = await params;
    const body = await request.json();
    const { roleId } = body;

    if (!roleId) {
      return NextResponse.json({ error: "roleId is required" }, { status: 400 });
    }

    // Verify user exists
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Verify role exists
    const [role] = await db.select().from(roles).where(eq(roles.id, roleId));
    if (!role) {
      return NextResponse.json({ error: "Role not found" }, { status: 404 });
    }

    // Check if already assigned
    const [existing] = await db
      .select()
      .from(userRoles)
      .where(and(eq(userRoles.userId, userId), eq(userRoles.roleId, roleId)));

    if (existing) {
      return NextResponse.json({ error: "Role already assigned" }, { status: 400 });
    }

    // Assign role
    const [newUserRole] = await db
      .insert(userRoles)
      .values({
        userId,
        roleId,
        assignedBy: session.user.id,
      })
      .returning();

    return NextResponse.json(newUserRole, { status: 201 });
  } catch (error) {
    console.error("Error assigning role:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/users/[id]/roles - Remove a role from a user
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

    const { id: userId } = await params;
    const { searchParams } = new URL(request.url);
    const roleId = searchParams.get("roleId");

    if (!roleId) {
      return NextResponse.json({ error: "roleId is required" }, { status: 400 });
    }

    await db
      .delete(userRoles)
      .where(and(eq(userRoles.userId, userId), eq(userRoles.roleId, roleId)));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error removing role:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
