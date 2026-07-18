import Script from "next/script";
import type { PublicPlatformPixelConfig } from "@/lib/tracking/platform-pixel-settings";

type PublicPageTrackingScriptsProps = {
  config: PublicPlatformPixelConfig;
};

export function PublicPageTrackingScripts({ config }: PublicPageTrackingScriptsProps) {
  const meta = config.meta;
  const googleAds = config.googleAds;

  if (!meta && !googleAds) return null;

  const publicConfigJson = JSON.stringify({
    meta: meta
      ? { enabled: true, pixelId: meta.pixelId }
      : null,
    googleAds: googleAds
      ? {
          enabled: true,
          conversionId: googleAds.conversionId,
          conversionLabel: googleAds.conversionLabel,
        }
      : null,
  });

  return (
    <>
      <Script id="cpl-public-tracking-config" strategy="afterInteractive">
        {`window.__cplPublicTrackingConfig=${publicConfigJson};`}
      </Script>

      {meta ? (
        <>
          <Script id="cpl-meta-pixel" strategy="afterInteractive">
            {`
window.__cplPublicTrackingConfig=${publicConfigJson};
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
window.__cplPublicTrackingConfig=${publicConfigJson};
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
