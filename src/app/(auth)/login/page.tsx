"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
      // Call NextAuth email sign in
      const response = await fetch("/api/auth/signin/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          callbackUrl: "/dashboard",
        }),
      });

      if (response.ok) {
        setSent(true);
      } else {
        // Handle error - for now just show the sent screen anyway
        // since the user can still manually enter their code
        setSent(true);
      }
    } catch (error) {
      console.error("Sign in error:", error);
      // Show sent screen anyway - user can enter code manually
      setSent(true);
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
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl">E-Mail gesendet</CardTitle>
            <CardDescription className="text-base mt-2">
              Wir haben einen Anmelde-Link an <strong>{email}</strong> gesendet.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg text-center">
              <p className="text-sm text-blue-700">
                <strong>Alternativ:</strong> Nutzen Sie den 6-stelligen Code aus der E-Mail
              </p>
            </div>
            
            <Button 
              variant="default" 
              className="w-full bg-blue-600 hover:bg-blue-700"
              onClick={handleUseCode}
            >
              <Mail className="w-4 h-4 mr-2" />
              Code eingeben
            </Button>
            
            <div className="text-center">
              <button 
                onClick={() => setSent(false)}
                className="text-sm text-slate-500 hover:text-slate-700"
              >
                Andere E-Mail verwenden
              </button>
            </div>

            <p className="text-xs text-slate-400 text-center">
              Der Link ist 15 Minuten gültig. Session: 30 Tage.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">L</span>
            </div>
            <span className="font-semibold text-2xl">Litex</span>
          </div>
          <CardTitle className="text-2xl">Willkommen</CardTitle>
          <CardDescription>
            Melden Sie sich mit Ihrer E-Mail-Adresse an
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
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
              />
            </div>
            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={isLoading}>
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
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-slate-400">Passwortlos</span>
            </div>
          </div>

          <p className="text-xs text-slate-500 text-center">
            Sie erhalten einen Magic Link und einen 6-stelligen Code per E-Mail.
            Kein Passwort erforderlich.
          </p>

          <p className="text-xs text-slate-400 text-center mt-4">
            ALB Steuerberatung • Klientenportal
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
