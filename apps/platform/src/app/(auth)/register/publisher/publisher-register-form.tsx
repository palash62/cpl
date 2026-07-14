"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AuthLayout } from "@/components/layout/auth-layout";
import { PasswordRequirements } from "@/components/auth/password-requirements";
import { isStrongPassword } from "@/lib/password-policy";
import { COUNTRY_BY_CODE, getCountryName } from "@/lib/campaign-form";

const COUNTRY_OPTIONS = Object.keys(COUNTRY_BY_CODE).sort((a, b) =>
  getCountryName(a).localeCompare(getCountryName(b)),
);

export function PublisherRegisterForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [website, setWebsite] = useState("");
  const [trafficSource, setTrafficSource] = useState("");
  const [country, setCountry] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!isStrongPassword(password)) {
      setError("Password must be at least 8 characters and include uppercase, lowercase, a number, and a special character.");
      return;
    }

    setLoading(true);

    const res = await fetch("/api/v1/auth/register/publisher", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        email,
        password,
        website: website.trim() || undefined,
        trafficSource: trafficSource.trim() || undefined,
        country: country || undefined,
        addressLine1: addressLine1.trim() || undefined,
        addressLine2: addressLine2.trim() || undefined,
        city: city.trim() || undefined,
        state: state.trim() || undefined,
        postalCode: postalCode.trim() || undefined,
      }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error?.message ?? "Registration failed");
      return;
    }

    router.push("/login?registered=publisher-verify");
  }

  return (
    <AuthLayout
      badge="Publisher registration"
      title="Apply as a publisher"
      description="Verify your email, then our team will review your application before you can access the publisher portal."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <Label htmlFor="name">Full name</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="rounded-xl border-slate-200 bg-transparent"
            required
            minLength={2}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded-xl border-slate-200 bg-transparent"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={8}
            autoComplete="new-password"
            className="rounded-xl border-slate-200 bg-transparent"
            required
          />
          <PasswordRequirements password={password} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="website">Website</Label>
            <Input
              id="website"
              type="url"
              placeholder="https://example.com"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              className="rounded-xl border-slate-200 bg-transparent"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="trafficSource">Traffic source</Label>
            <Input
              id="trafficSource"
              placeholder="Facebook, TikTok, Email..."
              value={trafficSource}
              onChange={(e) => setTrafficSource(e.target.value)}
              className="rounded-xl border-slate-200 bg-transparent"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="country">Country</Label>
          <Select value={country} onValueChange={(value) => value && setCountry(value)}>
            <SelectTrigger id="country" className="w-full rounded-xl border-slate-200 bg-transparent">
              <SelectValue placeholder="Select country (optional)" />
            </SelectTrigger>
            <SelectContent>
              {COUNTRY_OPTIONS.map((code) => (
                <SelectItem key={code} value={code}>
                  {getCountryName(code)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="addressLine1">Address line 1</Label>
          <Input
            id="addressLine1"
            value={addressLine1}
            onChange={(e) => setAddressLine1(e.target.value)}
            className="rounded-xl border-slate-200 bg-transparent"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="addressLine2">Address line 2</Label>
          <Input
            id="addressLine2"
            value={addressLine2}
            onChange={(e) => setAddressLine2(e.target.value)}
            className="rounded-xl border-slate-200 bg-transparent"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="city">City</Label>
            <Input
              id="city"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="rounded-xl border-slate-200 bg-transparent"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="state">State / Region</Label>
            <Input
              id="state"
              value={state}
              onChange={(e) => setState(e.target.value)}
              className="rounded-xl border-slate-200 bg-transparent"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="postalCode">Postal code</Label>
          <Input
            id="postalCode"
            value={postalCode}
            onChange={(e) => setPostalCode(e.target.value)}
            className="rounded-xl border-slate-200 bg-transparent"
          />
        </div>

        <Button type="submit" className="authPrimaryBtn h-auto" disabled={loading}>
          {loading ? "Submitting application..." : "Submit application"}
        </Button>
      </form>

      <p className="authMuted mt-4 text-center text-sm">
        Want to buy leads instead?{" "}
        <Link href="/register" className="authLink hover:underline">
          Register as advertiser
        </Link>
      </p>
      <p className="authMuted mt-2 text-center">
        Already have an account?{" "}
        <Link href="/login" className="authLink hover:underline">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  );
}
