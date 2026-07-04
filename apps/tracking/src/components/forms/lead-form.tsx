"use client";

import { useState } from "react";

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
      body: JSON.stringify({
        slug,
        data,
        honeypot,
        source,
        subId,
        submissionMeta: { formDurationMs: 0 },
      }),
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
      <div className="premium-card form-card">
        <div className="success-body">
          <h2>Thank you!</h2>
          <p>Your information has been submitted.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="premium-card form-card">
      <div className="form-bar" />
      <div className="form-body">
        <h2>{campaignName}</h2>
        <p className="subtitle">Fill out the form below to get started</p>
        <form onSubmit={handleSubmit} className="form-fields">
          {error && <div className="form-error">{error}</div>}
          <input
            type="text"
            name="website"
            value={honeypot}
            onChange={(e) => setHoneypot(e.target.value)}
            style={{ display: "none" }}
            tabIndex={-1}
            autoComplete="off"
          />
          {fields.map((field) => (
            <div key={field.fieldName}>
              <label htmlFor={field.fieldName}>{field.label}</label>
              <input
                id={field.fieldName}
                type={field.fieldType === "email" ? "email" : field.fieldType === "phone" ? "tel" : "text"}
                required={field.required}
                value={data[field.fieldName] ?? ""}
                onChange={(e) => setData({ ...data, [field.fieldName]: e.target.value })}
              />
            </div>
          ))}
          <button type="submit" className="form-submit" disabled={status === "loading"}>
            {status === "loading" ? "Submitting..." : "Submit"}
          </button>
        </form>
      </div>
    </div>
  );
}
