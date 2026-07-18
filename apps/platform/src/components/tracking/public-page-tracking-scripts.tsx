"use client";

import Script from "next/script";
import { useEffect } from "react";
import type { PublicPlatformPixelConfig } from "@/lib/tracking/platform-pixel-settings";
import { setPublicTrackingConfig } from "@/lib/tracking/public-page-tracking";

type PublicPageTrackingScriptsProps = {
  config: PublicPlatformPixelConfig;
  disabled?: boolean;
};

export function PublicPageTrackingScripts({
  config,
  disabled = false,
}: PublicPageTrackingScriptsProps) {
  const meta = disabled ? null : config.meta;
  const googleAds = disabled ? null : config.googleAds;
  const metaPixelId = meta?.pixelId ?? "";
  const googleConversionId = googleAds?.conversionId ?? "";
  const googleConversionLabel = googleAds?.conversionLabel ?? "";

  useEffect(() => {
    if (disabled) {
      setPublicTrackingConfig({ meta: null, googleAds: null });
      return () => setPublicTrackingConfig(null);
    }

    setPublicTrackingConfig({
      meta: metaPixelId
        ? { enabled: true, pixelId: metaPixelId }
        : null,
      googleAds:
        googleConversionId && googleConversionLabel
          ? {
              enabled: true,
              conversionId: googleConversionId,
              conversionLabel: googleConversionLabel,
            }
          : null,
    });
    return () => setPublicTrackingConfig(null);
  }, [disabled, metaPixelId, googleConversionId, googleConversionLabel]);

  if (disabled) return null;

  if (!meta && !googleAds) return null;

  return (
    <>
      {meta ? (
        <>
          <Script id="cpl-meta-pixel" strategy="afterInteractive">
            {`
!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', ${JSON.stringify(meta.pixelId)});
fbq('track', 'PageView');
            `}
          </Script>
          <noscript>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              height="1"
              width="1"
              style={{ display: "none" }}
              src={`https://www.facebook.com/tr?id=${encodeURIComponent(meta.pixelId)}&ev=PageView&noscript=1`}
              alt=""
            />
          </noscript>
        </>
      ) : null}

      {googleAds ? (
        <>
          <Script
            id="cpl-google-ads-src"
            src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(googleAds.conversionId)}`}
            strategy="afterInteractive"
          />
          <Script id="cpl-google-ads-init" strategy="afterInteractive">
            {`
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
window.gtag = gtag;
gtag('js', new Date());
gtag('config', ${JSON.stringify(googleAds.conversionId)});
            `}
          </Script>
        </>
      ) : null}
    </>
  );
}
