import { config } from "dotenv";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { eq } from "drizzle-orm";
import * as schema from "@/db/schema";
import { users, roles, userRoles } from "@/db/schema";

// Load environment variables
config({ path: ".env" });

async function assignAdminRole() {
  const userId = "623613cb-74af-46a9-866d-fe63d9e678c2";

  console.log(`🔍 Assigning admin role to user ${userId}...`);

  // Initialize database connection
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
  }
  const db = drizzle(postgres(connectionString), { schema });

  try {
    // Check if user exists
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!user) {
      console.error(`❌ User ${userId} not found`);
      return;
    }

    console.log(`✅ Found user: ${user.name} (${user.email})`);

    // Get Admin role
    const adminRole = await db.query.roles.findFirst({
      where: eq(roles.name, "Admin"),
    });

    if (!adminRole) {
      console.error("❌ Admin role not found. Please run seed first.");
      return;
    }

    console.log(`✅ Found Admin role: ${adminRole.id}`);

    // Check if user already has this role
    const existingUserRole = await db.query.userRoles.findFirst({
      where: (userRoles, { and, eq }) =>
        and(
          eq(userRoles.userId, userId),
          eq(userRoles.roleId, adminRole.id)
        ),
    });

    if (existingUserRole) {
      console.log("✅ User already has Admin role");
      return;
    }

    // Update user.role field to admin
    await db
      .update(users)
      .set({ role: "admin", status: "active" })
      .where(eq(users.id, userId));

    console.log("✅ Updated user.role to admin");

    // Assign Admin role via userRoles table
    await db.insert(userRoles).values({
      userId: userId,
      roleId: adminRole.id,
      assignedBy: null, // Self-assigned
    });

    console.log("✅ Assigned Admin role to user via userRoles table");
    console.log("\n🎉 Admin role assignment complete!");
  } catch (error) {
    console.error("❌ Assignment failed:", error);
    throw error;
  }
}

// Run assignment
assignAdminRole()
  .then(() => {
    console.log("\n✅ Script complete!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 Script error:", error);
    process.exit(1);
  });
