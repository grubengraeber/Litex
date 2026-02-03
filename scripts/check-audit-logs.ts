import { config } from "dotenv";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { auditLogs } from "@/db/schema";

config({ path: ".env" });

async function checkAuditLogs() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
  }

  const client = postgres(connectionString);
  const db = drizzle(client);

  try {
    const logs = await db.select().from(auditLogs).limit(10);
    console.log(`\n📊 Found ${logs.length} audit logs in database\n`);

    if (logs.length > 0) {
      console.log("Recent logs:");
      logs.forEach((log, i) => {
        console.log(`\n${i + 1}. ${log.action} on ${log.entityType}`);
        console.log(`   User: ${log.userEmail}`);
        console.log(`   Status: ${log.status}`);
        console.log(`   Time: ${log.createdAt}`);
      });
    } else {
      console.log("❌ No audit logs found!");
      console.log("\nThis could mean:");
      console.log("1. The audit_logs table is empty");
      console.log("2. The withAuditLog wrapper is not being triggered");
      console.log("3. There's an error in the audit logging that's being silently caught");
    }
  } catch (error) {
    console.error("Error checking audit logs:", error);
  } finally {
    await client.end();
  }
}

checkAuditLogs()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Script error:", error);
    process.exit(1);
  });
