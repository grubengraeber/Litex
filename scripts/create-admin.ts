#!/usr/bin/env tsx

import { config } from "dotenv";
config();

import { db } from "../src/db";
import { users, roles, userRoles } from "../src/db/schema";
import { eq } from "drizzle-orm";

async function createAdminUser() {
  console.log("Creating admin user...");

  try {
    // Check if user already exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, "admin@lexoffice.at"))
      .limit(1);

    let userId: string;

    if (existingUser.length > 0) {
      userId = existingUser[0].id;
      console.log("✓ Admin user already exists:", userId);
    } else {
      // Create admin user
      const [newUser] = await db
        .insert(users)
        .values({
          name: "Admin User",
          email: "admin@lexoffice.at",
          emailVerified: new Date(),
          role: "employee",
          status: "active",
        })
        .returning();

      userId = newUser.id;
      console.log("✓ Created admin user:", userId);
    }

    // Get Administrator role
    const [adminRole] = await db
      .select()
      .from(roles)
      .where(eq(roles.name, "Administrator"))
      .limit(1);

    if (!adminRole) {
      console.error("✗ Administrator role not found! Run migration first.");
      process.exit(1);
    }

    // Check if user already has admin role
    const existingRoleAssignment = await db
      .select()
      .from(userRoles)
      .where(eq(userRoles.userId, userId))
      .where(eq(userRoles.roleId, adminRole.id))
      .limit(1);

    if (existingRoleAssignment.length > 0) {
      console.log("✓ User already has Administrator role");
    } else {
      // Assign Administrator role
      await db.insert(userRoles).values({
        userId: userId,
        roleId: adminRole.id,
      });
      console.log("✓ Assigned Administrator role to user");
    }

    console.log("\n✅ Admin user ready!");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("📧 Email: admin@lexoffice.at");
    console.log("🔐 Use magic link authentication");
    console.log("🛡️  Role: Administrator (all permissions)");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    process.exit(0);
  } catch (error) {
    console.error("Error creating admin user:", error);
    process.exit(1);
  }
}

createAdminUser();
