"use client";

import { useEffect } from "react";
import { PageRenderer } from "@/modules/page-builder/components/renderer/page-renderer";
import { buildPixelUrl } from "@/lib/campaign-pixel";
import type { PublicThankYouFunnel } from "@/lib/optin-funnel";

export function ThankYouFunnelPage({
  page,
  origin,
}: {
  page: PublicThankYouFunnel;
  origin: string;
}) {
  useEffect(() => {
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

      if (page.thankYouUseCampaignPixel && page.pixelToken) {
        const pixelUrl = buildPixelUrl(origin, page.pixelToken);
        const img = new Image();
        img.src = `${pixelUrl}?lead_id=${encodeURIComponent(page.leadId)}&txn_id=${encodeURIComponent(page.leadId)}`;
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

  return (
    <div>
      <PageRenderer
        craftState={page.thankYouCraftState.craft}
        theme={page.thankYouThemeJson}
        landingPageSlug={page.slug}
        formJson={null}
      />
      {page.thankYouPixelHtml && (
        <div dangerouslySetInnerHTML={{ __html: page.thankYouPixelHtml }} />
      )}
    </div>
  );
}
