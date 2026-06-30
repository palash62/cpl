"use client";

import { useEffect, useRef, useState } from "react";
import type { PublicOptinPage } from "@/lib/optin-page";
import { OptinPageLayout, OptinSuccessScreen } from "@/components/optin/optin-page-layout";
import {
  attachSignalListeners,
  collectSubmissionSignals,
  createSignalCollector,
} from "@/modules/fraud/client/collect-signals";

export function OptinLandingPage({ page }: { page: PublicOptinPage }) {
  const [data, setData] = useState<Record<string, string>>({});
  const [honeypot, setHoneypot] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [error, setError] = useState("");
  const signalRef = useRef(createSignalCollector());

  const redirectUrl = page.destinationUrl?.trim() || null;

  useEffect(() => {
    return attachSignalListeners(signalRef.current);
  }, []);

  useEffect(() => {
    if (status !== "success" || page.previewMode || !redirectUrl) return;

    window.location.assign(redirectUrl);
  }, [status, page.previewMode, redirectUrl]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (page.previewMode) return;

    setStatus("loading");
    setError("");

    const { submissionMeta, deviceFingerprint } = collectSubmissionSignals(signalRef.current);

    const res = await fetch("/api/v1/leads/submit-optin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ optinSlug: page.slug, data, honeypot, submissionMeta, deviceFingerprint }),
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
    if (redirectUrl && !page.previewMode) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-center text-slate-200">
          <p className="text-sm">Redirecting you…</p>
        </div>
      );
    }

    return (
      <OptinSuccessScreen
        page={page}
        redirectNote={
          redirectUrl && page.previewMode
            ? `Preview mode — after publish, visitors redirect to ${redirectUrl}`
            : undefined
        }
      />
    );
  }

  return (
    <div className="relative">
      {page.previewMode && (
        <div className="relative z-20 border-b border-amber-400/30 bg-amber-500/15 px-4 py-2 text-center text-sm font-medium text-amber-100">
          Preview mode — form submissions are disabled until you publish.
        </div>
      )}
      <OptinPageLayout
        page={page}
        data={data}
        setData={setData}
        honeypot={honeypot}
        setHoneypot={setHoneypot}
        error={error}
        status={status}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
