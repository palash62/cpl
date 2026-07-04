import { TRANSPARENT_GIF } from "@/lib/campaign-pixel.server";
import { recordPixelFire } from "@cpl/tracking-core";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const { searchParams } = new URL(request.url);
  const leadId = searchParams.get("lead_id") ?? undefined;
  const txnId = searchParams.get("txn_id") ?? undefined;

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    undefined;
  const userAgent = request.headers.get("user-agent") ?? undefined;

  try {
    await recordPixelFire({ pixelToken: token, leadId, txnId, ip, userAgent });
  } catch {
    // Always return the pixel image so advertiser pages are not broken.
  }

  return new Response(TRANSPARENT_GIF, {
    status: 200,
    headers: {
      "Content-Type": "image/gif",
      "Cache-Control": "no-store, no-cache, must-revalidate",
    },
  });
}
