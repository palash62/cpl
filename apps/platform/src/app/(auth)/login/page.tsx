"use client";

import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AuthLayout } from "@/components/layout/auth-layout";

function LoginForm() {
  const searchParams = useSearchParams();
  const registered = searchParams.get("registered");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState(
    registered === "verify"
      ? "Account created. Check your email to verify and activate your advertiser account."
      : "",
  );
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [showResend, setShowResend] = useState(false);

  async function handleResend() {
    if (!email.trim()) {
      setError("Enter your email address to resend verification.");
      return;
    }

    setResending(true);
    setError("");

    try {
      const res = await fetch("/api/v1/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      const data = await res.json().catch(() => null);
      setInfo(data?.message ?? "If an unverified account exists, a new verification link has been sent.");
      setShowResend(false);
    } catch {
      setError("Unable to resend verification email. Please try again.");
    } finally {
      setResending(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    setShowResend(false);

    try {
      const check = await fetch("/api/v1/auth/credentials-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
        }),
      });
      const checkData = await check.json().catch(() => null);

      if (!check.ok) {
        const code = checkData?.error?.code;
        setError(checkData?.error?.message ?? "Invalid email or password");
        if (code === "EMAIL_NOT_VERIFIED") {
          setShowResend(true);
        }
        return;
      }

      const result = await signIn("credentials", {
        email: email.trim().toLowerCase(),
        password,
        redirect: false,
        callbackUrl: "/",
      });

      if (!result?.ok || result.error) {
        setError("Invalid email or password");
        return;
      }

      window.location.href = "/";
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      badge="Secure sign in"
      title="Welcome back"
      description="Sign in to your LeadVix account and manage verified lead campaigns."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {info && (
          <Alert>
            <AlertDescription>{info}</AlertDescription>
          </Alert>
        )}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com"
            className="rounded-xl border-slate-200 bg-transparent"
            required
          />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <Label htmlFor="password">Password</Label>
            <Link href="/forgot-password" className="authLink shrink-0 text-sm underline-offset-2 hover:underline">
              Forgot Password
            </Link>
          </div>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="rounded-xl border-slate-200 bg-transparent"
            required
          />
        </div>
        <Button type="submit" className="authPrimaryBtn h-auto" disabled={loading}>
          {loading ? "Signing in..." : "Sign in"}
        </Button>
        {showResend && (
          <Button
            type="button"
            variant="outline"
            className="h-auto w-full"
            disabled={resending}
            onClick={() => void handleResend()}
          >
            {resending ? "Sending..." : "Resend verification email"}
          </Button>
        )}
      </form>
      <p className="authMuted mt-4 text-center">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="authLink hover:underline">
          Register
        </Link>
      </p>
    </AuthLayout>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="authMuted text-sm">Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}
