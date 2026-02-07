import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getDistinctPeriodsWithCounts } from "@/db/queries";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const taskType = searchParams.get("taskType") as "general" | "booking" | null;
  const companyId = searchParams.get("companyId");

  const periods = await getDistinctPeriodsWithCounts({
    taskType: taskType || undefined,
    companyId: companyId || undefined,
  });

  return NextResponse.json(periods);
}
