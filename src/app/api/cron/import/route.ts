import { NextRequest, NextResponse } from "next/server";
import { upsertTaskFromImport, getCompanyByBmdId, createCompany } from "@/db/queries";
import { parse } from "csv-parse/sync";
import { S3Client, ListObjectsV2Command, GetObjectCommand, CopyObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";

// ==================== S3 CLIENT ====================

const s3Client = new S3Client({
  region: process.env.S3_REGION || "eu-central-1",
  endpoint: process.env.S3_ENDPOINT,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY || "",
    secretAccessKey: process.env.S3_SECRET_KEY || "",
  },
  forcePathStyle: true,
});

const IMPORT_BUCKET = process.env.S3_IMPORT_BUCKET || "kommunikation-imports";

// ==================== AUTH ====================

function validateCronSecret(request: NextRequest): boolean {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  
  if (!cronSecret) {
    console.error("[Import] CRON_SECRET not configured");
    return false;
  }
  
  return authHeader === `Bearer ${cronSecret}`;
}

// ==================== TYPES ====================

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

interface ImportResults {
  processed: number;
  created: number;
  updated: number;
  errors: string[];
  companiesCreated: number;
}

interface FileResult {
  fileName: string;
  success: boolean;
  results?: ImportResults;
  error?: string;
}

// ==================== MINIO HELPERS ====================

/**
 * List all CSV files in the pending/ folder
 */
async function listPendingFiles(): Promise<string[]> {
  const command = new ListObjectsV2Command({
    Bucket: IMPORT_BUCKET,
    Prefix: "pending/",
  });

  const response = await s3Client.send(command);
  const files: string[] = [];

  if (response.Contents) {
    for (const obj of response.Contents) {
      if (obj.Key && obj.Key.endsWith(".csv") && obj.Key !== "pending/") {
        files.push(obj.Key);
      }
    }
  }

  return files;
}

/**
 * Download a file from S3/MinIO
 */
async function downloadFile(key: string): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: IMPORT_BUCKET,
    Key: key,
  });

  const response = await s3Client.send(command);
  
  if (!response.Body) {
    throw new Error(`Empty file: ${key}`);
  }

  // Convert stream to string
  const chunks: Uint8Array[] = [];
  const reader = response.Body as AsyncIterable<Uint8Array>;
  
  for await (const chunk of reader) {
    chunks.push(chunk);
  }

  return Buffer.concat(chunks).toString("utf-8");
}

/**
 * Move a file from one location to another in S3/MinIO
 */
async function moveFile(sourceKey: string, destKey: string): Promise<void> {
  // Copy to destination
  await s3Client.send(new CopyObjectCommand({
    Bucket: IMPORT_BUCKET,
    CopySource: `${IMPORT_BUCKET}/${sourceKey}`,
    Key: destKey,
  }));

  // Delete source
  await s3Client.send(new DeleteObjectCommand({
    Bucket: IMPORT_BUCKET,
    Key: sourceKey,
  }));
}

// ==================== CSV PROCESSING ====================

/**
 * Process CSV records and import tasks
 */
async function processRecords(records: CSVRow[]): Promise<ImportResults> {
  const results: ImportResults = {
    processed: 0,
    created: 0,
    updated: 0,
    errors: [],
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
        company = await createCompany({
          name: row.client_name || `Mandant ${row.bmd_client_id}`,
          bmdId: row.bmd_client_id,
        });
        results.companiesCreated++;
        console.log(`[Import] Company created: ${company.name} (BMD ID: ${row.bmd_client_id})`);
      }

      // Upsert task
      const { created } = await upsertTaskFromImport({
        bmdBookingId: row.bmd_booking_id,
        companyId: company.id,
        bookingText: row.booking_text,
        amount: row.amount,
        documentDate: row.document_date,
        bookingDate: row.booking_date,
        period: row.period,
        dueDate: row.due_date,
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

  return results;
}

// ==================== API ROUTES ====================

/**
 * POST /api/cron/import - Import tasks from MinIO or request body
 * 
 * Mode 1: Cron Job (no body) - Reads CSV files from MinIO pending/ folder
 * Mode 2: Direct Upload - Accepts CSV or JSON in request body
 */
export async function POST(request: NextRequest) {
  if (!validateCronSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const contentType = request.headers.get("content-type") || "";
  const contentLength = parseInt(request.headers.get("content-length") || "0");

  // Mode 1: MinIO Import (no body or empty body)
  if (contentLength === 0 || !contentType) {
    console.log("[Import] Starting MinIO import scan...");
    
    try {
      const pendingFiles = await listPendingFiles();
      
      if (pendingFiles.length === 0) {
        console.log("[Import] No pending files found");
        return NextResponse.json({
          success: true,
          mode: "minio",
          message: "Keine Dateien zum Importieren gefunden",
          filesProcessed: 0,
        });
      }

      console.log(`[Import] Found ${pendingFiles.length} pending file(s)`);
      const fileResults: FileResult[] = [];
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");

      for (const fileKey of pendingFiles) {
        const fileName = fileKey.split("/").pop() || fileKey;
        console.log(`[Import] Processing: ${fileName}`);

        try {
          // Download and parse CSV
          const csvContent = await downloadFile(fileKey);
          const records: CSVRow[] = parse(csvContent, {
            columns: true,
            skip_empty_lines: true,
            trim: true,
            bom: true, // Handle UTF-8 BOM
          });

          if (records.length === 0) {
            throw new Error("Keine Datensätze in der CSV-Datei");
          }

          // Process records
          const results = await processRecords(records);
          
          // Move to processed/
          const destKey = `processed/${timestamp}_${fileName}`;
          await moveFile(fileKey, destKey);
          
          console.log(`[Import] ${fileName}: ${results.processed} processed, ${results.created} created, ${results.updated} updated`);
          
          fileResults.push({
            fileName,
            success: true,
            results,
          });
        } catch (error) {
          const message = error instanceof Error ? error.message : "Unbekannter Fehler";
          console.error(`[Import] Error processing ${fileName}:`, message);

          // Move to failed/
          try {
            const destKey = `failed/${timestamp}_${fileName}`;
            await moveFile(fileKey, destKey);
          } catch (moveError) {
            console.error(`[Import] Failed to move ${fileName} to failed/:`, moveError);
          }

          fileResults.push({
            fileName,
            success: false,
            error: message,
          });
        }
      }

      const successful = fileResults.filter(f => f.success).length;
      const failed = fileResults.filter(f => !f.success).length;

      return NextResponse.json({
        success: failed === 0,
        mode: "minio",
        filesProcessed: pendingFiles.length,
        successful,
        failed,
        files: fileResults,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unbekannter Fehler";
      console.error("[Import] MinIO scan error:", message);
      
      return NextResponse.json({
        success: false,
        mode: "minio",
        error: `MinIO Fehler: ${message}`,
      }, { status: 500 });
    }
  }

  // Mode 2: Direct Upload
  console.log("[Import] Processing direct upload...");
  
  try {
    let records: CSVRow[] = [];

    if (contentType.includes("text/csv") || contentType.includes("text/plain")) {
      const csvText = await request.text();
      records = parse(csvText, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
        bom: true,
      });
    } else if (contentType.includes("application/json")) {
      const body = await request.json();
      records = Array.isArray(body) ? body : body.records || [];
    } else {
      return NextResponse.json({
        error: "Ungültiger Content-Type. Erwartet: text/csv oder application/json",
      }, { status: 400 });
    }

    if (records.length === 0) {
      return NextResponse.json({ error: "Keine Datensätze gefunden" }, { status: 400 });
    }

    const results = await processRecords(records);

    console.log(`[Import] Direct upload: ${results.processed} processed, ${results.created} created, ${results.updated} updated`);

    return NextResponse.json({
      success: true,
      mode: "direct",
      ...results,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unbekannter Fehler";
    console.error("[Import] Direct upload error:", message);
    
    return NextResponse.json({ error: `Fehler beim Import: ${message}` }, { status: 500 });
  }
}

/**
 * GET /api/cron/import - Health check and status
 */
export async function GET(request: NextRequest) {
  if (!validateCronSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Check MinIO connection and list pending files
    const pendingFiles = await listPendingFiles();

    return NextResponse.json({
      status: "ok",
      endpoint: "import",
      timestamp: new Date().toISOString(),
      minio: {
        bucket: IMPORT_BUCKET,
        pendingFiles: pendingFiles.length,
        files: pendingFiles.map(f => f.split("/").pop()),
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unbekannter Fehler";
    
    return NextResponse.json({
      status: "error",
      endpoint: "import",
      timestamp: new Date().toISOString(),
      error: `MinIO nicht erreichbar: ${message}`,
    }, { status: 500 });
  }
}
