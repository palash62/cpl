import { revalidatePath } from "next/cache";
import { withAuth } from "@/lib/api-handler";
import { AppError, errorResponse } from "@/lib/errors";
import { isStalePrismaClientError } from "@/lib/prisma";
import { optinPageUpdateSchema } from "@/lib/validations";
import {
  getOrCreateAdvertiserOptinPage,
  updateAdvertiserOptinPage,
} from "@/services/optin-page.service";

export async function GET() {
  return withAuth(async (session) => {
    const page = await getOrCreateAdvertiserOptinPage(session.user.id);
    return Response.json({ page });
  }, ["ADVERTISER"]);
}

export async function PUT(request: Request) {
  return withAuth(async (session) => {
    try {
      const body = await request.json();
      const parsed = optinPageUpdateSchema.safeParse(body);

      if (!parsed.success) {
        return Response.json(
          { error: { code: "VALIDATION_ERROR", message: parsed.error.message, status: 422 } },
          { status: 422 },
        );
      }

      const page = await updateAdvertiserOptinPage(session.user.id, {
        title: parsed.data.title,
        slug: parsed.data.slug,
        destinationUrl: parsed.data.destinationUrl?.trim() || null,
        headline: parsed.data.headline,
        subheadline: parsed.data.subheadline,
        description: parsed.data.description ?? null,
        ctaText: parsed.data.ctaText,
        successTitle: parsed.data.successTitle,
        successMessage: parsed.data.successMessage,
        badgeText: parsed.data.badgeText ?? null,
        bulletPoints: parsed.data.bulletPoints,
        primaryColor: parsed.data.primaryColor,
        accentColor: parsed.data.accentColor,
        isPublished: parsed.data.isPublished,
        templateId: parsed.data.templateId,
      });

      revalidatePath("/advertiser/optin-pages");
      revalidatePath("/advertiser/optin-pages/edit");

      return Response.json({ page });
    } catch (error) {
      if (isStalePrismaClientError(error)) {
        return errorResponse(
          new AppError(
            "SCHEMA_OUT_OF_DATE",
            "The dev server is using an outdated database client. Restart `npm run dev` and save again.",
            500,
          ),
        );
      }
      if (error instanceof Error && error.message) {
        return errorResponse(new AppError("VALIDATION_ERROR", error.message, 422));
      }
      return errorResponse(error);
    }
  }, ["ADVERTISER"]);
}
