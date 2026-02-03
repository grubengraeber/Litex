import { config } from "dotenv";
config();

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { sql } from "drizzle-orm";
import { readFileSync } from "fs";
import { join } from "path";

async function applyMigration() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    console.error("DATABASE_URL environment variable is not set");
    process.exit(1);
  }

  const client = postgres(connectionString);
  const db = drizzle(client);

  try {
    const migrationFile = process.argv[2] || "0005_add_user_external_ids.sql";
    const migrationPath = join(process.cwd(), "drizzle", migrationFile);
    const migrationSQL = readFileSync(migrationPath, "utf-8");

    console.log("Applying migration...");
    console.log(migrationSQL);

    await db.execute(sql.raw(migrationSQL));

    console.log("Migration applied successfully!");
    await client.end();
    process.exit(0);
  } catch (error) {
    console.error("Error applying migration:", error);
    await client.end();
    process.exit(1);
  }
}

applyMigration();
