import { NextResponse } from "next/server";
import { withPermission } from "@/lib/withPermission";
import { PERMISSIONS } from "@/lib/permissions";
import { db } from "@/db";
import { users, roles, userRoles, companies } from "@/db/schema";
import { eq } from "drizzle-orm";

/**
 * GET /api/team
 * Get all law firm employees (team members)
 */
export const GET = withPermission(
  PERMISSIONS.VIEW_TEAM,
  async () => {
    try {
      // Get all employees from @lexoffice.at domain or those with employee/admin roles
      const teamMembers = await db
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
          image: users.image,
          status: users.status,
          companyId: users.companyId,
          companyName: companies.name,
          createdAt: users.createdAt,
          roles: roles.name,
          roleId: roles.id,
          roleDescription: roles.description,
        })
        .from(users)
        .leftJoin(userRoles, eq(users.id, userRoles.userId))
        .leftJoin(roles, eq(userRoles.roleId, roles.id))
        .leftJoin(companies, eq(users.companyId, companies.id))
        .where(eq(users.role, "employee"));

      // Group roles by user
      const teamMembersMap = new Map();

      for (const member of teamMembers) {
        if (!teamMembersMap.has(member.id)) {
          teamMembersMap.set(member.id, {
            id: member.id,
            name: member.name,
            email: member.email,
            image: member.image,
            status: member.status,
            companyId: member.companyId,
            companyName: member.companyName,
            createdAt: member.createdAt,
            roles: [],
          });
        }

        if (member.roles) {
          teamMembersMap.get(member.id).roles.push({
            id: member.roleId,
            name: member.roles,
            description: member.roleDescription,
          });
        }
      }

      const result = Array.from(teamMembersMap.values());

      return NextResponse.json(result);
    } catch (error) {
      console.error("Error fetching team members:", error);
      return NextResponse.json(
        { error: "Failed to fetch team members" },
        { status: 500 }
      );
    }
  }
);
