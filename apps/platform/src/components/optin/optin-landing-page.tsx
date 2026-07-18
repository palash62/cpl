"use client";

import { useEffect, useRef, useState } from "react";
import type { PublicOptinPage } from "@/lib/optin-page";
import { OptinPageLayout, OptinSuccessScreen } from "@/components/optin/optin-page-layout";
import {
  attachSignalListeners,
  collectSubmissionSignals,
  createSignalCollector,
} from "@/modules/fraud/client/collect-signals";
import { readOptinTrackingParams } from "@/lib/optin-tracking-params";
import {
  isAcceptedLeadStatus,
  trackLeadConversion,
} from "@/lib/tracking/public-page-tracking";

export function OptinLandingPage({
  page,
  testCampaignId,
  thankYouPath,
}: {
  page: PublicOptinPage;
  testCampaignId?: string;
  thankYouPath?: string;
}) {
  const [data, setData] = useState<Record<string, string>>({});
  const [honeypot, setHoneypot] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [error, setError] = useState("");
  const signalRef = useRef(createSignalCollector());

  const redirectUrl = page.destinationUrl?.trim() || null;
  const readOnlyPreview = page.previewMode && !testCampaignId;

  useEffect(() => {
    return attachSignalListeners(signalRef.current);
  }, []);

  useEffect(() => {
    if (status !== "success" || readOnlyPreview || !redirectUrl) return;

    window.location.assign(redirectUrl);
  }, [status, readOnlyPreview, redirectUrl]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (readOnlyPreview) return;

    setStatus("loading");
    setError("");

    const { submissionMeta, deviceFingerprint } = collectSubmissionSignals(signalRef.current);
    const { trackingSlug, source, subId } = readOptinTrackingParams();

    const res = await fetch(
      testCampaignId
        ? `/api/v1/campaigns/${testCampaignId}/test-leads`
        : "/api/v1/leads/submit-optin",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          data,
          ...(testCampaignId
            ? {}
            : {
                optinSlug: page.slug,
                honeypot,
                submissionMeta,
                deviceFingerprint,
                trackingSlug,
                source,
                subId,
              }),
        }),
      },
    );

    const result = await res.json();
    if (!res.ok) {
      setStatus("error");
      setError(result.error?.message ?? "Submission failed");
      return;
    }

    const leadId = result.lead?.id as string | undefined;
    if (!leadId || !isAcceptedLeadStatus(result.lead?.status)) {
      setStatus("error");
      setError(
        leadId && !isAcceptedLeadStatus(result.lead?.status)
          ? "This submission could not be accepted. Please check your details and try again."
          : "Submission failed",
      );
      return;
    }

    if (!readOnlyPreview && !testCampaignId) {
      trackLeadConversion({ leadId });
    }

    if (page.thankYouEnabled && leadId && !readOnlyPreview) {
      const path = thankYouPath ?? `/o/${page.slug}/thank-you`;
      window.location.assign(`${path}?lead_id=${leadId}&txn_id=${leadId}`);
      return;
    }

    setStatus("success");
  }

  if (status === "success") {
    if (redirectUrl && !readOnlyPreview) {
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
          redirectUrl && readOnlyPreview
            ? `Preview mode — after publish, visitors redirect to ${redirectUrl}`
            : undefined
        }
      />
    );
  }

  return (
    <div className="relative">
      {(page.previewMode || testCampaignId) && (
        <div className="relative z-20 border-b border-amber-400/30 bg-amber-500/15 px-4 py-2 text-center text-sm font-medium text-amber-100">
          {testCampaignId
            ? "Campaign test mode — this submission creates a Test lead, triggers the autoresponder, and is never charged."
            : "Preview mode — form submissions are disabled until you publish."}
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
