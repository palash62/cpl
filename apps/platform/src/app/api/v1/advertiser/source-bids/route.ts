import { withAuth } from "@/lib/api-handler";
import { clearSourceBid, setSourceBid } from "@/services/source-optimization.service";
import { AppError } from "@/lib/errors";
import { z } from "zod";

const bidSchema = z.object({
  campaignId: z.string().min(1),
  sourceToken: z.string().min(1),
  cpl: z.number().positive(),
});

export async function POST(request: Request) {
  return withAuth(async (session) => {
    try {
      const body = await request.json();
      const parsed = bidSchema.safeParse(body);
      if (!parsed.success) {
        return Response.json(
          { error: { code: "VALIDATION_ERROR", message: parsed.error.message, status: 422 } },
          { status: 422 },
        );
      }

      const bid = await setSourceBid({
        advertiserId: session.user.id,
        campaignId: parsed.data.campaignId,
        sourceToken: parsed.data.sourceToken,
        cpl: parsed.data.cpl,
      });
      return Response.json({ data: bid });
    } catch (err) {
      if (err instanceof AppError) {
        return Response.json(
          { error: { code: err.code, message: err.message, status: err.status } },
          { status: err.status },
        );
      }
      throw err;
    }
  }, ["ADVERTISER"]);
}

export async function DELETE(request: Request) {
  return withAuth(async (session) => {
    try {
      const url = new URL(request.url);
      const campaignId = url.searchParams.get("campaignId");
      const sourceToken = url.searchParams.get("sourceToken");
      if (!campaignId || !sourceToken) {
        return Response.json(
          {
            error: {
              code: "VALIDATION_ERROR",
              message: "campaignId and sourceToken required",
              status: 422,
            },
          },
          { status: 422 },
        );
      }

      await clearSourceBid({
        advertiserId: session.user.id,
        campaignId,
        sourceToken,
      });
      return Response.json({ data: { success: true } });
    } catch (err) {
      if (err instanceof AppError) {
        return Response.json(
          { error: { code: err.code, message: err.message, status: err.status } },
          { status: err.status },
        );
      }
      throw err;
    }
  }, ["ADVERTISER"]);
}
