import { finmaticsClient } from "./client";
import type { FinmaticsDocument, FinmaticsSyncResult } from "./types";
import { db } from "@/db";
import { files, notifications } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function syncProcessedDocuments(): Promise<FinmaticsSyncResult> {
  if (!db) throw new Error("Database not configured");

  const result: FinmaticsSyncResult = {
    processed: 0,
    created: 0,
    updated: 0,
    errors: [],
  };

  try {
    // Fetch documents that have been processed but not yet exported
    const docList = await finmaticsClient.fetchDocuments({
      status: "processed",
      isExported: false,
      limit: 100,
    });

    result.processed = docList.results.length;

    for (const doc of docList.results) {
      try {
        await processDocument(doc, result);
      } catch (error) {
        const msg = error instanceof Error ? error.message : "Unknown error";
        result.errors.push(`Doc ${doc.uuid}: ${msg}`);
      }
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    result.errors.push(`Fetch failed: ${msg}`);
  }

  return result;
}

async function processDocument(
  doc: FinmaticsDocument,
  result: FinmaticsSyncResult
): Promise<void> {
  if (!db) return;

  // Check if we already have this document tracked by storageKey
  const storageKey = `finmatics/${doc.uuid}`;
  const existing = await db.query.files.findFirst({
    where: eq(files.storageKey, storageKey),
  });

  if (existing) {
    // Update existing record with latest Finmatics data
    await db
      .update(files)
      .set({
        status: "approved",
      })
      .where(eq(files.id, existing.id));

    result.updated++;
  } else {
    // Create notification about new processed document
    if (doc.company_uuid) {
      await db.insert(notifications).values({
        type: "file_uploaded",
        title: `Dokument verarbeitet: ${doc.file_name}`,
        message: doc.booking_text || "Finmatics-Dokument wurde verarbeitet",
        userId: "system",
      });
    }

    result.created++;
  }

  // Mark as exported in Finmatics
  await finmaticsClient.markDocumentExported(doc.uuid);
}

export async function getFinmaticsStatus(): Promise<{
  configured: boolean;
  authenticated: boolean;
}> {
  const configured = finmaticsClient.isConfigured();

  if (!configured) {
    return { configured: false, authenticated: false };
  }

  try {
    const config = finmaticsClient.getConfig();
    await finmaticsClient.authenticate(config);
    return { configured: true, authenticated: true };
  } catch {
    return { configured: true, authenticated: false };
  }
}
