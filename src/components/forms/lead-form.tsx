"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle } from "lucide-react";

interface Field {
  fieldName: string;
  label: string;
  fieldType: string;
  required: boolean;
}

export function LeadForm({
  slug,
  campaignName,
  fields,
  source,
  subId,
}: {
  slug: string;
  campaignName: string;
  fields: Field[];
  source?: string;
  subId?: string;
}) {
  const [data, setData] = useState<Record<string, string>>({});
  const [honeypot, setHoneypot] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setError("");

    const res = await fetch("/api/v1/leads/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug, data, honeypot, source, subId }),
    });

    const result = await res.json();
    if (!res.ok) {
      setStatus("error");
      setError(result.error?.message ?? "Submission failed");
      return;
    }
    setStatus("success");
  }

  if (status === "success") {
    return (
      <div className="premium-card w-full max-w-md text-center shadow-lg">
        <CardContent className="py-12">
          <CheckCircle className="mx-auto h-12 w-12 text-emerald-500" />
          <h2 className="mt-4 text-xl font-bold text-slate-900">Thank you!</h2>
          <p className="text-slate-500">Your information has been submitted.</p>
        </CardContent>
      </div>
    );
  }

  return (
    <div className="premium-card w-full max-w-md shadow-lg">
      <div className="h-1.5 rounded-t-[18px] bg-gradient-to-r from-[var(--theme-gradient-from)] to-[var(--theme-gradient-to)]" />
      <CardHeader>
        <CardTitle className="text-slate-900">{campaignName}</CardTitle>
        <CardDescription>Fill out the form below to get started</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <input
            type="text"
            name="website"
            value={honeypot}
            onChange={(e) => setHoneypot(e.target.value)}
            className="hidden"
            tabIndex={-1}
            autoComplete="off"
          />
          {fields.map((field) => (
            <div key={field.fieldName} className="space-y-2">
              <Label htmlFor={field.fieldName}>{field.label}</Label>
              <Input
                id={field.fieldName}
                type={field.fieldType === "email" ? "email" : field.fieldType === "phone" ? "tel" : "text"}
                required={field.required}
                value={data[field.fieldName] ?? ""}
                onChange={(e) => setData({ ...data, [field.fieldName]: e.target.value })}
              />
            </div>
          ))}
          <Button
            type="submit"
            className="w-full bg-[var(--theme-primary)] hover:opacity-90"
            disabled={status === "loading"}
          >
            {status === "loading" ? "Submitting..." : "Submit"}
          </Button>
        </form>
      </CardContent>
    </div>
  );
}
