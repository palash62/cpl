import { withAuth } from "@/lib/api-handler";
import { blockSource, unblockSource } from "@/services/source-optimization.service";
import { AppError } from "@/lib/errors";
import { z } from "zod";

const blockSchema = z.object({
  sourceToken: z.string().min(1),
  reason: z.string().max(200).optional(),
});

export async function POST(request: Request) {
  return withAuth(async (session) => {
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
        session.user.id,
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
  }, ["ADVERTISER"]);
}

export async function DELETE(request: Request) {
  return withAuth(async (session) => {
    const sourceToken = new URL(request.url).searchParams.get("sourceToken");
    if (!sourceToken) {
      return Response.json(
        { error: { code: "VALIDATION_ERROR", message: "sourceToken required", status: 422 } },
        { status: 422 },
      );
    }
    await unblockSource(session.user.id, sourceToken);
    return Response.json({ data: { success: true } });
  }, ["ADVERTISER"]);
}
