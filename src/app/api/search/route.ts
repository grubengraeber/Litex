import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { tasks, companies } from "@/db/schema";
import { or, sql, eq, and } from "drizzle-orm";

// GET /api/search?q=query - Global search across tasks and companies
export async function GET(request: NextRequest) {
  const session = await auth();
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim();
  const type = searchParams.get("type"); // "all", "tasks", "companies"
  const limit = Math.min(parseInt(searchParams.get("limit") || "10"), 20);

  if (!query || query.length < 2) {
    return NextResponse.json({ tasks: [], companies: [] });
  }

  if (!db) {
    return NextResponse.json(
      { error: "Database not configured" },
      { status: 500 }
    );
  }

  try {
    const results: { tasks: unknown[]; companies: unknown[] } = {
      tasks: [],
      companies: [],
    };

    const searchPattern = `%${query}%`;

    // Search companies (employees only)
    if (session.user.role === "employee" && (!type || type === "all" || type === "companies")) {
      results.companies = await db.query.companies.findMany({
        where: or(
          sql`${companies.name} ILIKE ${searchPattern}`,
          sql`${companies.bmdId} ILIKE ${searchPattern}`,
          sql`${companies.finmaticsId} ILIKE ${searchPattern}`
        ),
        limit,
      });
    }

    // Search tasks
    if (!type || type === "all" || type === "tasks") {
      const taskConditions = [
        or(
          sql`${tasks.bookingText} ILIKE ${searchPattern}`,
          sql`${tasks.bmdBookingId} ILIKE ${searchPattern}`,
          sql`CAST(${tasks.amount} AS TEXT) ILIKE ${searchPattern}`
        ),
      ];

      // Customers can only see their company's tasks
      if (session.user.role === "customer" && session.user.companyId) {
        taskConditions.push(eq(tasks.companyId, session.user.companyId));
      }

      results.tasks = await db.query.tasks.findMany({
        where: and(...taskConditions),
        with: {
          company: true,
        },
        limit,
      });
    }

    return NextResponse.json(results);
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json(
      { error: "Fehler bei der Suche" },
      { status: 500 }
    );
  }
}
