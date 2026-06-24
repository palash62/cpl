"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
}: {
  slug: string;
  campaignName: string;
  fields: Field[];
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
      body: JSON.stringify({ slug, data, honeypot }),
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
      <Card className="w-full max-w-md text-center shadow-md">
        <CardContent className="py-12">
          <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
          <h2 className="mt-4 text-xl font-bold">Thank you!</h2>
          <p className="text-muted-foreground">Your information has been submitted.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md shadow-md">
      <CardHeader>
        <CardTitle>{campaignName}</CardTitle>
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
          <Button type="submit" className="w-full" disabled={status === "loading"}>
            {status === "loading" ? "Submitting..." : "Submit"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
