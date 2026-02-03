import { NextRequest, NextResponse } from "next/server";
import { withPermission } from "@/lib/withPermission";
import { PERMISSIONS } from "@/lib/permissions";
import { db } from "@/db";
import { teamMembers, users } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { withAuditLog } from "@/lib/audit/withAuditLog";

interface RouteParams {
  id: string;
}

/**
 * GET /api/teams/[id]/members
 * Get all members of a team
 */
export const GET = withAuditLog<RouteParams>(withPermission<Promise<RouteParams>>(
  PERMISSIONS.VIEW_TEAM,
  async (req: NextRequest, { params }) => {
    try {
      const { id } = await params;

      const members = await db
        .select({
          id: teamMembers.id,
          userId: users.id,
          name: users.name,
          email: users.email,
          image: users.image,
          status: users.status,
          joinedAt: teamMembers.joinedAt,
        })
        .from(teamMembers)
        .innerJoin(users, eq(teamMembers.userId, users.id))
        .where(eq(teamMembers.teamId, id));

      return NextResponse.json(members);
    } catch (error) {
      console.error("Error fetching team members:", error);
      return NextResponse.json(
        { error: "Failed to fetch team members" },
        { status: 500 }
      );
    }
  }
), { auto: true, entityType: "team-member", skip: () => true });

/**
 * POST /api/teams/[id]/members
 * Add a user to a team
 */
export const POST = withAuditLog<RouteParams>(withPermission<Promise<RouteParams>>(
  PERMISSIONS.MANAGE_USER_ROLES,
  async (req: NextRequest, { params }) => {
    try {
      const { id: teamId } = await params;
      const body = await req.json();
      const { userId } = body;

      if (!userId) {
        return NextResponse.json(
          { error: "User ID is required" },
          { status: 400 }
        );
      }

      // Check if already a member
      const existing = await db
        .select()
        .from(teamMembers)
        .where(
          and(
            eq(teamMembers.teamId, teamId),
            eq(teamMembers.userId, userId)
          )
        );

      if (existing.length > 0) {
        return NextResponse.json(
          { error: "User is already a member of this team" },
          { status: 400 }
        );
      }

      const [newMember] = await db
        .insert(teamMembers)
        .values({
          teamId,
          userId,
        })
        .returning();

      return NextResponse.json(newMember, { status: 201 });
    } catch (error) {
      console.error("Error adding team member:", error);
      return NextResponse.json(
        { error: "Failed to add team member" },
        { status: 500 }
      );
    }
  }
), { auto: true, entityType: "team-member" });

/**
 * DELETE /api/teams/[id]/members
 * Remove a user from a team
 */
export const DELETE = withAuditLog<RouteParams>(withPermission<Promise<RouteParams>>(
  PERMISSIONS.MANAGE_USER_ROLES,
  async (req: NextRequest, { params }) => {
    try {
      const { id: teamId } = await params;
      const { searchParams } = new URL(req.url);
      const userId = searchParams.get("userId");

      if (!userId) {
        return NextResponse.json(
          { error: "User ID is required" },
          { status: 400 }
        );
      }

      const result = await db
        .delete(teamMembers)
        .where(
          and(
            eq(teamMembers.teamId, teamId),
            eq(teamMembers.userId, userId)
          )
        )
        .returning();

      if (result.length === 0) {
        return NextResponse.json(
          { error: "Team member not found" },
          { status: 404 }
        );
      }

      return NextResponse.json(
        { message: "Member removed successfully" },
        { status: 200 }
      );
    } catch (error) {
      console.error("Error removing team member:", error);
      return NextResponse.json(
        { error: "Failed to remove team member" },
        { status: 500 }
      );
    }
  }
), { auto: true, entityType: "team-member" });
