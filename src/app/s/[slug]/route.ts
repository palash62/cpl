import { NextRequest, NextResponse } from "next/server";
import { sanitizeTrackingParam } from "@/lib/smart-link";
import { lookupIpCountry } from "@/modules/fraud/providers/registry";
import { logClick } from "@/services/lead.service";
import { pickNextCampaign, resolveSmartLinkBySlug } from "@/services/smart-link.service";
function getClientIp(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "0.0.0.0"
  );
}

function noOffersHtml(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>No Offers Available</title>
<style>body{font-family:system-ui,sans-serif;display:flex;min-height:100vh;align-items:center;justify-content:center;background:#f8fafc;margin:0}
.card{max-width:28rem;padding:2rem;border-radius:1rem;background:#fff;border:1px solid #e2e8f0;text-align:center;box-shadow:0 4px 24px rgba(15,23,42,.06)}
h1{font-size:1.25rem;color:#0f172a;margin:0 0 .5rem}p{color:#64748b;margin:0;font-size:.95rem}</style></head>
<body><div class="card"><h1>No offers available</h1><p>Check back soon — new campaigns are added regularly.</p></div></body></html>`;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const smartLink = await resolveSmartLinkBySlug(slug);

  if (!smartLink || smartLink.publisher.role !== "PUBLISHER" || smartLink.publisher.status !== "ACTIVE") {
    return new NextResponse("Not found", { status: 404 });
  }

  const src = sanitizeTrackingParam(request.nextUrl.searchParams.get("src"));
  const subId = sanitizeTrackingParam(request.nextUrl.searchParams.get("sub_id"));
  const ip = getClientIp(request);
  const countryCode = await lookupIpCountry(ip);

  const result = await pickNextCampaign(smartLink.publisherId, { ip, countryCode });
  if (!result.trackingSlug) {
    if (result.globalLinkUrl) {
      try {
        const redirectUrl = result.globalLinkUrl.startsWith("/")
          ? new URL(result.globalLinkUrl, request.nextUrl.origin)
          : new URL(result.globalLinkUrl);
        if (src) redirectUrl.searchParams.set("src", src);
        if (subId) redirectUrl.searchParams.set("sub_id", subId);
        return NextResponse.redirect(redirectUrl.toString(), 302);
      } catch {
        return new NextResponse("Invalid global link configured", { status: 500 });
      }
    }

    return new NextResponse(noOffersHtml(), {
      status: 200,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }

  await logClick(result.trackingSlug, {
    ip,
    userAgent: request.headers.get("user-agent") ?? undefined,
    referrer: request.headers.get("referer") ?? undefined,
    geo: countryCode ? { country: countryCode } : undefined,
    source: src,
    subId,
  });
  const redirectUrl = new URL(`/t/${result.trackingSlug}`, request.nextUrl.origin);
  if (src) redirectUrl.searchParams.set("src", src);
  if (subId) redirectUrl.searchParams.set("sub_id", subId);

  return NextResponse.redirect(redirectUrl, 302);
}
