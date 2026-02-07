import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { finmaticsClient } from "@/lib/finmatics/client";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!finmaticsClient.isConfigured()) {
    return NextResponse.json(
      { error: "Finmatics not configured" },
      { status: 503 }
    );
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") || undefined;
  const limit = parseInt(searchParams.get("limit") || "50", 10);
  const offset = parseInt(searchParams.get("offset") || "0", 10);

  try {
    const documents = await finmaticsClient.fetchDocuments({
      status,
      limit,
      offset,
    });

    return NextResponse.json(documents);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to fetch Finmatics documents", details: message },
      { status: 500 }
    );
  }
}
