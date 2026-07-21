"use client";

import { Suspense, useCallback, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { PageRenderer } from "@/modules/page-builder/components/renderer/page-renderer";
import { PreviewDeviceToolbar } from "@/modules/page-builder/components/renderer/preview-device-toolbar";
import { parseBreakpointParam } from "@/modules/page-builder/lib/editor-canvas";
import type { CraftSerializedState } from "@/modules/page-builder/types/page-document";
import type { ThemeJson } from "@/modules/page-builder/lib/theme";
import type { FormJson } from "@/modules/page-builder/types/form-field";
import {
  attachSignalListeners,
  collectSubmissionSignals,
  createSignalCollector,
} from "@/modules/fraud/client/collect-signals";
import { readOptinTrackingParams } from "@/lib/optin-tracking-params";
import { resolveCpaOfferRedirectUrl } from "@cpl/shared";
import {
  isAcceptedLeadStatus,
  trackLeadConversion,
} from "@/lib/tracking/public-page-tracking";

type PublishedOptinFunnelProps = {
  slug: string;
  craftState: CraftSerializedState;
  theme: ThemeJson;
  formJson: FormJson | null;
  thankYouEnabled: boolean;
  destinationUrl?: string | null;
  cpaOfferId?: string | null;
  advertiserId?: string;
  previewMode?: boolean;
  testCampaignId?: string;
  thankYouPath?: string;
};

function PublishedOptinFunnelContent({
  slug,
  craftState,
  theme,
  formJson,
  thankYouEnabled,
  destinationUrl,
  cpaOfferId,
  advertiserId,
  previewMode,
  testCampaignId,
  thankYouPath,
}: PublishedOptinFunnelProps) {
  const signalRef = useRef(createSignalCollector());
  const searchParams = useSearchParams();
  const breakpoint = parseBreakpointParam(searchParams.get("bp"));
  const matchEditorCanvas = searchParams.get("frame") === "1";

  useEffect(() => {
    return attachSignalListeners(signalRef.current);
  }, []);

  const handleSubmit = useCallback(
    async (data: Record<string, string>) => {
      if (previewMode) return;

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
                  optinSlug: slug,
                  honeypot: data.honeypot ?? "",
                  submissionMeta,
                  deviceFingerprint,
                  trackingSlug,
                  source,
                  subId,
                }),
          }),
        },
      );

      const body = await res.json();
      if (!res.ok) {
        throw new Error(body.error?.message ?? "Submission failed");
      }

      const leadId = body.lead?.id as string | undefined;
      if (!leadId || !isAcceptedLeadStatus(body.lead?.status)) {
        throw new Error(
          leadId && !isAcceptedLeadStatus(body.lead?.status)
            ? "This submission could not be accepted. Please check your details and try again."
            : "Submission failed",
        );
      }

      if (!previewMode && !testCampaignId) {
        trackLeadConversion({ leadId });
      }

      if (thankYouEnabled && leadId) {
        const path = thankYouPath ?? `/o/${slug}/thank-you`;
        window.location.assign(`${path}?lead_id=${leadId}&txn_id=${leadId}`);
        return;
      }

      const redirectUrl = cpaOfferId && advertiserId
        ? resolveCpaOfferRedirectUrl(cpaOfferId, {
            advertiserId,
            src: source,
            subId,
            leadId,
          })
        : destinationUrl?.trim();
      if (redirectUrl && !previewMode) {
        window.location.assign(redirectUrl);
      }
    },
    [slug, thankYouEnabled, destinationUrl, cpaOfferId, advertiserId, previewMode, testCampaignId, thankYouPath],
  );

  const page = (
    <PageRenderer
      craftState={craftState}
      theme={theme}
      landingPageSlug={slug}
      formJson={formJson}
      fillParent={previewMode && matchEditorCanvas}
      breakpoint={previewMode ? breakpoint : undefined}
      matchEditorCanvas={previewMode && matchEditorCanvas}
      isGhl
      onLeadSubmit={previewMode ? undefined : handleSubmit}
      advertiserId={advertiserId}
    />
  );

  if (!previewMode && !testCampaignId) return page;

  return (
    <div className="flex min-h-screen w-full flex-col">
      <div className="shrink-0 border-b border-amber-200 bg-amber-50 px-4 py-2 text-center text-sm text-amber-900">
        {testCampaignId
          ? "Campaign test mode — this submission creates a Test lead, triggers the autoresponder, and is never charged."
          : "Preview mode — form submissions are disabled until you publish."}
      </div>
      {matchEditorCanvas && <PreviewDeviceToolbar isGhl />}
      {page}
    </div>
  );
}

export function PublishedOptinFunnel(props: PublishedOptinFunnelProps) {
  if (!props.previewMode) {
    return <PublishedOptinFunnelContent {...props} />;
  }

  return (
    <Suspense fallback={null}>
      <PublishedOptinFunnelContent {...props} />
    </Suspense>
  );
}
