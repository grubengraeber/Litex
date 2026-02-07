import { config } from "dotenv";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { eq } from "drizzle-orm";
import * as schema from "@/db/schema";
import { users, roles, permissions, rolePermissions, userRoles } from "@/db/schema";

// Load environment variables
config({ path: ".env" });

async function grantAllAdminPermissions() {
  console.log("🔐 Granting all permissions to admin users...\n");

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
  }
  const db = drizzle(postgres(connectionString), { schema });

  try {
    // 1. Get all admin users (users with role 'admin')
    const adminUsers = await db.query.users.findMany({
      where: eq(users.role, "admin"),
    });

    console.log(`Found ${adminUsers.length} admin user(s):`);
    adminUsers.forEach(user => {
      console.log(`  - ${user.name} (${user.email}) - ID: ${user.id}`);
    });
    console.log();

    // 2. Get or create Admin role in roles table
    let adminRole = await db.query.roles.findFirst({
      where: eq(roles.name, "Admin"),
    });

    if (!adminRole) {
      console.log("⚠️  Admin role not found, creating it...");
      const [newRole] = await db.insert(roles).values({
        name: "Admin",
        description: "Full system access with all permissions",
        isSystem: true,
      }).returning();
      adminRole = newRole;
      console.log("✅ Admin role created");
    } else {
      console.log(`✅ Admin role found: ${adminRole.id}`);
    }
    console.log();

    // 3. Get all permissions
    const allPermissions = await db.query.permissions.findMany();
    console.log(`📋 Found ${allPermissions.length} total permissions`);
    console.log();

    // 4. Assign ALL permissions to Admin role
    console.log("🔗 Assigning all permissions to Admin role...");

    // First, delete existing role permissions for Admin
    await db.delete(rolePermissions).where(eq(rolePermissions.roleId, adminRole.id));
    console.log("  - Cleared existing permissions");

    // Insert all permissions
    const rolePermissionData = allPermissions.map(permission => ({
      roleId: adminRole.id,
      permissionId: permission.id,
    }));

    if (rolePermissionData.length > 0) {
      await db.insert(rolePermissions).values(rolePermissionData);
      console.log(`  - Assigned ${rolePermissionData.length} permissions to Admin role`);
    }
    console.log();

    // 5. Assign Admin role to all admin users
    console.log("👥 Assigning Admin role to admin users...");

    for (const user of adminUsers) {
      // Check if user already has Admin role
      const existingUserRole = await db.query.userRoles.findFirst({
        where: (userRoles, { and, eq }) =>
          and(
            eq(userRoles.userId, user.id),
            eq(userRoles.roleId, adminRole.id)
          ),
      });

      if (!existingUserRole) {
        await db.insert(userRoles).values({
          userId: user.id,
          roleId: adminRole.id,
          assignedBy: null,
        });
        console.log(`  ✅ Assigned Admin role to ${user.email}`);
      } else {
        console.log(`  ℹ️  ${user.email} already has Admin role`);
      }

      // Also update the user.role field to 'admin'
      await db.update(users)
        .set({ role: "admin", status: "active" })
        .where(eq(users.id, user.id));
    }
    console.log();

    // 6. Verify permissions
    console.log("🔍 Verifying admin permissions...");
    for (const user of adminUsers) {
      const userPermissions = await db
        .select({
          permissionName: permissions.name,
        })
        .from(userRoles)
        .innerJoin(roles, eq(userRoles.roleId, roles.id))
        .innerJoin(rolePermissions, eq(roles.id, rolePermissions.roleId))
        .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
        .where(eq(userRoles.userId, user.id));

      console.log(`\n  ${user.email}:`);
      console.log(`    Total permissions: ${userPermissions.length}`);

      if (userPermissions.length === allPermissions.length) {
        console.log(`    ✅ Has all ${allPermissions.length} permissions`);
      } else {
        console.log(`    ⚠️  Missing ${allPermissions.length - userPermissions.length} permissions`);
      }
    }

    console.log("\n🎉 All admin users now have full permissions!");

  } catch (error) {
    console.error("❌ Error:", error);
    throw error;
  }
}

// Run the script
grantAllAdminPermissions()
  .then(() => {
    console.log("\n✅ Script completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 Script failed:", error);
    process.exit(1);
  });
