import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getAllUsers, getUsersByCompany, getUserById, createUser, updateUser, getUserByEmail } from "@/db/queries";
import { z } from "zod";
import nodemailer from "nodemailer";

const inviteUserSchema = z.object({
  email: z.string().email(),
  name: z.string().optional(),
  role: z.enum(["customer", "employee"]).default("customer"),
  companyId: z.string().uuid().optional(),
});

const updateUserSchema = z.object({
  name: z.string().optional(),
  role: z.enum(["customer", "employee"]).optional(),
  companyId: z.string().uuid().nullable().optional(),
  status: z.enum(["pending", "active", "disabled"]).optional(),
});

// Email transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

// GET /api/users - List users
export async function GET(request: NextRequest) {
  const session = await auth();
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("id");
  const companyId = searchParams.get("companyId");

  try {
    // Get specific user
    if (userId) {
      const user = await getUserById(userId);
      
      if (!user) {
        return NextResponse.json(
          { error: "Benutzer nicht gefunden" },
          { status: 404 }
        );
      }

      // Customers can only see users from their company
      if (
        session.user.role === "customer" &&
        user.companyId !== session.user.companyId
      ) {
        return NextResponse.json(
          { error: "Kein Zugriff" },
          { status: 403 }
        );
      }

      return NextResponse.json({ user });
    }

    // List users
    if (session.user.role === "customer") {
      // Customers can only see users from their company
      if (!session.user.companyId) {
        return NextResponse.json({ users: [] });
      }
      
      const users = await getUsersByCompany(session.user.companyId);
      return NextResponse.json({ users });
    }

    // Employees can list all or filter by company
    if (companyId) {
      const users = await getUsersByCompany(companyId);
      return NextResponse.json({ users });
    }

    const users = await getAllUsers();
    return NextResponse.json({ users });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Fehler beim Laden der Benutzer" },
      { status: 500 }
    );
  }
}

// POST /api/users - Invite user (employees only)
export async function POST(request: NextRequest) {
  const session = await auth();
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.user.role !== "employee") {
    return NextResponse.json(
      { error: "Nur Mitarbeiter können Benutzer einladen" },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const data = inviteUserSchema.parse(body);

    // Check if user already exists
    const existingUser = await getUserByEmail(data.email);
    if (existingUser) {
      return NextResponse.json(
        { error: "Ein Benutzer mit dieser E-Mail existiert bereits" },
        { status: 409 }
      );
    }

    // Create user
    const user = await createUser({
      ...data,
      invitedBy: session.user.id,
    });

    // Send invitation email
    const loginUrl = `${process.env.NEXTAUTH_URL}/login?email=${encodeURIComponent(data.email)}`;
    
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f4f4f5; margin: 0; padding: 20px; }
    .container { max-width: 480px; margin: 0 auto; background: white; border-radius: 12px; padding: 40px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
    .logo { text-align: center; margin-bottom: 30px; font-size: 28px; font-weight: bold; color: #2563eb; }
    h1 { color: #18181b; font-size: 24px; margin-bottom: 16px; }
    p { color: #52525b; line-height: 1.6; margin-bottom: 20px; }
    .button { display: inline-block; background: #2563eb; color: white; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 500; margin: 16px 0; }
    .footer { text-align: center; color: #a1a1aa; font-size: 12px; margin-top: 30px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo">📋 Litex</div>
    <h1>Du wurdest eingeladen!</h1>
    <p>Du wurdest zu Litex eingeladen, um an der Mandantenkommunikation teilzunehmen.</p>
    
    <div style="text-align: center;">
      <a href="${loginUrl}" class="button">🚀 Jetzt anmelden</a>
    </div>
    
    <p style="font-size: 14px; color: #71717a;">Klicke auf den Button, um dich mit deiner E-Mail-Adresse anzumelden. Du erhältst dann einen Magic Link.</p>
    
    <div class="footer">
      <p>Litex – Mandantenkommunikation</p>
    </div>
  </div>
</body>
</html>`;

    await transporter.sendMail({
      to: data.email,
      from: process.env.EMAIL_FROM || "noreply@litex.at",
      subject: "Du wurdest zu Litex eingeladen!",
      html,
      text: `Du wurdest zu Litex eingeladen! Melde dich hier an: ${loginUrl}`,
    });

    return NextResponse.json({ user }, { status: 201 });
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
}

// PATCH /api/users - Update user
export async function PATCH(request: NextRequest) {
  const session = await auth();
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("id");

  if (!userId) {
    return NextResponse.json(
      { error: "id Parameter fehlt" },
      { status: 400 }
    );
  }

  try {
    const body = await request.json();
    const data = updateUserSchema.parse(body);

    // Users can update their own name
    if (userId === session.user.id) {
      const user = await updateUser(userId, { name: data.name });
      return NextResponse.json({ user });
    }

    // Only employees can update other users
    if (session.user.role !== "employee") {
      return NextResponse.json(
        { error: "Keine Berechtigung" },
        { status: 403 }
      );
    }

    const user = await updateUser(userId, data);

    if (!user) {
      return NextResponse.json(
        { error: "Benutzer nicht gefunden" },
        { status: 404 }
      );
    }

    return NextResponse.json({ user });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Ungültige Eingabe", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error updating user:", error);
    return NextResponse.json(
      { error: "Fehler beim Aktualisieren des Benutzers" },
      { status: 500 }
    );
  }
}
