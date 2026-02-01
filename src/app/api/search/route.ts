import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { companies, tasks, users } from "@/db/schema";
import { ilike, or, eq, and } from "drizzle-orm";
import { auth } from "@/lib/auth";

interface SearchResult {
  id: string;
  type: "company" | "task" | "user";
  title: string;
  subtitle?: string;
  url: string;
}

// GET /api/search?q=... - Global search
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!db) {
      return NextResponse.json({ error: "Database not configured" }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q")?.trim();
    const limit = Math.min(parseInt(searchParams.get("limit") || "10"), 20);

    if (!query || query.length < 2) {
      return NextResponse.json({ results: [] });
    }

    const searchPattern = `%${query}%`;
    const results: SearchResult[] = [];

    // Search companies (Mandanten)
    const companyResults = await db
      .select({
        id: companies.id,
        name: companies.name,
        bmdId: companies.bmdId,
      })
      .from(companies)
      .where(
        and(
          eq(companies.isActive, true),
          or(
            ilike(companies.name, searchPattern),
            ilike(companies.bmdId, searchPattern)
          )
        )
      )
      .limit(limit);

    for (const company of companyResults) {
      results.push({
        id: company.id,
        type: "company",
        title: company.name,
        subtitle: company.bmdId ? `BMD-ID: ${company.bmdId}` : undefined,
        url: `/companies?id=${company.id}`,
      });
    }

    // Search tasks (Aufgaben)
    const taskResults = await db
      .select({
        id: tasks.id,
        bookingText: tasks.bookingText,
        amount: tasks.amount,
        status: tasks.status,
        companyName: companies.name,
      })
      .from(tasks)
      .leftJoin(companies, eq(tasks.companyId, companies.id))
      .where(
        or(
          ilike(tasks.bookingText, searchPattern),
          ilike(tasks.bmdBookingId, searchPattern)
        )
      )
      .limit(limit);

    for (const task of taskResults) {
      results.push({
        id: task.id,
        type: "task",
        title: task.bookingText || "Aufgabe ohne Beschreibung",
        subtitle: task.companyName 
          ? `${task.companyName}${task.amount ? ` • €${task.amount}` : ""}`
          : undefined,
        url: `/tasks/${task.id}`,
      });
    }

    // Search users (only for employees)
    // TODO: Check permission canViewTeam
    const userResults = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        companyName: companies.name,
      })
      .from(users)
      .leftJoin(companies, eq(users.companyId, companies.id))
      .where(
        or(
          ilike(users.name, searchPattern),
          ilike(users.email, searchPattern)
        )
      )
      .limit(limit);

    for (const user of userResults) {
      results.push({
        id: user.id,
        type: "user",
        title: user.name || user.email,
        subtitle: user.companyName || user.email,
        url: `/team?user=${user.id}`,
      });
    }

    // Sort by relevance (exact match first, then by type)
    const lowerQuery = query.toLowerCase();
    results.sort((a, b) => {
      const aExact = a.title.toLowerCase().includes(lowerQuery) ? 0 : 1;
      const bExact = b.title.toLowerCase().includes(lowerQuery) ? 0 : 1;
      if (aExact !== bExact) return aExact - bExact;
      
      const typeOrder = { company: 0, task: 1, user: 2 };
      return typeOrder[a.type] - typeOrder[b.type];
    });

    return NextResponse.json({
      results: results.slice(0, limit),
      query,
    });
  } catch (error) {
    console.error("Error searching:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
