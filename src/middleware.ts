import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const { pathname } = req.nextUrl;

  // Public paths that don't require authentication
  const publicPaths = [
    "/login",
    "/verify",
    "/error",
    "/api/auth",
    "/api/cron", // Cron endpoints use secret header
  ];

  const isPublicPath = publicPaths.some(path => pathname.startsWith(path));
  
  // Static files and Next.js internals
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Allow public paths
  if (isPublicPath) {
    return NextResponse.next();
  }

  // Redirect to login if not authenticated
  if (!isLoggedIn) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Check if user status is pending (only allowed to access profile setup)
  if (req.auth?.user?.status === "pending" && !pathname.startsWith("/setup")) {
    return NextResponse.redirect(new URL("/setup", req.url));
  }

  // Check if user status is disabled
  if (req.auth?.user?.status === "disabled") {
    return NextResponse.redirect(new URL("/blocked", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
