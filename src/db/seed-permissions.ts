import { db } from "@/db";
import { permissions, rolePermissions, roles } from "@/db/schema";
import { eq } from "drizzle-orm";

const newPermissions = [
  {
    name: "view_chats",
    description: "Zugriff auf den Chat-Bereich",
    category: "navigation",
  },
  {
    name: "view_files",
    description: "Zugriff auf den Dateien-Bereich",
    category: "navigation",
  },
];

async function seedPermissions() {
  if (!db) throw new Error("Database not configured");

  for (const perm of newPermissions) {
    const existing = await db.query.permissions.findFirst({
      where: eq(permissions.name, perm.name),
    });

    if (!existing) {
      const [created] = await db.insert(permissions).values(perm).returning();
      console.log(`Created permission: ${perm.name} (${created.id})`);

      // Grant to admin and employee roles
      const adminRole = await db.query.roles.findFirst({
        where: eq(roles.name, "admin"),
      });
      const employeeRole = await db.query.roles.findFirst({
        where: eq(roles.name, "employee"),
      });

      if (adminRole) {
        await db.insert(rolePermissions).values({
          roleId: adminRole.id,
          permissionId: created.id,
        });
        console.log(`Granted ${perm.name} to admin role`);
      }

      if (employeeRole) {
        await db.insert(rolePermissions).values({
          roleId: employeeRole.id,
          permissionId: created.id,
        });
        console.log(`Granted ${perm.name} to employee role`);
      }
    } else {
      console.log(`Permission ${perm.name} already exists`);
    }
  }

  console.log("Done seeding permissions");
  process.exit(0);
}

seedPermissions().catch(console.error);
