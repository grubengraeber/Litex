import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getUserById, updateUser } from "@/db/queries";
import { z } from "zod";
import { userHasPermission, PERMISSIONS } from "@/lib/permissions";

const updateUserSchema = z.object({
  name: z.string().optional(),
  role: z.enum(["customer", "employee"]).optional(),
  companyId: z.string().uuid().nullable().optional(),
  status: z.enum(["pending", "active", "disabled"]).optional(),
});

// GET /api/users/[id] - Get user by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const user = await getUserById(id);

    if (!user) {
      return NextResponse.json(
        { error: "Benutzer nicht gefunden" },
        { status: 404 }
      );
    }

    // Users can view their own profile
    // Employees with permission can view all users
    const canViewAllUsers = await userHasPermission(
      session.user.id,
      PERMISSIONS.VIEW_ALL_USERS
    );

    if (id !== session.user.id && !canViewAllUsers) {
      return NextResponse.json(
        { error: "Kein Zugriff" },
        { status: 403 }
      );
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json(
      { error: "Fehler beim Laden des Benutzers" },
      { status: 500 }
    );
  }
}

// PATCH /api/users/[id] - Update user
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const data = updateUserSchema.parse(body);

    // Users can update their own name
    if (id === session.user.id) {
      // Only allow updating name for own profile
      const user = await updateUser(id, { name: data.name });
      return NextResponse.json({ user });
    }

    // Check permission to edit other users
    const canEditUsers = await userHasPermission(
      session.user.id,
      PERMISSIONS.EDIT_USERS
    );

    if (!canEditUsers) {
      return NextResponse.json(
        { error: "Keine Berechtigung" },
        { status: 403 }
      );
    }

    const user = await updateUser(id, data);

    if (!user) {
      return NextResponse.json(
        { error: "Benutzer nicht gefunden" },
        { status: 404 }
      );
    }

    return NextResponse.json({ user });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Ungültige Eingabe", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error updating user:", error);
    return NextResponse.json(
      { error: "Fehler beim Aktualisieren des Benutzers" },
      { status: 500 }
    );
  }
}

// DELETE /api/users/[id] - Delete user
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    // Check permission
    const canDelete = await userHasPermission(
      session.user.id,
      PERMISSIONS.DELETE_USERS
    );

    if (!canDelete) {
      return NextResponse.json(
        { error: "Keine Berechtigung zum Löschen von Benutzern" },
        { status: 403 }
      );
    }

    // Prevent self-deletion
    if (id === session.user.id) {
      return NextResponse.json(
        { error: "Sie können sich nicht selbst löschen" },
        { status: 400 }
      );
    }

    // Delete user (cascade will delete related records)
    const { db } = await import("@/db");
    const { users } = await import("@/db/schema");
    const { eq } = await import("drizzle-orm");

    await db.delete(users).where(eq(users.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json(
      { error: "Fehler beim Löschen des Benutzers" },
      { status: 500 }
    );
  }
}
