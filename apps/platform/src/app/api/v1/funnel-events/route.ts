import { errorResponse } from "@/lib/errors";
import { recordFunnelEvent } from "@/services/funnel-analytics.service";
import { z } from "zod";

const funnelEventSchema = z.object({
  funnelId: z.string().min(1),
  campaignId: z.string().min(1),
  leadId: z.string().optional(),
  eventType: z.enum(["VIEW", "SUBMIT", "THANK_YOU_VIEW", "PIXEL_FIRE"]),
  step: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = funnelEventSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { error: { code: "VALIDATION_ERROR", message: parsed.error.message, status: 422 } },
        { status: 422 },
      );
    }

    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      request.headers.get("x-real-ip") ??
      undefined;
    const userAgent = request.headers.get("user-agent") ?? undefined;

    await recordFunnelEvent({
      ...parsed.data,
      ip,
      userAgent,
    });

    return Response.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
