import NextAuth from "next-auth";
import EmailProvider from "next-auth/providers/email";
import CredentialsProvider from "next-auth/providers/credentials";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "@/db";
import { users, authCodes } from "@/db/schema";
import { eq, and, gt } from "drizzle-orm";
import nodemailer from "nodemailer";
import { authConfig } from "./auth.config";

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

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: db ? DrizzleAdapter(db) : undefined,
  providers: [
    CredentialsProvider({
      id: "code",
      name: "Email Code",
      credentials: {
        email: { label: "Email", type: "email" },
        code: { label: "Code", type: "text" },
      },
      async authorize(credentials) {
        if (!db || !credentials?.email || !credentials?.code) {
          return null;
        }

        const email = credentials.email as string;
        const code = credentials.code as string;

        // Find valid auth code
        const authCode = await db.query.authCodes.findFirst({
          where: and(
            eq(authCodes.email, email),
            eq(authCodes.code, code),
            gt(authCodes.expires, new Date())
          ),
        });

        if (!authCode) {
          // Increment attempts
          const anyCode = await db.query.authCodes.findFirst({
            where: eq(authCodes.email, email),
          });

          if (anyCode) {
            await db.update(authCodes)
              .set({ attempts: (anyCode.attempts || 0) + 1 })
              .where(eq(authCodes.id, anyCode.id));

            if ((anyCode.attempts || 0) >= 4) {
              await db.delete(authCodes).where(eq(authCodes.email, email));
            }
          }

          return null;
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
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          companyId: user.companyId,
          status: user.status,
        };
      },
    }),
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
    ...authConfig.callbacks,
    async jwt({ token, user, trigger }) {
      // Initial sign in - add user info to token
      if (user) {
        token.id = user.id;
        token.email = user.email;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        token.role = (user as any).role;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        token.companyId = (user as any).companyId;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        token.status = (user as any).status;
      }

      // Fetch fresh user data on each request if needed
      if (trigger === "update" && token.email && db) {
        const dbUser = await db.query.users.findFirst({
          where: eq(users.email, token.email as string),
        });
        if (dbUser) {
          token.id = dbUser.id;
          token.role = dbUser.role;
          token.companyId = dbUser.companyId;
          token.status = dbUser.status;
        }
      }

      return token;
    },
    async session({ session, token }) {
      // Add user info from token to session
      if (token) {
        session.user.id = token.id as string;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        session.user.role = token.role as any;
        session.user.companyId = token.companyId as string | null;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        session.user.status = token.status as any;
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
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
});
