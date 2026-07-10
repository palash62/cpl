"use client";

import { useState } from "react";
import { signIn, getSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AuthLayout } from "@/components/layout/auth-layout";
import { getDashboardPath } from "@/lib/auth";
import type { UserRole } from "@prisma/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        email: email.trim().toLowerCase(),
        password,
        redirect: false,
      });

      if (!result?.ok || result.error) {
        setError("Invalid email or password");
        return;
      }

      router.refresh();
      const session = await getSession();
      const role = session?.user?.role as UserRole | undefined;

      if (role) {
        router.push(getDashboardPath(role));
        return;
      }

      // Full reload if client session lags behind the auth cookie
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
