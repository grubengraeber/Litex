import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { authCodes } from "@/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

const requestCodeSchema = z.object({
  email: z.string().email(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = requestCodeSchema.parse(body);

    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = new Date(Date.now() + 15 * 60 * 1000);

    // Check if database is available
    if (!db) {
      return NextResponse.json(
        { error: "Database not available" },
        { status: 503 }
      );
    }

    // Delete any existing codes for this email
    await db.delete(authCodes).where(eq(authCodes.email, email));

    // Create new auth code (expires in 15 minutes)
    await db.insert(authCodes).values({
      email,
      code,
      expires,
      attempts: 0,
    });

    // In development, return the code in the response
    // In production, send via email instead
    if (process.env.NODE_ENV === "development" || process.env.AUTH_TEST_MODE === "true") {
      return NextResponse.json({
        success: true,
        message: "Code generated successfully",
        code, // Only in development!
        expiresAt: expires,
      });
    }

    // TODO: Send email with code in production
    // await sendVerificationEmail(email, code);

    return NextResponse.json({
      success: true,
      message: "Verification code sent to email",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid email address", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Request code error:", error);
    return NextResponse.json(
      { error: "Failed to generate verification code" },
      { status: 500 }
    );
  }
}
