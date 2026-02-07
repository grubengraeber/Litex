import { NextRequest, NextResponse } from "next/server";
import { finmaticsClient } from "@/lib/finmatics/client";
import { syncProcessedDocuments, getFinmaticsStatus } from "@/lib/finmatics/service";
import { createSyncJob, completeSyncJob } from "@/db/queries";

function validateCronSecret(request: NextRequest): boolean {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    console.error("CRON_SECRET not configured");
    return false;
  }

  return authHeader === `Bearer ${cronSecret}`;
}

// POST /api/cron/finmatics - Sync documents from Finmatics
export async function POST(request: NextRequest) {
  if (!validateCronSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!finmaticsClient.isConfigured()) {
    return NextResponse.json(
      { error: "Finmatics not configured" },
      { status: 503 }
    );
  }

  const syncJob = await createSyncJob({ source: "finmatics", triggeredBy: "cron" });

  try {
    const result = await syncProcessedDocuments();

    await completeSyncJob(syncJob.id, {
      status: result.errors.length > 0 ? "completed_with_errors" : "completed",
      recordsProcessed: result.processed,
      recordsCreated: result.created,
      recordsUpdated: result.updated,
      recordsFailed: result.errors.length,
      errorLog: result.errors.length > 0 ? result.errors.join("\n") : null,
    });

    return NextResponse.json({
      success: true,
      syncJobId: syncJob.id,
      ...result,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";

    await completeSyncJob(syncJob.id, {
      status: "failed",
      recordsProcessed: 0,
      recordsCreated: 0,
      recordsUpdated: 0,
      recordsFailed: 0,
      errorLog: message,
    });

    return NextResponse.json(
      { error: "Finmatics sync failed", details: message },
      { status: 500 }
    );
  }
}

// GET /api/cron/finmatics - Health check
export async function GET(request: NextRequest) {
  if (!validateCronSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const status = await getFinmaticsStatus();

  return NextResponse.json({
    status: "ok",
    endpoint: "finmatics",
    ...status,
    timestamp: new Date().toISOString(),
  });
}
