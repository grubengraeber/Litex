import { NextRequest, NextResponse } from "next/server";
import { sendTestEmail, verifySmtpConnection } from "@/lib/email";

/**
 * POST /api/test-email - Send a test email
 * 
 * Body: { "to": "recipient@example.com" }
 * 
 * Protected by CRON_SECRET or requires authenticated admin user
 */
export async function POST(request: NextRequest) {
  // Check authorization
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  
  // For now, allow with CRON_SECRET (can be extended to check session for admin users)
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json(
      { error: "Unauthorized. Use Authorization: Bearer <CRON_SECRET>" },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const { to } = body;

    if (!to || typeof to !== "string" || !to.includes("@")) {
      return NextResponse.json(
        { error: "Ungültige E-Mail-Adresse. Body: { \"to\": \"email@example.com\" }" },
        { status: 400 }
      );
    }

    // First verify SMTP connection
    const verifyResult = await verifySmtpConnection();
    if (!verifyResult.success) {
      return NextResponse.json({
        success: false,
        error: `SMTP Verbindung fehlgeschlagen: ${verifyResult.error}`,
      }, { status: 500 });
    }

    // Send test email
    const result = await sendTestEmail(to);

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: `Test-Email erfolgreich an ${to} gesendet`,
        messageId: result.messageId,
      });
    } else {
      return NextResponse.json({
        success: false,
        error: result.error,
      }, { status: 500 });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unbekannter Fehler";
    console.error("[Test Email] Error:", message);
    
    return NextResponse.json({
      success: false,
      error: message,
    }, { status: 500 });
  }
}

/**
 * GET /api/test-email - Check SMTP configuration status
 */
export async function GET(request: NextRequest) {
  // Check authorization
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  // Check if SMTP is configured
  const smtpConfigured = !!(
    process.env.SMTP_HOST &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASS
  );

  if (!smtpConfigured) {
    return NextResponse.json({
      status: "not_configured",
      message: "SMTP nicht konfiguriert. Bitte SMTP_HOST, SMTP_USER und SMTP_PASS setzen.",
      config: {
        SMTP_HOST: !!process.env.SMTP_HOST,
        SMTP_PORT: process.env.SMTP_PORT || "587 (default)",
        SMTP_USER: !!process.env.SMTP_USER,
        SMTP_PASS: !!process.env.SMTP_PASS,
        EMAIL_FROM: process.env.EMAIL_FROM || "not set",
      },
    });
  }

  // Verify connection
  const verifyResult = await verifySmtpConnection();

  return NextResponse.json({
    status: verifyResult.success ? "ok" : "error",
    message: verifyResult.success 
      ? "SMTP Verbindung erfolgreich" 
      : `SMTP Verbindung fehlgeschlagen: ${verifyResult.error}`,
    config: {
      SMTP_HOST: process.env.SMTP_HOST,
      SMTP_PORT: process.env.SMTP_PORT || "587",
      SMTP_SECURE: process.env.SMTP_SECURE || "false",
      SMTP_USER: process.env.SMTP_USER ? "***configured***" : "not set",
      EMAIL_FROM: process.env.EMAIL_FROM || "not set",
    },
  });
}
