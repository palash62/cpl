"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { PageRenderer } from "@/modules/page-builder/components/renderer/page-renderer";
import { PreviewDeviceToolbar } from "@/modules/page-builder/components/renderer/preview-device-toolbar";
import { parseBreakpointParam } from "@/modules/page-builder/lib/editor-canvas";
import { normalizePreviewCraft } from "@/modules/page-builder/lib/preview-craft";
import { buildPixelUrl } from "@/lib/campaign-pixel";
import type { PublicThankYouFunnel } from "@/lib/optin-funnel";

function ThankYouFunnelPageContent({
  page,
  origin,
}: {
  page: PublicThankYouFunnel;
  origin: string;
}) {
  const searchParams = useSearchParams();
  const breakpoint = parseBreakpointParam(searchParams.get("bp"));
  const matchEditorCanvas = page.previewMode && searchParams.get("frame") === "1";

  useEffect(() => {
    if (page.previewMode || !page.leadId) return;

    async function track() {
      await fetch("/api/v1/funnel-events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          funnelId: page.funnelId,
          campaignId: page.campaignId,
          leadId: page.leadId,
          eventType: "THANK_YOU_VIEW",
          step: "thank_you",
        }),
      });

      if (page.thankYouUseCampaignPixel && page.pixelToken && page.leadId) {
        const pixelUrl = buildPixelUrl(page.pixelToken);
        const img = new Image();
        img.src = `${pixelUrl.split("?")[0]}?lead_id=${encodeURIComponent(page.leadId)}&txn_id=${encodeURIComponent(page.leadId)}`;
        await fetch("/api/v1/funnel-events", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            funnelId: page.funnelId,
            campaignId: page.campaignId,
            leadId: page.leadId,
            eventType: "PIXEL_FIRE",
            step: "thank_you",
          }),
        });
      }
    }

    void track();
  }, [page, origin]);

  if (!page.thankYouCraftState?.craft) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="max-w-lg rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <h1 className="text-2xl font-bold text-slate-900">Thank you!</h1>
          <p className="mt-2 text-slate-600">Your submission was received successfully.</p>
        </div>
        {page.thankYouPixelHtml && (
          <div dangerouslySetInnerHTML={{ __html: page.thankYouPixelHtml }} />
        )}
      </div>
    );
  }

  const craftState = normalizePreviewCraft(page.thankYouCraftState.craft);

  return (
    <div className={matchEditorCanvas ? "flex min-h-screen flex-col" : undefined}>
      {page.previewMode && (
        <div className="shrink-0 border-b border-amber-200 bg-amber-50 px-4 py-2 text-center text-sm text-amber-900">
          Preview mode — thank you page
        </div>
      )}
      {matchEditorCanvas && <PreviewDeviceToolbar isGhl />}
      <PageRenderer
        craftState={craftState}
        theme={page.thankYouThemeJson}
        landingPageSlug={page.slug}
        formJson={null}
        fillParent={matchEditorCanvas}
        breakpoint={page.previewMode ? breakpoint : undefined}
        matchEditorCanvas={matchEditorCanvas}
        isGhl
        advertiserId={page.advertiserId}
        leadId={page.leadId ?? undefined}
        funnelId={page.funnelId}
        campaignId={page.campaignId}
      />
      {page.thankYouPixelHtml && (
        <div dangerouslySetInnerHTML={{ __html: page.thankYouPixelHtml }} />
      )}
    </div>
  );
}

export function ThankYouFunnelPage({
  page,
  origin,
}: {
  page: PublicThankYouFunnel;
  origin: string;
}) {
  if (!page.previewMode) {
    return <ThankYouFunnelPageContent page={page} origin={origin} />;
  }

  return (
    <Suspense fallback={null}>
      <ThankYouFunnelPageContent page={page} origin={origin} />
    </Suspense>
  );
}
