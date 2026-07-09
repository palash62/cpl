import { withAuth } from "@/lib/api-handler";
import { errorResponse, Errors } from "@/lib/errors";
import { getConnectionById } from "@/modules/autoresponder/repositories/connection.repo";
import { decryptConfigSecrets, MASKED_SECRET } from "@/modules/autoresponder/lib/encrypt-secrets";
import { listGetResponseCampaigns } from "@/modules/autoresponder/providers/getresponse.provider";

export async function POST(request: Request) {
  return withAuth(async (session) => {
    try {
      const body = (await request.json()) as { apiKey?: string; connectionId?: string };
      let apiKey = body.apiKey?.trim() ?? "";

      if ((!apiKey || apiKey === MASKED_SECRET) && body.connectionId) {
        const connection = await getConnectionById(body.connectionId, session.user.id);
        if (!connection || connection.provider !== "GETRESPONSE") {
          return errorResponse(Errors.notFound("Autoresponder connection"));
        }
        try {
          const decrypted = decryptConfigSecrets(connection.config as Record<string, unknown>);
          apiKey = String(decrypted.apiKey ?? "").trim();
        } catch {
          return Response.json(
            {
              error: {
                code: "VALIDATION_ERROR",
                message: "Saved API key could not be read. Re-enter your GetResponse API key.",
                status: 422,
              },
            },
            { status: 422 },
          );
        }
      }

      if (!apiKey || apiKey === MASKED_SECRET) {
        return Response.json(
          {
            error: {
              code: "VALIDATION_ERROR",
              message: "Enter a valid GetResponse API key to load lists",
              status: 422,
            },
          },
          { status: 422 },
        );
      }

      const result = await listGetResponseCampaigns(apiKey);
      if (!result.ok) {
        return Response.json(
          {
            error: {
              code: "GETRESPONSE_LIST_FAILED",
              message: result.error,
              status: 422,
            },
          },
          { status: 422 },
        );
      }

      return Response.json({ data: result.campaigns });
    } catch (error) {
      return errorResponse(error);
    }
  }, ["ADVERTISER"]);
}
