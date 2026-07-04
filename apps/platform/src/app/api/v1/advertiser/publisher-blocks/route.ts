import { withAuth } from "@/lib/api-handler";
import { blockPublisher, unblockPublisher } from "@/services/smart-link.service";
import { z } from "zod";

const blockSchema = z.object({
  publisherId: z.string().min(1),
  reason: z.string().max(200).optional(),
});

export async function POST(request: Request) {
  return withAuth(async (session) => {
    const body = await request.json();
    const parsed = blockSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        { error: { code: "VALIDATION_ERROR", message: parsed.error.message, status: 422 } },
        { status: 422 },
      );
    }

    const block = await blockPublisher(
      session.user.id,
      parsed.data.publisherId,
      parsed.data.reason,
    );

    return Response.json({ data: block });
  }, ["ADVERTISER"]);
}

export async function DELETE(request: Request) {
  return withAuth(async (session) => {
    const publisherId = new URL(request.url).searchParams.get("publisherId");

    if (!publisherId) {
      return Response.json(
        { error: { code: "VALIDATION_ERROR", message: "publisherId required", status: 422 } },
        { status: 422 },
      );
    }

    await unblockPublisher(session.user.id, publisherId);
    return Response.json({ data: { success: true } });
  }, ["ADVERTISER"]);
}
