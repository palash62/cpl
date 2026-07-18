import type { ReactNode } from "react";
import { PublicPageTrackingScripts } from "@/components/tracking/public-page-tracking-scripts";
import { getPublicPlatformPixelConfig } from "@/services/platform-pixel-settings.service";

export async function withPublicPageTracking(node: ReactNode) {
  const config = await getPublicPlatformPixelConfig();
  if (!config.meta && !config.googleAds) return node;

  return (
    <>
      <PublicPageTrackingScripts config={config} />
      {node}
    </>
  );
}
