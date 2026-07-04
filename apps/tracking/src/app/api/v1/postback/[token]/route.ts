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

  const event = await recordPixelFire({
    pixelToken: token,
    leadId,
    txnId,
    ip,
    userAgent: request.headers.get("user-agent") ?? undefined,
  });

  if (!event) {
    return Response.json({ error: { code: "NOT_FOUND" } }, { status: 404 });
  }

  return Response.json({ ok: true, id: event.id });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  return GET(request, { params });
}
