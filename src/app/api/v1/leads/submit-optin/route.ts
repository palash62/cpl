import { errorResponse } from "@/lib/errors";
import { optinSubmitSchema } from "@/lib/validations";
import { submitOptinLead } from "@/services/lead.service";

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
    });

    return Response.json({ lead: { id: lead.id, status: lead.status } }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
