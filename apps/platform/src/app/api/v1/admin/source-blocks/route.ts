import { withAuth, ADMIN_PORTAL_ROLES } from "@/lib/api-handler";
import { blockSource, unblockSource } from "@/services/source-optimization.service";
import { errorResponse, Errors } from "@/lib/errors";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const blockSchema = z.object({
  advertiserId: z.string().min(1),
  sourceToken: z.string().min(1),
  reason: z.string().max(200).optional(),
});

async function assertAdvertiser(advertiserId: string) {
  const advertiser = await prisma.user.findFirst({
    where: { id: advertiserId, role: "ADVERTISER" },
    select: { id: true },
  });
  if (!advertiser) {
    throw Errors.validation("Advertiser not found", "advertiserId");
  }
}

export async function POST(request: Request) {
  return withAuth(async () => {
    try {
      const body = await request.json();
      const parsed = blockSchema.safeParse(body);
      if (!parsed.success) {
        return Response.json(
          {
            error: {
              code: "VALIDATION_ERROR",
              message: parsed.error.issues[0]?.message ?? "Invalid request",
              status: 422,
            },
          },
          { status: 422 },
        );
      }

      const advertiserId = parsed.data.advertiserId.trim();
      const sourceToken = parsed.data.sourceToken.trim().toLowerCase();
      await assertAdvertiser(advertiserId);

      const block = await blockSource(
        advertiserId,
        sourceToken,
        parsed.data.reason,
      );
      return Response.json({ data: block });
    } catch (error) {
      return errorResponse(error);
    }
  }, ADMIN_PORTAL_ROLES);
}

export async function DELETE(request: Request) {
  return withAuth(async () => {
    try {
      const params = new URL(request.url).searchParams;
      const advertiserId = params.get("advertiserId")?.trim();
      const sourceToken = params.get("sourceToken")?.trim().toLowerCase();
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

      await assertAdvertiser(advertiserId);
      await unblockSource(advertiserId, sourceToken);
      return Response.json({ data: { success: true } });
    } catch (error) {
      return errorResponse(error);
    }
  }, ADMIN_PORTAL_ROLES);
}
