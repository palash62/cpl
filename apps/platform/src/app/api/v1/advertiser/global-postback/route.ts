import { withAuth } from "@/lib/api-handler";
import { advertiserGlobalPostbackSchema } from "@/lib/validations";
import {
  getAdvertiserGlobalPostback,
  upsertAdvertiserGlobalPostback,
} from "@/services/advertiser-global-postback.service";

export async function GET() {
  return withAuth(async (session) => {
    const data = await getAdvertiserGlobalPostback(session.user.id);
    return Response.json({ data });
  }, ["ADVERTISER"]);
}

export async function PATCH(request: Request) {
  return withAuth(async (session) => {
    const body = await request.json();
    const parsed = advertiserGlobalPostbackSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: parsed.error.issues[0]?.message ?? "Invalid payload",
            status: 422,
          },
        },
        { status: 422 },
      );
    }

    const data = await upsertAdvertiserGlobalPostback(session.user.id, {
      type: parsed.data.type,
      status: parsed.data.status,
      endpoint: parsed.data.endpoint,
    });
    return Response.json({ data });
  }, ["ADVERTISER"]);
}
