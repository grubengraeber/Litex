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
  if (!db) {
    return NextResponse.json(
      { error: "Database not configured" },
      { status: 500 }
    );
  }

  try {
    const body = await request.json();
    const { email, code } = verifyCodeSchema.parse(body);

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

    // Return session info for client-side cookie handling
    return NextResponse.json({
      success: true,
      sessionToken,
      expires: expires.toISOString(),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        companyId: user.companyId,
        status: user.status,
      },
    });
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
