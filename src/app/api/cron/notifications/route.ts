import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { notifications, users } from "@/db/schema";
import { and, eq, lt } from "drizzle-orm";

// Validate cron secret
function validateCronSecret(request: NextRequest): boolean {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    console.error("CRON_SECRET not configured");
    return false;
  }

  return authHeader === `Bearer ${cronSecret}`;
}

interface EmailConfig {
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPass: string;
  fromEmail: string;
  fromName: string;
}

function getEmailConfig(): EmailConfig {
  return {
    smtpHost: process.env.SMTP_HOST || "",
    smtpPort: parseInt(process.env.SMTP_PORT || "587"),
    smtpUser: process.env.SMTP_USER || "",
    smtpPass: process.env.SMTP_PASS || "",
    fromEmail: process.env.EMAIL_FROM || "noreply@litex.de",
    fromName: process.env.EMAIL_FROM_NAME || "Litex",
  };
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function sendEmail(to: string, subject: string, html: string, config: EmailConfig) {
  // TODO: Implement actual email sending using nodemailer or similar
  // Example structure:
  //
  // import nodemailer from 'nodemailer';
  //
  // const transporter = nodemailer.createTransport({
  //   host: config.smtpHost,
  //   port: config.smtpPort,
  //   secure: config.smtpPort === 465,
  //   auth: {
  //     user: config.smtpUser,
  //     pass: config.smtpPass,
  //   },
  // });
  //
  // await transporter.sendMail({
  //   from: `"${config.fromName}" <${config.fromEmail}>`,
  //   to,
  //   subject,
  //   html,
  // });

  console.log(`Email would be sent to ${to}: ${subject}`);
}

function generateNotificationEmailHtml(
  userName: string,
  notifications: Array<{ title: string; message: string | null; createdAt: Date }>
): string {
  const notificationList = notifications
    .map(
      (notif) => `
    <div style="margin-bottom: 20px; padding: 15px; background-color: #f8f9fa; border-radius: 5px;">
      <h3 style="margin: 0 0 10px 0; color: #1e40af;">${notif.title}</h3>
      ${notif.message ? `<p style="margin: 0; color: #64748b;">${notif.message}</p>` : ""}
      <p style="margin: 5px 0 0 0; font-size: 12px; color: #94a3b8;">
        ${new Date(notif.createdAt).toLocaleDateString("de-DE", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })}
      </p>
    </div>
  `
    )
    .join("");

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Ungelesene Benachrichtigungen</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <h1 style="color: #1e40af; border-bottom: 2px solid #1e40af; padding-bottom: 10px;">
      Ungelesene Benachrichtigungen
    </h1>
    <p>Hallo ${userName},</p>
    <p>Sie haben ${notifications.length} ungelesene Benachrichtigung${notifications.length === 1 ? "" : "en"} in Ihrem Litex-Konto:</p>
    ${notificationList}
    <p style="margin-top: 30px;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://litex.de"}"
         style="display: inline-block; padding: 12px 24px; background-color: #1e40af; color: white; text-decoration: none; border-radius: 5px;">
        Benachrichtigungen ansehen
      </a>
    </p>
    <p style="margin-top: 30px; font-size: 12px; color: #94a3b8;">
      Diese E-Mail wurde automatisch gesendet. Bitte antworten Sie nicht auf diese Nachricht.
    </p>
  </div>
</body>
</html>
  `;
}

// POST /api/cron/notifications - Send email notifications for unread notifications
export async function POST(request: NextRequest) {
  // Validate cron secret
  if (!validateCronSecret(request)) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const emailConfig = getEmailConfig();

    if (!emailConfig.smtpHost || !emailConfig.smtpUser) {
      return NextResponse.json(
        { error: "Email configuration is incomplete" },
        { status: 500 }
      );
    }

    // Get notifications older than 24 hours that are still unread
    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

    const unreadNotifications = await db
      .select({
        id: notifications.id,
        userId: notifications.userId,
        title: notifications.title,
        message: notifications.message,
        createdAt: notifications.createdAt,
        userEmail: users.email,
        userName: users.name,
      })
      .from(notifications)
      .innerJoin(users, eq(notifications.userId, users.id))
      .where(
        and(
          eq(notifications.read, false),
          lt(notifications.createdAt, twentyFourHoursAgo)
        )
      );

    // Group notifications by user
    const notificationsByUser = new Map<
      string,
      {
        email: string;
        name: string | null;
        notifications: Array<{
          id: string;
          title: string;
          message: string | null;
          createdAt: Date;
        }>;
      }
    >();

    for (const notif of unreadNotifications) {
      if (!notificationsByUser.has(notif.userId)) {
        notificationsByUser.set(notif.userId, {
          email: notif.userEmail,
          name: notif.userName,
          notifications: [],
        });
      }

      if (notif.createdAt) {
        notificationsByUser.get(notif.userId)!.notifications.push({
          id: notif.id,
          title: notif.title,
          message: notif.message,
          createdAt: notif.createdAt,
        });
      }
    }

    const results = {
      emailsSent: 0,
      usersNotified: 0,
      totalNotifications: unreadNotifications.length,
      errors: [] as string[],
    };

    // Send emails to users with unread notifications
    for (const [, userData] of Array.from(notificationsByUser)) {
      try {
        const userName = userData.name || userData.email.split("@")[0];
        const emailHtml = generateNotificationEmailHtml(userName, userData.notifications);

        await sendEmail(
          userData.email,
          `Sie haben ${userData.notifications.length} ungelesene Benachrichtigung${userData.notifications.length === 1 ? "" : "en"}`,
          emailHtml,
          emailConfig
        );

        results.emailsSent++;
        results.usersNotified++;
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        results.errors.push(`Fehler beim Senden an ${userData.email}: ${message}`);
      }
    }

    return NextResponse.json({
      success: true,
      ...results,
    });
  } catch (error) {
    console.error("Notification email error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";

    return NextResponse.json(
      { error: "Fehler beim Versenden der Benachrichtigungen", details: message },
      { status: 500 }
    );
  }
}

// GET /api/cron/notifications - Health check
export async function GET(request: NextRequest) {
  if (!validateCronSecret(request)) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const config = getEmailConfig();

  return NextResponse.json({
    status: "ok",
    endpoint: "notifications",
    configured: !!(config.smtpHost && config.smtpUser),
    timestamp: new Date().toISOString(),
  });
}
