"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AuthLayout } from "@/components/layout/auth-layout";

export default function RegisterPage() {
  const router = useRouter();
  const [role, setRole] = useState<"ADVERTISER" | "PUBLISHER">("ADVERTISER");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [company, setCompany] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await fetch("/api/v1/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password, role, company }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error?.message ?? "Registration failed");
      return;
    }

    router.push("/login?registered=true");
  }

  return (
    <AuthLayout title="Create account" description="Join the CPL Platform marketplace">
      <Tabs value={role} onValueChange={(v) => setRole(v as typeof role)} className="mb-4">
        <TabsList className="grid w-full grid-cols-2 rounded-xl">
          <TabsTrigger value="ADVERTISER">Advertiser</TabsTrigger>
          <TabsTrigger value="PUBLISHER">Publisher</TabsTrigger>
        </TabsList>
      </Tabs>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <div className="space-y-2">
          <Label htmlFor="name">Full Name</Label>
          <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="rounded-xl border-slate-200" required />
        </div>
        {role === "ADVERTISER" && (
          <div className="space-y-2">
            <Label htmlFor="company">Company</Label>
            <Input id="company" value={company} onChange={(e) => setCompany(e.target.value)} className="rounded-xl border-slate-200" />
          </div>
        )}
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="rounded-xl border-slate-200" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={8} className="rounded-xl border-slate-200" required />
        </div>
        <Button type="submit" className="w-full rounded-xl" disabled={loading}>
          {loading ? "Creating account..." : "Create account"}
        </Button>
      </form>
      <p className="mt-4 text-center text-sm text-slate-500">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-[var(--theme-primary)] hover:underline">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  );
}
