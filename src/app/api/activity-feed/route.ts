import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getActivityFeed } from "@/lib/queries-activity";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get("limit") || "30", 10);
  const offset = parseInt(searchParams.get("offset") || "0", 10);

  const { id: userId, role } = session.user;

  if (!role) {
    return NextResponse.json({ error: "Role not set" }, { status: 400 });
  }

  const feed = await getActivityFeed(userId, role, { limit, offset });

  return NextResponse.json(feed);
}
