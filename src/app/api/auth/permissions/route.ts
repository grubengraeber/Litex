import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getUserPermissions } from "@/lib/permissions";

/**
 * GET /api/auth/permissions
 * Returns the permissions for the currently logged-in user
 */
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Nicht authentifiziert" },
        { status: 401 }
      );
    }

    const permissions = await getUserPermissions(session.user.id);

    return NextResponse.json({
      permissions: Array.from(permissions),
    });
  } catch (error) {
    console.error("Error fetching user permissions:", error);
    return NextResponse.json(
      { error: "Fehler beim Laden der Berechtigungen" },
      { status: 500 }
    );
  }
}
