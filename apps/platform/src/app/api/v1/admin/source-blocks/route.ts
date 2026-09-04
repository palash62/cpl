import { withAuth, ADMIN_PORTAL_ROLES } from "@/lib/api-handler";
import { blockSource, unblockSource } from "@/services/source-optimization.service";
import { AppError } from "@/lib/errors";
import { z } from "zod";

const blockSchema = z.object({
  advertiserId: z.string().min(1),
  sourceToken: z.string().min(1),
  reason: z.string().max(200).optional(),
});

export async function POST(request: Request) {
  return withAuth(async () => {
    try {
      const body = await request.json();
      const parsed = blockSchema.safeParse(body);
      if (!parsed.success) {
        return Response.json(
          { error: { code: "VALIDATION_ERROR", message: parsed.error.message, status: 422 } },
          { status: 422 },
        );
      }

      const block = await blockSource(
        parsed.data.advertiserId,
        parsed.data.sourceToken,
        parsed.data.reason,
      );
      return Response.json({ data: block });
    } catch (err) {
      if (err instanceof AppError) {
        return Response.json(
          { error: { code: err.code, message: err.message, status: err.status } },
          { status: err.status },
        );
      }
      throw err;
    }
  }, ADMIN_PORTAL_ROLES);
}

export async function DELETE(request: Request) {
  return withAuth(async () => {
    const params = new URL(request.url).searchParams;
    const advertiserId = params.get("advertiserId");
    const sourceToken = params.get("sourceToken");
    if (!advertiserId || !sourceToken) {
      return Response.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: "advertiserId and sourceToken required",
            status: 422,
          },
        },
        { status: 422 },
      );
    }
    await unblockSource(advertiserId, sourceToken);
    return Response.json({ data: { success: true } });
  }, ADMIN_PORTAL_ROLES);
}
