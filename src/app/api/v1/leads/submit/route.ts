import { errorResponse } from "@/lib/errors";
import { leadSubmitSchema } from "@/lib/validations";
import { submitLead } from "@/services/lead.service";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = leadSubmitSchema.safeParse(body);

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
    const lead = await submitLead({
      slug: parsed.data.slug,
      data: parsed.data.data,
      honeypot: parsed.data.honeypot,
      ip,
      userAgent: request.headers.get("user-agent") ?? undefined,
      source: parsed.data.source,
      subId: parsed.data.subId,
      deviceFingerprint: parsed.data.deviceFingerprint,
      submissionMeta: parsed.data.submissionMeta,
    });

    return Response.json({ lead: { id: lead.id, status: lead.status } }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
