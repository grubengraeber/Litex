"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { KeyRound, ArrowRight, Loader2, ArrowLeft } from "lucide-react";

function VerifyContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";
  
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Focus first input on mount
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleChange = (index: number, value: string) => {
    // Only allow digits
    const digit = value.replace(/\D/g, "").slice(-1);
    
    const newCode = [...code];
    newCode[index] = digit;
    setCode(newCode);
    setError("");

    // Auto-focus next input
    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when complete
    if (digit && index === 5 && newCode.every(d => d)) {
      handleSubmit(newCode.join(""));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      const newCode = pasted.split("");
      setCode(newCode);
      inputRefs.current[5]?.focus();
      handleSubmit(pasted);
    }
  };

  const handleSubmit = async (codeString?: string) => {
    const fullCode = codeString || code.join("");
    if (fullCode.length < 6) return;

    setIsLoading(true);
    setError("");

    try {
      console.log("Attempting sign in with:", { email, code: fullCode });

      const result = await signIn("code", {
        email,
        code: fullCode,
        redirect: false,
      });

      console.log("Sign in result:", result);

      if (result?.error) {
        console.error("Sign in error:", result.error);
        throw new Error(`Ungültiger oder abgelaufener Code: ${result.error}`);
      }

      if (result?.ok) {
        console.log("Sign in successful, redirecting to dashboard");
        // Redirect to dashboard
        window.location.href = "/dashboard";
      } else {
        console.error("Sign in failed without error message");
        throw new Error("Verification failed");
      }
    } catch (err) {
      const error = err as Error;
      console.error("Exception during sign in:", error);
      setError(error.message || "Ungültiger Code. Bitte versuchen Sie es erneut.");
      setCode(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    
    // TODO: Implement actual resend
    // POST /api/auth/resend-code { email }
    await new Promise((resolve) => setTimeout(resolve, 500));
    
    setResendCooldown(60); // 60 second cooldown
    setError("");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white p-4">
      <Card className="w-full max-w-md shadow-lg border-0">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <Image
              src="/logos/countable-logo-0.png"
              alt="Countable Logo"
              width={160}
              height={60}
              priority
              className="object-contain"
            />
          </div>
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
            <KeyRound className="w-8 h-8 text-primary" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold">Code eingeben</CardTitle>
            <CardDescription className="text-base mt-2">
              Geben Sie den 6-stelligen Code aus Ihrer E-Mail ein
              {email && (
                <span className="block mt-1 text-foreground font-medium">{email}</span>
              )}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="space-y-6">
            {/* 6-digit code input */}
            <div className="flex justify-center gap-2" onPaste={handlePaste}>
              {code.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => { inputRefs.current[index] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  disabled={isLoading}
                  className={`w-12 h-14 text-center text-2xl font-bold border-2 rounded-lg
                    focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary
                    disabled:bg-muted disabled:cursor-not-allowed transition-colors
                    ${error ? "border-red-300 bg-red-50" : "border-border"}`}
                />
              ))}
            </div>

            {error && (
              <p className="text-sm text-red-600 text-center font-medium">{error}</p>
            )}

            <Button
              type="submit"
              className="w-full h-11 font-semibold"
              disabled={isLoading || code.some(d => !d)}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Wird überprüft...
                </>
              ) : (
                <>
                  Anmelden
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 text-center space-y-3">
            <p className="text-sm text-muted-foreground">
              Keinen Code erhalten?{" "}
              <button
                onClick={handleResend}
                disabled={resendCooldown > 0}
                className={`font-medium transition-colors ${
                  resendCooldown > 0
                    ? "text-muted-foreground cursor-not-allowed"
                    : "text-foreground hover:text-primary"
                }`}
              >
                {resendCooldown > 0 ? `Erneut senden (${resendCooldown}s)` : "Erneut senden"}
              </button>
            </p>

            <Link
              href="/login"
              className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Zurück zur Anmeldung
            </Link>
          </div>

          <p className="text-xs text-muted-foreground text-center mt-6">
            Demo-Code: <span className="font-mono bg-muted px-2 py-1 rounded font-medium">123456</span>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    }>
      <VerifyContent />
    </Suspense>
  );
}
