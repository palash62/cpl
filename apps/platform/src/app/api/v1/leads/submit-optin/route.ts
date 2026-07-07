import { errorResponse } from "@/lib/errors";
import { optinSubmitSchema } from "@/lib/validations";
import { submitOptinLead } from "@/services/lead.service";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = optinSubmitSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        { error: { code: "VALIDATION_ERROR", message: parsed.error.message, status: 422 } },
        { status: 422 },
      );
    }

    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      request.headers.get("x-real-ip") ??
      "unknown";

    const lead = await submitOptinLead({
      optinSlug: parsed.data.optinSlug,
      data: parsed.data.data,
      honeypot: parsed.data.honeypot,
      ip,
      userAgent: request.headers.get("user-agent") ?? undefined,
      deviceFingerprint: parsed.data.deviceFingerprint,
      submissionMeta: parsed.data.submissionMeta,
    });

    const optinPage = await prisma.advertiserOptinPage.findUnique({
      where: { slug: parsed.data.optinSlug },
      select: { id: true, campaignId: true },
    });
    if (optinPage?.campaignId) {
      try {
        const { recordFunnelEvent } = await import("@/services/funnel-analytics.service");
        await recordFunnelEvent({
          funnelId: optinPage.id,
          campaignId: optinPage.campaignId,
          leadId: lead.id,
          eventType: "SUBMIT",
          step: "optin",
          ip,
          userAgent: request.headers.get("user-agent") ?? undefined,
        });
      } catch (eventError) {
        console.error("Failed to record funnel submit event", eventError);
      }
    }

    return Response.json({ lead: { id: lead.id, status: lead.status } }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
