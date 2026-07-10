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

type PublishedOptinFunnelProps = {
  slug: string;
  craftState: CraftSerializedState;
  theme: ThemeJson;
  formJson: FormJson | null;
  thankYouEnabled: boolean;
  destinationUrl?: string | null;
  previewMode?: boolean;
};

function PublishedOptinFunnelContent({
  slug,
  craftState,
  theme,
  formJson,
  thankYouEnabled,
  destinationUrl,
  previewMode,
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
      fillParent={previewMode && matchEditorCanvas}
      breakpoint={previewMode && matchEditorCanvas ? breakpoint : undefined}
      matchEditorCanvas={previewMode && matchEditorCanvas}
      isGhl
      onLeadSubmit={previewMode ? undefined : handleSubmit}
    />
  );

  if (!previewMode) return page;

  return (
    <div className="flex min-h-screen w-full flex-col">
      <div className="shrink-0 border-b border-amber-200 bg-amber-50 px-4 py-2 text-center text-sm text-amber-900">
        Preview mode — form submissions are disabled until you publish.
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
