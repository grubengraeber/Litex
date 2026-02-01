import type { NextAuthConfig } from "next-auth";

// Edge-compatible auth config (no db adapter, no nodemailer)
// Used by middleware
export const authConfig: NextAuthConfig = {
  providers: [], // Providers are added in auth.ts
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const { pathname } = nextUrl;

      // Public paths that don't require authentication
      const publicPaths = [
        "/login",
        "/verify",
        "/error",
        "/api/auth",
        "/api/cron",
      ];

      const isPublicPath = publicPaths.some(path => pathname.startsWith(path));

      // Static files and Next.js internals
      if (
        pathname.startsWith("/_next") ||
        pathname.startsWith("/favicon") ||
        pathname.includes(".")
      ) {
        return true;
      }

      // Allow public paths
      if (isPublicPath) {
        return true;
      }

      // Redirect to login if not authenticated
      if (!isLoggedIn) {
        return false; // Will redirect to signIn page
      }

      return true;
    },
  },
  pages: {
    signIn: "/login",
    verifyRequest: "/verify",
    error: "/error",
  },
};
