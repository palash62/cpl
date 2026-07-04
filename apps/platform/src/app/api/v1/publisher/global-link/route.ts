import { withAuth } from "@/lib/api-handler";
import { errorResponse } from "@/lib/errors";
import { updatePublisherGlobalLinkSchema } from "@/lib/validations";
import { updatePublisherGlobalLink } from "@/services/user.service";

function validateGlobalLinkUrl(url: string | null): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    if (!["http:", "https:"].includes(parsed.protocol)) {
      throw new Error("invalid protocol");
    }
    return url;
  } catch {
    throw new Error("Enter a valid global link URL");
  }
}

export async function PATCH(request: Request) {
  return withAuth(async (session) => {
    if (session.user.role !== "PUBLISHER") {
      return Response.json(
        { error: { code: "FORBIDDEN", message: "Publishers only", status: 403 } },
        { status: 403 },
      );
    }

    try {
      const body = await request.json();
      const parsed = updatePublisherGlobalLinkSchema.safeParse(body);
      if (!parsed.success) {
        const message = parsed.error.issues[0]?.message ?? "Please check the form and try again";
        return Response.json(
          { error: { code: "VALIDATION_ERROR", message, status: 422 } },
          { status: 422 },
        );
      }

      let globalLinkUrl: string | null = null;
      if (parsed.data.globalLinkUrl) {
        try {
          globalLinkUrl = validateGlobalLinkUrl(parsed.data.globalLinkUrl);
        } catch (error) {
          return Response.json(
            {
              error: {
                code: "VALIDATION_ERROR",
                message: error instanceof Error ? error.message : "Invalid URL",
                status: 422,
              },
            },
            { status: 422 },
          );
        }
      }

      const user = await updatePublisherGlobalLink(session.user.id, globalLinkUrl);
      return Response.json({ data: { globalLinkUrl: user?.publisherProfile?.globalLinkUrl ?? null } });
    } catch (error) {
      return errorResponse(error);
    }
  }, ["PUBLISHER"]);
}
