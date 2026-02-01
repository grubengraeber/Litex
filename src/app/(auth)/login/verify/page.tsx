"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { KeyRound, ArrowRight, Loader2, ArrowLeft } from "lucide-react";

function VerifyContent() {
  const router = useRouter();
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
    
    // TODO: Implement actual code verification
    // POST /api/auth/verify-code { email, code }
    await new Promise((resolve) => setTimeout(resolve, 1500));
    
    // Mock: Check if code is "123456" for demo
    if (fullCode === "123456") {
      router.push("/dashboard");
    } else {
      setError("Ungültiger Code. Bitte versuchen Sie es erneut.");
      setCode(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    }
    
    setIsLoading(false);
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
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <KeyRound className="w-8 h-8 text-blue-600" />
          </div>
          <CardTitle className="text-2xl">Code eingeben</CardTitle>
          <CardDescription className="text-base mt-2">
            Geben Sie den 6-stelligen Code aus Ihrer E-Mail ein
            {email && (
              <span className="block mt-1 text-slate-600">{email}</span>
            )}
          </CardDescription>
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
                  className={`w-12 h-14 text-center text-2xl font-semibold border rounded-lg 
                    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                    disabled:bg-slate-100 disabled:cursor-not-allowed
                    ${error ? "border-red-300 bg-red-50" : "border-slate-200"}`}
                />
              ))}
            </div>

            {error && (
              <p className="text-sm text-red-600 text-center">{error}</p>
            )}

            <Button 
              type="submit" 
              className="w-full bg-blue-600 hover:bg-blue-700" 
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
            <p className="text-sm text-slate-500">
              Keinen Code erhalten?{" "}
              <button 
                onClick={handleResend}
                disabled={resendCooldown > 0}
                className={`font-medium ${
                  resendCooldown > 0 
                    ? "text-slate-400 cursor-not-allowed" 
                    : "text-blue-600 hover:underline"
                }`}
              >
                {resendCooldown > 0 ? `Erneut senden (${resendCooldown}s)` : "Erneut senden"}
              </button>
            </p>

            <Link 
              href="/login" 
              className="inline-flex items-center text-sm text-slate-500 hover:text-slate-700"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Zurück zur Anmeldung
            </Link>
          </div>

          <p className="text-xs text-slate-400 text-center mt-6">
            Demo-Code: <span className="font-mono bg-slate-100 px-1 rounded">123456</span>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    }>
      <VerifyContent />
    </Suspense>
  );
}
