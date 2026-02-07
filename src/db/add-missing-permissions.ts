import { config } from "dotenv";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { eq } from "drizzle-orm";
import * as schema from "@/db/schema";
import { permissions, roles, rolePermissions } from "@/db/schema";
import { PERMISSIONS } from "@/lib/permissions-constants";

// Load environment variables
config({ path: ".env" });

async function addMissingPermissions() {
  console.log("🔍 Checking for missing permissions...\n");

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
  }
  const db = drizzle(postgres(connectionString), { schema });

  try {
    // Get all permissions from constants
    const requiredPermissions = Object.values(PERMISSIONS);
    console.log(`📋 Required permissions from constants: ${requiredPermissions.length}`);

    // Get all existing permissions from database
    const existingPermissions = await db.query.permissions.findMany();
    const existingNames = new Set(existingPermissions.map(p => p.name));
    console.log(`📋 Existing permissions in database: ${existingPermissions.length}\n`);

    // Find missing permissions
    const missingPermissions = requiredPermissions.filter(name => !existingNames.has(name));

    if (missingPermissions.length === 0) {
      console.log("✅ All permissions already exist!");
      return;
    }

    console.log(`⚠️  Found ${missingPermissions.length} missing permissions:`);
    missingPermissions.forEach(name => {
      console.log(`   - ${name}`);
    });
    console.log();

    // Determine category for each missing permission
    const getCategoryForPermission = (permName: string): string => {
      if (permName.startsWith("view_") && !permName.includes("_all_")) {
        return "navigation";
      }
      if (permName.includes("task")) return "tasks";
      if (permName.includes("user")) return "users";
      if (permName.includes("client") || permName.includes("company")) return "companies";
      if (permName.includes("role")) return "roles";
      if (permName.includes("permission")) return "permissions";
      if (permName.includes("file")) return "files";
      if (permName.includes("comment")) return "comments";
      if (permName.includes("team")) return "teams";
      if (permName.includes("audit")) return "audit";
      return "general";
    };

    // Create missing permissions
    console.log("➕ Creating missing permissions...");
    const newPermissionsData = missingPermissions.map(name => ({
      name,
      description: name.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
      category: getCategoryForPermission(name),
    }));

    const createdPermissions = await db.insert(permissions)
      .values(newPermissionsData)
      .returning();

    console.log(`✅ Created ${createdPermissions.length} new permissions\n`);

    // Get Admin role
    const adminRole = await db.query.roles.findFirst({
      where: eq(roles.name, "Admin"),
    });

    if (!adminRole) {
      console.log("⚠️  Admin role not found, skipping permission assignment");
      return;
    }

    console.log(`🔗 Assigning new permissions to Admin role...`);

    // Assign new permissions to Admin role
    const adminPermissionData = createdPermissions.map(permission => ({
      roleId: adminRole.id,
      permissionId: permission.id,
    }));

    await db.insert(rolePermissions).values(adminPermissionData);
    console.log(`✅ Assigned ${adminPermissionData.length} permissions to Admin role\n`);

    // Verify total permissions for Admin
    const totalAdminPermissions = await db
      .select()
      .from(rolePermissions)
      .where(eq(rolePermissions.roleId, adminRole.id));

    console.log(`📊 Admin role now has ${totalAdminPermissions.length} total permissions`);

  } catch (error) {
    console.error("❌ Error:", error);
    throw error;
  }
}

// Run the script
addMissingPermissions()
  .then(() => {
    console.log("\n🎉 Script completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 Script failed:", error);
    process.exit(1);
  });
