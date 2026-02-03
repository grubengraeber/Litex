import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getAllUsers, getUsersByCompany, getUserById, createUser, updateUser, getUserByEmail } from "@/db/queries";
import { z } from "zod";
import nodemailer from "nodemailer";
import { userHasPermission, PERMISSIONS, getUserRoles } from "@/lib/permissions";
import { withAuditLog } from "@/lib/audit/withAuditLog";

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
export const GET = withAuditLog(async (request: NextRequest) => {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("id");
  const companyId = searchParams.get("companyId");

  // Check if user has permission to view all users
  const canViewAllUsers = await userHasPermission(
    session.user.id,
    PERMISSIONS.VIEW_ALL_USERS
  );

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

      // Check access permissions
      if (!canViewAllUsers && user.companyId !== session.user.companyId) {
        return NextResponse.json(
          { error: "Kein Zugriff" },
          { status: 403 }
        );
      }

      // Include roles in response
      const userRolesList = await getUserRoles(userId);

      return NextResponse.json({
        user: {
          ...user,
          roles: userRolesList
        }
      });
    }

    // List users with their roles
    let usersList;

    if (!canViewAllUsers) {
      // Users without permission can only see users from their company
      if (!session.user.companyId) {
        return NextResponse.json({ users: [] });
      }
      usersList = await getUsersByCompany(session.user.companyId);
    } else if (companyId) {
      usersList = await getUsersByCompany(companyId);
    } else {
      usersList = await getAllUsers();
    }

    // Add roles to each user
    const usersWithRoles = await Promise.all(
      usersList.map(async (user) => ({
        ...user,
        roles: await getUserRoles(user.id),
      }))
    );

    return NextResponse.json({ users: usersWithRoles });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Fehler beim Laden der Benutzer" },
      { status: 500 }
    );
  }
}, { auto: true, entityType: "user", skip: () => true });

// POST /api/users - Invite user
export const POST = withAuditLog(async (request: NextRequest) => {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check permission
  const canInvite = await userHasPermission(
    session.user.id,
    PERMISSIONS.INVITE_USERS
  );

  if (!canInvite) {
    return NextResponse.json(
      { error: "Keine Berechtigung zum Einladen von Benutzern" },
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
}, { auto: true, entityType: "user" });

// PATCH /api/users - Update user
export const PATCH = withAuditLog(async (request: NextRequest) => {
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

    // Get user before update for audit log
    const userBefore = await getUserById(userId);

    if (!userBefore) {
      return NextResponse.json(
        { error: "Benutzer nicht gefunden" },
        { status: 404 }
      );
    }

    // Users can update their own name
    if (userId === session.user.id) {
      const user = await updateUser(userId, { name: data.name });

      return NextResponse.json({ user });
    }

    // Check permission to edit other users
    const canEditUsers = await userHasPermission(
      session.user.id,
      PERMISSIONS.EDIT_USERS
    );

    if (!canEditUsers) {
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
}, { auto: true, entityType: "user" });
