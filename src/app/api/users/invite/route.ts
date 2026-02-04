import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { users, authCodes } from "@/db/schema";
import { eq } from "drizzle-orm";
import { withAuditLog } from "@/lib/audit/withAuditLog";
import { z } from "zod";
import crypto from "crypto";

const inviteSchema = z.object({
  email: z.string().email("Ungültige E-Mail-Adresse"),
  name: z.string().optional(),
  role: z.enum(["employee", "customer"]),
});

// POST /api/users/invite - Invite a new user
export const POST = withAuditLog(async (request: NextRequest) => {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Only employees can invite users
  if (session.user.role !== "employee") {
    return NextResponse.json(
      { error: "Keine Berechtigung zum Einladen von Benutzern" },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const { email, name, role } = inviteSchema.parse(body);

    // Check if user already exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .limit(1);

    if (existingUser.length > 0) {
      return NextResponse.json(
        { error: "Ein Benutzer mit dieser E-Mail-Adresse existiert bereits" },
        { status: 400 }
      );
    }

    // Generate a verification code (6 digits for email verification)
    const verificationCode = crypto.randomInt(100000, 999999).toString();
    const verificationCodeExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    // Create the user with pending status
    const [newUser] = await db
      .insert(users)
      .values({
        email: email.toLowerCase(),
        name: name || null,
        role,
        status: "pending",
        emailVerified: null,
        invitedBy: session.user.id,
        invitedAt: new Date(),
      })
      .returning();

    // Store verification code in authCodes table
    await db.insert(authCodes).values({
      email: email.toLowerCase(),
      code: verificationCode,
      expires: verificationCodeExpiry,
    });

    // TODO: Send invitation email with verification link
    // For now, we'll just return the verification code
    // In production, you would send an email like:
    // const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/verify?code=${verificationCode}`;
    // await sendInvitationEmail(email, verificationUrl);

    return NextResponse.json(
      {
        user: {
          id: newUser.id,
          email: newUser.email,
          name: newUser.name,
          role: newUser.role,
          status: newUser.status,
        },
        verificationCode, // Remove this in production after email is implemented
        message: "Einladung erfolgreich gesendet",
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Ungültige Eingabe", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error inviting user:", error);
    return NextResponse.json(
      { error: "Fehler beim Einladen des Benutzers" },
      { status: 500 }
    );
  }
}, {
  auto: true,
  entityType: "user",
  getMetadata: () => ({
    action: "invite",
  }),
});
