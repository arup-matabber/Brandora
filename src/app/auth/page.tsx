"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useAuth } from "@/lib/auth-context";
import { ArrowRight } from "lucide-react";

export default function AuthPage() {
  const router = useRouter();
  const { login, loginWithGoogle } = useAuth();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleGoogleAuth = async () => {
    setLoading(true);
    try {
      await loginWithGoogle();
    } catch (e) {
      console.error("Google login error:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email || "designer@studio.design");
    } catch (e) {
      console.error("Email login error:", e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-paper px-6 py-10 selection:bg-[#E8E8E2]">
      {/* Top Header */}
      <header className="mx-auto w-full max-w-5xl flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="h-6 w-6 rounded bg-ink flex items-center justify-center text-xs font-semibold text-white">
            O
          </div>
          <span className="font-semibold text-sm tracking-wider text-ink uppercase">
            Opalite
          </span>
        </div>
        <span className="text-xs text-ink-tertiary tracking-tight font-normal">
          Creative Workspace
        </span>
      </header>

      {/* Main Auth Content - Restrained & Spacious */}
      <main className="mx-auto w-full max-w-sm my-auto py-12">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold tracking-tight text-ink">
            Welcome to Opalite
          </h1>
          <p className="mt-2 text-sm text-ink-secondary leading-relaxed text-balance">
            A workspace for building and exploring brand identities.
          </p>
        </div>

        {/* Primary Action: Continue with Google */}
        <div className="space-y-4">
          <button
            type="button"
            onClick={handleGoogleAuth}
            disabled={loading}
            className="group relative flex w-full items-center justify-center gap-3 rounded-lg border border-border-subtle bg-surface px-4 py-2.5 text-sm font-medium text-ink transition-all duration-150 hover:border-border-line hover:bg-surface-hover hover:shadow-subtle disabled:opacity-50"
          >
            {/* Monotone Google Icon */}
            <svg
              className="h-4 w-4 shrink-0 transition-opacity"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#191918"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#40403E"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                fill="#6B6B66"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                fill="#191918"
              />
            </svg>
            <span className="tracking-tight">Continue with Google</span>
          </button>

          {/* Divider */}
          <div className="relative my-5 flex items-center justify-center">
            <div className="w-full border-t border-border-subtle" />
            <span className="absolute bg-paper px-3 text-[11px] uppercase tracking-wider text-ink-tertiary">
              or continue with email
            </span>
          </div>

          {/* Email Form */}
          <form onSubmit={handleEmailAuth} className="space-y-3">
            <Input
              type="email"
              placeholder="name@studio.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="h-10 text-sm bg-surface"
            />
            <Button
              type="submit"
              variant="primary"
              size="md"
              disabled={loading}
              className="w-full h-10 font-medium text-sm flex items-center justify-center gap-1.5"
            >
              <span>Continue</span>
              <ArrowRight size={14} />
            </Button>
          </form>

          {/* Quiet Note */}
          <div className="pt-2 text-center">
            <p className="text-[11px] text-ink-tertiary">
              Mock authentication enabled for V1 preview.
            </p>
          </div>
        </div>
      </main>

      {/* Footer / Terms */}
      <footer className="mx-auto w-full max-w-sm text-center pt-6">
        <p className="text-[11px] leading-relaxed text-ink-tertiary">
          By continuing, you agree to Opalite&apos;s{" "}
          <span className="underline underline-offset-2 hover:text-ink cursor-pointer">
            Terms of Service
          </span>{" "}
          and{" "}
          <span className="underline underline-offset-2 hover:text-ink cursor-pointer">
            Privacy Policy
          </span>
          .
        </p>
      </footer>
    </div>
  );
}
