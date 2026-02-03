import { config } from "dotenv";
config({ path: ".env" });

import { createAuditLog } from "@/lib/audit/audit-service";

async function testAuditLog() {
  console.log("Testing audit log creation...\n");

  try {
    await createAuditLog({
      action: "CREATE",
      entityType: "test",
      entityId: "test-123",
      userId: "test-user-id",
      userEmail: "test@example.com",
      userIp: "127.0.0.1",
      userAgent: "Test Script",
      metadata: {
        source: "test-script",
      },
      status: "success",
    });

    console.log("\n✅ Test audit log created successfully!");
    console.log("Check the database to verify the entry was created.");
  } catch (error) {
    console.error("❌ Test failed:", error);
  }
}

testAuditLog()
  .then(() => {
    console.log("\n✨ Test complete");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 Test error:", error);
    process.exit(1);
  });
