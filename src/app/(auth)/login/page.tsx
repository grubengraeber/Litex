"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, ArrowRight, Loader2, CheckCircle } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Request verification code
      const response = await fetch("/api/auth/request-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        // In development, log the code to console
        if (data.code) {
          console.log("🔐 Verification code:", data.code);
          console.log("📧 Email:", email);
          console.log("⏰ Expires:", new Date(data.expiresAt).toLocaleTimeString("de-DE"));
        }
        setSent(true);
      } else {
        console.error("Failed to request code:", data.error);
        alert("Fehler beim Anfordern des Codes. Bitte versuchen Sie es erneut.");
      }
    } catch (error) {
      console.error("Sign in error:", error);
      alert("Fehler beim Anfordern des Codes. Bitte versuchen Sie es erneut.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUseCode = () => {
    // Navigate to code verification with email as query param
    router.push(`/login/verify?email=${encodeURIComponent(email)}`);
  };

  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white p-4">
        <Card className="w-full max-w-md shadow-lg border-0">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-6">
              <Image
                src="/logos/countable-logo-0.png"
                alt="Countable Logo"
                width={160}
                height={60}
                priority
                className="object-contain"
              />
            </div>
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl font-bold">E-Mail gesendet</CardTitle>
            <CardDescription className="text-base mt-2">
              Wir haben einen Anmelde-Link an <strong>{email}</strong> gesendet.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-primary/10 p-4 rounded-lg text-center border border-primary/20">
              <p className="text-sm text-foreground">
                <strong>Alternativ:</strong> Nutzen Sie den 6-stelligen Code aus der E-Mail
              </p>
            </div>

            <Button
              variant="default"
              className="w-full"
              onClick={handleUseCode}
            >
              <Mail className="w-4 h-4 mr-2" />
              Code eingeben
            </Button>

            <div className="text-center">
              <button
                onClick={() => setSent(false)}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Andere E-Mail verwenden
              </button>
            </div>

            <p className="text-xs text-muted-foreground text-center">
              Der Link ist 15 Minuten gültig. Session: 30 Tage.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white p-4">
      <Card className="w-full max-w-md shadow-lg border-0">
        <CardHeader className="text-center space-y-6">
          <div className="flex justify-center">
            <Image
              src="/logos/countable-logo-0.png"
              alt="Countable Logo"
              width={180}
              height={70}
              priority
              className="object-contain"
            />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold">Willkommen</CardTitle>
            <CardDescription className="text-base mt-2">
              Melden Sie sich mit Ihrer E-Mail-Adresse an
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-foreground">
                E-Mail-Adresse
              </label>
              <Input
                id="email"
                type="email"
                placeholder="name@firma.at"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
                autoComplete="email"
                autoFocus
                className="h-11"
              />
            </div>
            <Button
              type="submit"
              className="w-full h-11 font-semibold"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Link wird gesendet...
                </>
              ) : (
                <>
                  Anmelden
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-muted-foreground font-medium">Passwortlos</span>
            </div>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            Sie erhalten einen Magic Link und einen 6-stelligen Code per E-Mail.
            Kein Passwort erforderlich.
          </p>

          <p className="text-xs text-muted-foreground text-center mt-6 font-medium">
            ALB Steuerberatung • Klientenportal
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
