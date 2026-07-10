"use client";

import { useCallback, useEffect, useRef } from "react";
import { PageRenderer } from "@/modules/page-builder/components/renderer/page-renderer";
import type { CraftSerializedState } from "@/modules/page-builder/types/page-document";
import type { ThemeJson } from "@/modules/page-builder/lib/theme";
import type { FormJson } from "@/modules/page-builder/types/form-field";
import {
  attachSignalListeners,
  collectSubmissionSignals,
  createSignalCollector,
} from "@/modules/fraud/client/collect-signals";
import { readOptinTrackingParams } from "@/lib/optin-tracking-params";

type PublishedOptinFunnelProps = {
  slug: string;
  craftState: CraftSerializedState;
  theme: ThemeJson;
  formJson: FormJson | null;
  thankYouEnabled: boolean;
  destinationUrl?: string | null;
  previewMode?: boolean;
};

export function PublishedOptinFunnel({
  slug,
  craftState,
  theme,
  formJson,
  thankYouEnabled,
  destinationUrl,
  previewMode,
}: PublishedOptinFunnelProps) {
  const signalRef = useRef(createSignalCollector());

  useEffect(() => {
    return attachSignalListeners(signalRef.current);
  }, []);

  const handleSubmit = useCallback(
    async (data: Record<string, string>) => {
      if (previewMode) return;

      const { submissionMeta, deviceFingerprint } = collectSubmissionSignals(signalRef.current);
      const { trackingSlug, source, subId } = readOptinTrackingParams();

      const res = await fetch("/api/v1/leads/submit-optin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          optinSlug: slug,
          data,
          honeypot: data.honeypot ?? "",
          submissionMeta,
          deviceFingerprint,
          trackingSlug,
          source,
          subId,
        }),
      });

      const body = await res.json();
      if (!res.ok) {
        throw new Error(body.error?.message ?? "Submission failed");
      }

      const leadId = body.lead?.id as string | undefined;
      if (thankYouEnabled && leadId) {
        window.location.assign(`/o/${slug}/thank-you?lead_id=${leadId}&txn_id=${leadId}`);
        return;
      }

      const redirectUrl = destinationUrl?.trim();
      if (redirectUrl && !previewMode) {
        window.location.assign(redirectUrl);
      }
    },
    [slug, thankYouEnabled, destinationUrl, previewMode],
  );

  const page = (
    <PageRenderer
      craftState={craftState}
      theme={theme}
      landingPageSlug={slug}
      formJson={formJson}
      fillParent={previewMode}
      onLeadSubmit={previewMode ? undefined : handleSubmit}
    />
  );

  if (!previewMode) return page;

  return (
    <div className="flex min-h-screen w-full flex-col">
      <div className="shrink-0 border-b border-amber-200 bg-amber-50 px-4 py-2 text-center text-sm text-amber-900">
        Preview mode — form submissions are disabled until you publish.
      </div>
      {page}
    </div>
  );
}
