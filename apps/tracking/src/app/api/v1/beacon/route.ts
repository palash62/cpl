import { logClick } from "@cpl/tracking-core";
import { sanitizeTrackingParam } from "@cpl/shared";
import { z } from "zod";

const beaconSchema = z.object({
  slug: z.string().min(1),
  referrer: z.string().optional(),
  source: z.string().optional(),
  sub_id: z.string().optional(),
});

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = beaconSchema.safeParse(body);

  if (!parsed.success) {
    return Response.json({ error: { code: "VALIDATION_ERROR" } }, { status: 422 });
  }

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "0.0.0.0";

  await logClick(parsed.data.slug, {
    ip,
    userAgent: request.headers.get("user-agent") ?? undefined,
    referrer: parsed.data.referrer,
    source: sanitizeTrackingParam(parsed.data.source ?? null),
    subId: sanitizeTrackingParam(parsed.data.sub_id ?? null),
  });

  return Response.json({ ok: true });
}
