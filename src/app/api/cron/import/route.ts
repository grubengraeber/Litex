import { NextRequest, NextResponse } from "next/server";
import { upsertTaskFromImport, getCompanyByBmdId, createCompany, createSyncJob, completeSyncJob } from "@/db/queries";
import { parse } from "csv-parse/sync";
import { calculateDefaultDueDate } from "@/lib/due-date-utils";

// Validate cron secret
function validateCronSecret(request: NextRequest): boolean {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  
  if (!cronSecret) {
    console.error("CRON_SECRET not configured");
    return false;
  }
  
  return authHeader === `Bearer ${cronSecret}`;
}

interface CSVRow {
  bmd_booking_id: string;
  bmd_client_id: string;
  client_name?: string;
  booking_text?: string;
  amount?: string;
  document_date?: string;
  booking_date?: string;
  period?: string;
  due_date?: string;
}

// POST /api/cron/import - Import tasks from CSV
export async function POST(request: NextRequest) {
  // Validate cron secret
  if (!validateCronSecret(request)) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const contentType = request.headers.get("content-type") || "";
    let records: CSVRow[] = [];

    if (contentType.includes("text/csv") || contentType.includes("text/plain")) {
      // Parse CSV body
      const csvText = await request.text();
      records = parse(csvText, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
      });
    } else if (contentType.includes("application/json")) {
      // Accept JSON array
      const body = await request.json();
      records = Array.isArray(body) ? body : body.records || [];
    } else {
      return NextResponse.json(
        { error: "Ungültiger Content-Type. Erwartet: text/csv oder application/json" },
        { status: 400 }
      );
    }

    if (records.length === 0) {
      return NextResponse.json(
        { error: "Keine Datensätze gefunden" },
        { status: 400 }
      );
    }

    // Create sync job record
    const syncJob = await createSyncJob({ source: "csv_import" });

    const results = {
      processed: 0,
      created: 0,
      updated: 0,
      errors: [] as string[],
      companiesCreated: 0,
    };

    for (const row of records) {
      try {
        // Skip if no booking ID
        if (!row.bmd_booking_id || !row.bmd_client_id) {
          results.errors.push(`Zeile übersprungen: bmd_booking_id oder bmd_client_id fehlt`);
          continue;
        }

        // Find or create company
        let company = await getCompanyByBmdId(row.bmd_client_id);

        if (!company) {
          // Create company
          company = await createCompany({
            name: row.client_name || `Mandant ${row.bmd_client_id}`,
            bmdId: row.bmd_client_id,
          });
          results.companiesCreated++;
        }

        // Calculate default due date if not provided and period exists
        const dueDate = row.due_date || (row.period ? calculateDefaultDueDate(row.period) : undefined);

        // Upsert task as booking type
        const { created } = await upsertTaskFromImport({
          bmdBookingId: row.bmd_booking_id,
          companyId: company.id,
          bookingText: row.booking_text,
          amount: row.amount,
          documentDate: row.document_date,
          bookingDate: row.booking_date,
          period: row.period,
          dueDate,
          taskType: "booking",
        });

        results.processed++;
        if (created) {
          results.created++;
        } else {
          results.updated++;
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unbekannter Fehler";
        results.errors.push(`Fehler bei ${row.bmd_booking_id}: ${message}`);
      }
    }

    // Complete sync job
    await completeSyncJob(syncJob.id, {
      status: results.errors.length > 0 && results.processed === 0 ? "failed" : "completed",
      recordsProcessed: results.processed,
      recordsCreated: results.created,
      recordsUpdated: results.updated,
      recordsFailed: results.errors.length,
      errorLog: results.errors.length > 0 ? JSON.stringify(results.errors) : undefined,
    });

    return NextResponse.json({
      success: true,
      syncJobId: syncJob.id,
      ...results,
    });
  } catch (error) {
    console.error("Import error:", error);
    return NextResponse.json(
      { error: "Fehler beim Import" },
      { status: 500 }
    );
  }
}

// GET /api/cron/import - Health check
export async function GET(request: NextRequest) {
  if (!validateCronSecret(request)) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  return NextResponse.json({
    status: "ok",
    endpoint: "import",
    timestamp: new Date().toISOString(),
  });
}
