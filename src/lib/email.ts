import nodemailer from "nodemailer";

// ==================== CONFIGURATION ====================

const smtpConfig = {
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: process.env.SMTP_SECURE === "true", // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
};

const EMAIL_FROM = process.env.EMAIL_FROM || "Litex <noreply@litex.at>";

// Create transporter lazily to allow for missing env vars during build
let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter {
  if (!transporter) {
    if (!smtpConfig.host || !smtpConfig.auth.user || !smtpConfig.auth.pass) {
      throw new Error("SMTP nicht konfiguriert. Bitte SMTP_HOST, SMTP_USER und SMTP_PASS setzen.");
    }
    transporter = nodemailer.createTransport(smtpConfig);
  }
  return transporter;
}

// ==================== EMAIL TEMPLATES ====================

/**
 * Magic Link Email Template (HTML)
 */
function getMagicLinkTemplate(params: {
  code: string;
  expiresInMinutes: number;
  appName?: string;
}): { subject: string; html: string; text: string } {
  const { code, expiresInMinutes, appName = "Litex" } = params;
  
  const subject = `${code} ist Ihr Anmeldecode für ${appName}`;
  
  const html = `
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Anmeldecode</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f5f5f5;
    }
    .container {
      background-color: #ffffff;
      border-radius: 8px;
      padding: 40px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
    .logo {
      text-align: center;
      margin-bottom: 30px;
    }
    .logo h1 {
      color: #2563eb;
      font-size: 28px;
      margin: 0;
    }
    .code-box {
      background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
      border-radius: 12px;
      padding: 30px;
      text-align: center;
      margin: 30px 0;
    }
    .code {
      font-size: 36px;
      font-weight: bold;
      letter-spacing: 8px;
      color: #ffffff;
      font-family: 'Monaco', 'Menlo', monospace;
    }
    .info {
      color: #666;
      font-size: 14px;
      text-align: center;
      margin-top: 20px;
    }
    .warning {
      background-color: #fef3c7;
      border-left: 4px solid #f59e0b;
      padding: 12px 16px;
      margin: 20px 0;
      font-size: 13px;
      color: #92400e;
    }
    .footer {
      text-align: center;
      color: #999;
      font-size: 12px;
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #eee;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo">
      <h1>📋 ${appName}</h1>
    </div>
    
    <p>Hallo,</p>
    
    <p>Sie haben eine Anmeldung bei ${appName} angefordert. Verwenden Sie den folgenden Code, um sich anzumelden:</p>
    
    <div class="code-box">
      <div class="code">${code}</div>
    </div>
    
    <p class="info">
      Dieser Code ist <strong>${expiresInMinutes} Minuten</strong> gültig.
    </p>
    
    <div class="warning">
      ⚠️ Falls Sie diese Anmeldung nicht angefordert haben, können Sie diese E-Mail ignorieren. 
      Ihr Konto bleibt sicher.
    </div>
    
    <div class="footer">
      <p>Diese E-Mail wurde automatisch von ${appName} versendet.</p>
      <p>Bitte antworten Sie nicht auf diese E-Mail.</p>
    </div>
  </div>
</body>
</html>
  `.trim();

  const text = `
${appName} - Anmeldecode

Ihr Anmeldecode lautet: ${code}

Dieser Code ist ${expiresInMinutes} Minuten gültig.

Falls Sie diese Anmeldung nicht angefordert haben, können Sie diese E-Mail ignorieren.

---
Diese E-Mail wurde automatisch von ${appName} versendet.
  `.trim();

  return { subject, html, text };
}

// ==================== EMAIL FUNCTIONS ====================

/**
 * Send a magic link / login code email
 */
export async function sendMagicLinkEmail(params: {
  to: string;
  code: string;
  expiresInMinutes?: number;
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const { to, code, expiresInMinutes = 10 } = params;

  try {
    const transport = getTransporter();
    const template = getMagicLinkTemplate({ code, expiresInMinutes });

    const result = await transport.sendMail({
      from: EMAIL_FROM,
      to,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });

    console.log(`[Email] Magic link sent to ${to}, messageId: ${result.messageId}`);
    
    return {
      success: true,
      messageId: result.messageId,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unbekannter Fehler";
    console.error(`[Email] Failed to send magic link to ${to}:`, message);
    
    return {
      success: false,
      error: message,
    };
  }
}

/**
 * Send a generic email
 */
export async function sendEmail(params: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const { to, subject, html, text } = params;

  try {
    const transport = getTransporter();

    const result = await transport.sendMail({
      from: EMAIL_FROM,
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, ""), // Strip HTML for text fallback
    });

    console.log(`[Email] Sent to ${to}, messageId: ${result.messageId}`);
    
    return {
      success: true,
      messageId: result.messageId,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unbekannter Fehler";
    console.error(`[Email] Failed to send to ${to}:`, message);
    
    return {
      success: false,
      error: message,
    };
  }
}

/**
 * Send a test email to verify SMTP configuration
 */
export async function sendTestEmail(to: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const subject = "Litex - SMTP Test";
  const html = `
    <div style="font-family: sans-serif; padding: 20px;">
      <h2>✅ SMTP Konfiguration erfolgreich!</h2>
      <p>Diese Test-E-Mail bestätigt, dass die SMTP-Konfiguration korrekt ist.</p>
      <hr>
      <p style="color: #666; font-size: 12px;">
        Gesendet am: ${new Date().toLocaleString("de-AT")}<br>
        Von: ${EMAIL_FROM}
      </p>
    </div>
  `;

  return sendEmail({ to, subject, html });
}

/**
 * Verify SMTP connection
 */
export async function verifySmtpConnection(): Promise<{ success: boolean; error?: string }> {
  try {
    const transport = getTransporter();
    await transport.verify();
    console.log("[Email] SMTP connection verified");
    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unbekannter Fehler";
    console.error("[Email] SMTP verification failed:", message);
    return { success: false, error: message };
  }
}

// ==================== NOTIFICATION EMAILS ====================

/**
 * Send notification when a task status changes
 */
export async function sendTaskStatusNotification(params: {
  to: string;
  taskId: string;
  taskName: string;
  oldStatus: string;
  newStatus: string;
  changedBy: string;
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const { to, taskId, taskName, oldStatus, newStatus, changedBy } = params;

  const statusLabels: Record<string, string> = {
    open: "Offen",
    submitted: "Eingereicht",
    completed: "Abgeschlossen",
  };

  const subject = `Aufgabe "${taskName}" - Status geändert`;
  
  const html = `
    <div style="font-family: sans-serif; padding: 20px; max-width: 600px;">
      <h2 style="color: #2563eb;">📋 Statusänderung</h2>
      
      <p>Die Aufgabe <strong>"${taskName}"</strong> wurde aktualisiert:</p>
      
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #eee; color: #666;">Alter Status:</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee;">${statusLabels[oldStatus] || oldStatus}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #eee; color: #666;">Neuer Status:</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>${statusLabels[newStatus] || newStatus}</strong></td>
        </tr>
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #eee; color: #666;">Geändert von:</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee;">${changedBy}</td>
        </tr>
      </table>
      
      <p style="color: #666; font-size: 12px; margin-top: 30px;">
        Diese E-Mail wurde automatisch von Litex versendet.
      </p>
    </div>
  `;

  return sendEmail({ to, subject, html });
}

/**
 * Send notification when a comment is added to a task
 */
export async function sendCommentNotification(params: {
  to: string;
  taskName: string;
  commentBy: string;
  commentPreview: string;
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const { to, taskName, commentBy, commentPreview } = params;

  const subject = `Neuer Kommentar zu "${taskName}"`;
  
  const html = `
    <div style="font-family: sans-serif; padding: 20px; max-width: 600px;">
      <h2 style="color: #2563eb;">💬 Neuer Kommentar</h2>
      
      <p><strong>${commentBy}</strong> hat einen Kommentar zur Aufgabe <strong>"${taskName}"</strong> hinzugefügt:</p>
      
      <div style="background: #f5f5f5; border-left: 4px solid #2563eb; padding: 12px 16px; margin: 20px 0;">
        "${commentPreview}"
      </div>
      
      <p style="color: #666; font-size: 12px; margin-top: 30px;">
        Diese E-Mail wurde automatisch von Litex versendet.
      </p>
    </div>
  `;

  return sendEmail({ to, subject, html });
}
