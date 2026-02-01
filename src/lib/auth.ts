import NextAuth, { type NextAuthConfig } from "next-auth";
import EmailProvider from "next-auth/providers/email";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "@/db";
import { users, authCodes } from "@/db/schema";
import { eq } from "drizzle-orm";
import nodemailer from "nodemailer";

// Generate 6-digit code
function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

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

export const authConfig: NextAuthConfig = {
  adapter: db ? DrizzleAdapter(db) : undefined,
  providers: [
    EmailProvider({
      server: {
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || "587"),
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASSWORD,
        },
      },
      from: process.env.EMAIL_FROM || "noreply@litex.at",
      sendVerificationRequest: async ({ identifier: email, url }) => {
        if (!db) throw new Error("Database not configured");
        
        // Generate and store 6-digit code
        const code = generateCode();
        const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
        
        await db.insert(authCodes).values({
          email,
          code,
          expires,
        });

        // Custom email template with magic link + code
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
    .code-box { background: #f4f4f5; border-radius: 8px; padding: 20px; text-align: center; margin: 24px 0; }
    .code { font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #18181b; font-family: monospace; }
    .button { display: inline-block; background: #2563eb; color: white; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 500; margin: 16px 0; }
    .divider { text-align: center; color: #a1a1aa; margin: 24px 0; }
    .footer { text-align: center; color: #a1a1aa; font-size: 12px; margin-top: 30px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo">📋 Litex</div>
    <h1>Anmeldung bei Litex</h1>
    <p>Verwende entweder den 6-stelligen Code oder klicke auf den Button, um dich anzumelden:</p>
    
    <div class="code-box">
      <div class="code">${code}</div>
      <p style="margin-top: 12px; margin-bottom: 0; font-size: 14px;">Gültig für 10 Minuten</p>
    </div>
    
    <div class="divider">— oder —</div>
    
    <div style="text-align: center;">
      <a href="${url}" class="button">✨ Magic Link öffnen</a>
    </div>
    
    <p style="font-size: 14px; color: #71717a;">Falls du diese Anmeldung nicht angefordert hast, kannst du diese E-Mail ignorieren.</p>
    
    <div class="footer">
      <p>Litex – Mandantenkommunikation</p>
    </div>
  </div>
</body>
</html>`;

        await transporter.sendMail({
          to: email,
          from: process.env.EMAIL_FROM || "noreply@litex.at",
          subject: `${code} – Dein Litex Anmeldecode`,
          html,
          text: `Dein Litex Anmeldecode: ${code}\n\nOder nutze diesen Link: ${url}\n\nGültig für 10 Minuten.`,
        });
      },
    }),
  ],
  callbacks: {
    async session({ session, user }) {
      if (!db) return session;
      
      // Fetch user with role and companyId
      const dbUser = await db.query.users.findFirst({
        where: eq(users.id, user.id),
      });
      
      if (dbUser) {
        session.user.id = dbUser.id;
        session.user.role = dbUser.role;
        session.user.companyId = dbUser.companyId;
        session.user.status = dbUser.status;
      }
      
      return session;
    },
    async signIn({ user }) {
      if (!db || !user.email) return false;
      
      // Check if user exists and is not disabled
      const existingUser = await db.query.users.findFirst({
        where: eq(users.email, user.email),
      });
      
      if (existingUser && existingUser.status === "disabled") {
        return false;
      }
      
      return true;
    },
  },
  pages: {
    signIn: "/login",
    verifyRequest: "/verify",
    error: "/error",
  },
  session: {
    strategy: "database",
  },
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
