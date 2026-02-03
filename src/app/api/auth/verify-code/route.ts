import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { authCodes, users, sessions } from "@/db/schema";
import { eq, and, gt } from "drizzle-orm";
import { z } from "zod";

const verifyCodeSchema = z.object({
  email: z.string().email(),
  code: z.string().length(6),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, code } = verifyCodeSchema.parse(body);

    // TEST MODE: Accept code 123456 when no database
    if (!db || process.env.AUTH_TEST_MODE === "true") {
      if (code === "123456") {
        const testSessionToken = "test-session-" + Date.now();
        const response = NextResponse.json({
          success: true,
          user: {
            id: "test-user",
            email: email,
            name: "Test User",
            role: "employee",
            companyId: null,
            status: "active",
          },
        });

        const cookieName = process.env.NODE_ENV === "production"
          ? "__Secure-next-auth.session-token"
          : "next-auth.session-token";

        response.cookies.set({
          name: cookieName,
          value: testSessionToken,
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          path: "/",
          maxAge: 30 * 24 * 60 * 60,
        });

        return response;
      }
      return NextResponse.json(
        { error: "Test mode: use code 123456" },
        { status: 400 }
      );
    }

    // Find valid auth code
    const authCode = await db.query.authCodes.findFirst({
      where: and(
        eq(authCodes.email, email),
        eq(authCodes.code, code),
        gt(authCodes.expires, new Date())
      ),
    });

    if (!authCode) {
      // Increment attempts on any matching code
      const anyCode = await db.query.authCodes.findFirst({
        where: eq(authCodes.email, email),
      });
      
      if (anyCode) {
        await db.update(authCodes)
          .set({ attempts: (anyCode.attempts || 0) + 1 })
          .where(eq(authCodes.id, anyCode.id));
        
        // Lock after 5 attempts
        if ((anyCode.attempts || 0) >= 4) {
          await db.delete(authCodes).where(eq(authCodes.email, email));
          return NextResponse.json(
            { error: "Zu viele Versuche. Bitte fordere einen neuen Code an." },
            { status: 429 }
          );
        }
      }

      return NextResponse.json(
        { error: "Ungültiger oder abgelaufener Code" },
        { status: 400 }
      );
    }

    // Delete all auth codes for this email
    await db.delete(authCodes).where(eq(authCodes.email, email));

    // Find or create user
    let user = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (!user) {
      const [newUser] = await db.insert(users)
        .values({ email })
        .returning();
      user = newUser;
    }

    // Check if user is disabled
    if (user.status === "disabled") {
      return NextResponse.json(
        { error: "Dein Konto wurde deaktiviert" },
        { status: 403 }
      );
    }

    // Generate session token
    const sessionToken = crypto.randomUUID();
    const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

    await db.insert(sessions).values({
      sessionToken,
      userId: user.id,
      expires,
    });

    // Set session cookie
    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        companyId: user.companyId,
        status: user.status,
      },
    });

    // Set NextAuth session cookie
    const cookieName = process.env.NODE_ENV === "production"
      ? "__Secure-next-auth.session-token"
      : "next-auth.session-token";

    response.cookies.set({
      name: cookieName,
      value: sessionToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 30 * 24 * 60 * 60, // 30 days
    });

    return response;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Ungültige Eingabe", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Verify code error:", error);
    return NextResponse.json(
      { error: "Interner Serverfehler" },
      { status: 500 }
    );
  }
}
