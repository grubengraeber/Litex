import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getSyncJobs } from "@/db/queries";

export async function GET() {
  const session = await auth();
  if (!session?.user || session.user.role === "customer") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const jobs = await getSyncJobs(50);
    return NextResponse.json(jobs);
  } catch (error) {
    console.error("Error fetching sync jobs:", error);
    return NextResponse.json(
      { error: "Failed to fetch sync jobs" },
      { status: 500 }
    );
  }
}
