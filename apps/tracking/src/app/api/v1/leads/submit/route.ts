import { buildPlatformLeadSubmitUrl, getInternalServiceToken } from "@cpl/shared";
import { errorResponse } from "@/lib/errors";
import { leadSubmitSchema } from "@/lib/validations";

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

    const token = getInternalServiceToken();
    if (!token) {
      return Response.json(
        { error: { code: "CONFIG_ERROR", message: "Service token not configured", status: 500 } },
        { status: 500 },
      );
    }

    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      request.headers.get("x-real-ip") ??
      "unknown";

    const platformRes = await fetch(buildPlatformLeadSubmitUrl(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Service-Token": token,
        "X-Forwarded-For": ip,
        "User-Agent": request.headers.get("user-agent") ?? "",
      },
      body: JSON.stringify(parsed.data),
    });

    const result = await platformRes.json();
    return Response.json(result, { status: platformRes.status });
  } catch (error) {
    return errorResponse(error);
  }
}
