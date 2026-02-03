import { NextRequest, NextResponse } from "next/server";
import { withPermission } from "@/lib/withPermission";
import { PERMISSIONS } from "@/lib/permissions";
import { db } from "@/db";
import { teams, teamMembers, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

const createTeamSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  leaderId: z.string().optional(),
});

/**
 * GET /api/teams
 * Get all teams with their members
 */
export const GET = withPermission(
  PERMISSIONS.VIEW_TEAM,
  async () => {
    try {
      const allTeams = await db
        .select({
          id: teams.id,
          name: teams.name,
          description: teams.description,
          leaderId: teams.leaderId,
          leaderName: users.name,
          leaderEmail: users.email,
          isActive: teams.isActive,
          createdAt: teams.createdAt,
          updatedAt: teams.updatedAt,
          memberId: teamMembers.id,
          memberUserId: teamMembers.userId,
        })
        .from(teams)
        .leftJoin(users, eq(teams.leaderId, users.id))
        .leftJoin(teamMembers, eq(teams.id, teamMembers.teamId));

      // Group members by team
      const teamsMap = new Map();

      for (const team of allTeams) {
        if (!teamsMap.has(team.id)) {
          teamsMap.set(team.id, {
            id: team.id,
            name: team.name,
            description: team.description,
            leaderId: team.leaderId,
            leader: team.leaderId
              ? {
                  id: team.leaderId,
                  name: team.leaderName,
                  email: team.leaderEmail,
                }
              : null,
            isActive: team.isActive,
            createdAt: team.createdAt,
            updatedAt: team.updatedAt,
            memberCount: 0,
            memberIds: [],
          });
        }

        if (team.memberUserId) {
          teamsMap.get(team.id).memberCount++;
          teamsMap.get(team.id).memberIds.push(team.memberUserId);
        }
      }

      const result = Array.from(teamsMap.values());

      return NextResponse.json(result);
    } catch (error) {
      console.error("Error fetching teams:", error);
      return NextResponse.json(
        { error: "Failed to fetch teams" },
        { status: 500 }
      );
    }
  }
);

/**
 * POST /api/teams
 * Create a new team
 */
export const POST = withPermission(
  PERMISSIONS.MANAGE_USER_ROLES,
  async (req: NextRequest) => {
    try {
      const body = await req.json();
      const data = createTeamSchema.parse(body);

      const [newTeam] = await db
        .insert(teams)
        .values({
          name: data.name,
          description: data.description,
          leaderId: data.leaderId,
        })
        .returning();

      return NextResponse.json(newTeam, { status: 201 });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: "Invalid input", details: error.errors },
          { status: 400 }
        );
      }

      console.error("Error creating team:", error);
      return NextResponse.json(
        { error: "Failed to create team" },
        { status: 500 }
      );
    }
  }
);
