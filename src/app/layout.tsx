import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/providers/session-provider";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Litex - ALB Klientenportal",
  description: "Kommunikations- und Aufgabenplattform für offene Buchungen",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de">
      <body className={inter.className}>
        <AuthProvider>{children}</AuthProvider>
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
