import { recordPixelFire } from "@cpl/tracking-core";
import { z } from "zod";

const conversionSchema = z.object({
  token: z.string().min(1),
  lead_id: z.string().optional(),
  txn_id: z.string().optional(),
  value: z.number().optional(),
});

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = conversionSchema.safeParse(body);

  if (!parsed.success) {
    return Response.json(
      { error: { code: "VALIDATION_ERROR", message: parsed.error.message } },
      { status: 422 },
    );
  }

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    undefined;

  const event = await recordPixelFire({
    pixelToken: parsed.data.token,
    leadId: parsed.data.lead_id,
    txnId: parsed.data.txn_id,
    ip,
    userAgent: request.headers.get("user-agent") ?? undefined,
  });

  if (!event) {
    return Response.json({ error: { code: "NOT_FOUND", message: "Invalid token" } }, { status: 404 });
  }

  return Response.json({ ok: true, id: event.id });
}
