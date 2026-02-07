import { config } from "dotenv";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { eq } from "drizzle-orm";
import * as schema from "@/db/schema";
import { users, roles, userRoles, permissions, rolePermissions } from "@/db/schema";

// Load environment variables
config({ path: ".env" });

async function debugPermissions() {
  const userId = "623613cb-74af-46a9-866d-fe63d9e678c2";

  console.log(`🔍 Debugging permissions for user ${userId}...\n`);

  // Initialize database connection
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
  }
  const db = drizzle(postgres(connectionString), { schema });

  try {
    // Get user info
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!user) {
      console.error(`❌ User ${userId} not found`);
      return;
    }

    console.log("👤 User Info:");
    console.log(`   Name: ${user.name}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Role (old field): ${user.role}`);
    console.log(`   Status: ${user.status}`);
    console.log();

    // Get user roles from userRoles table
    const userRolesList = await db
      .select({
        roleId: roles.id,
        roleName: roles.name,
        roleDescription: roles.description,
      })
      .from(userRoles)
      .innerJoin(roles, eq(userRoles.roleId, roles.id))
      .where(eq(userRoles.userId, userId));

    console.log("🎭 User Roles (from userRoles table):");
    if (userRolesList.length === 0) {
      console.log("   ❌ No roles assigned!");
    } else {
      userRolesList.forEach((role) => {
        console.log(`   ✅ ${role.roleName} (${role.roleId})`);
      });
    }
    console.log();

    // Get user permissions
    const userPermissions = await db
      .select({
        permissionName: permissions.name,
        permissionDescription: permissions.description,
        permissionCategory: permissions.category,
      })
      .from(userRoles)
      .innerJoin(roles, eq(userRoles.roleId, roles.id))
      .innerJoin(rolePermissions, eq(roles.id, rolePermissions.roleId))
      .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
      .where(eq(userRoles.userId, userId));

    console.log("🔑 User Permissions:");
    if (userPermissions.length === 0) {
      console.log("   ❌ No permissions found!");
    } else {
      console.log(`   Total: ${userPermissions.length} permissions`);

      // Group by category
      const byCategory = userPermissions.reduce((acc, perm) => {
        if (!acc[perm.permissionCategory]) {
          acc[perm.permissionCategory] = [];
        }
        acc[perm.permissionCategory].push(perm.permissionName);
        return acc;
      }, {} as Record<string, string[]>);

      Object.entries(byCategory).forEach(([category, perms]) => {
        console.log(`\n   ${category.toUpperCase()}:`);
        perms.forEach((perm) => {
          console.log(`      - ${perm}`);
        });
      });
    }
    console.log();

    // Check specific permission
    const hasViewTasks = userPermissions.some((p) => p.permissionName === "view_tasks");
    console.log(`🔍 Has "view_tasks" permission: ${hasViewTasks ? "✅ YES" : "❌ NO"}`);

  } catch (error) {
    console.error("❌ Debug failed:", error);
    throw error;
  }
}

// Run debug
debugPermissions()
  .then(() => {
    console.log("\n✅ Debug complete!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 Debug error:", error);
    process.exit(1);
  });
