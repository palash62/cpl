import { errorResponse } from "@/lib/errors";
import { landingSubmitSchema } from "@/lib/validations";
import { submitLandingLead } from "@/services/lead.service";
import { trackPageEvent } from "@/modules/page-builder/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = landingSubmitSchema.safeParse(body);

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

    const lead = await submitLandingLead({
      landingPageSlug: parsed.data.landingPageSlug,
      data: parsed.data.data,
      honeypot: parsed.data.honeypot,
      ip,
      userAgent: request.headers.get("user-agent") ?? undefined,
      deviceFingerprint: parsed.data.deviceFingerprint,
      submissionMeta: parsed.data.submissionMeta,
    });

    void trackPageEvent({
      landingPageId: lead.campaignId,
      slug: parsed.data.landingPageSlug,
      event: "form_submit",
    });

    return Response.json({ lead: { id: lead.id, status: lead.status } }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
