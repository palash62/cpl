import { cookies } from "next/headers";
import { withAuth } from "@/lib/api-handler";
import { errorResponse, AppError } from "@/lib/errors";
import { decryptConfigSecrets } from "@/modules/autoresponder/lib/encrypt-secrets";
import { getConnectionById } from "@/modules/autoresponder/repositories/connection.repo";
import {
  AWEBER_SESSION_COOKIE,
  ensureFreshAweberAccessToken,
  fetchAweberLists,
  parseAweberSessionCookie,
} from "@/modules/autoresponder/providers/aweber-oauth";

export async function GET(request: Request) {
  return withAuth(async (session) => {
    try {
      const { searchParams } = new URL(request.url);
      const connectionId = searchParams.get("connectionId");

      let accessToken = "";
      let accountId = "";

      const cookieStore = await cookies();
      const oauthSession = parseAweberSessionCookie(
        cookieStore.get(AWEBER_SESSION_COOKIE)?.value,
      );

      if (oauthSession && oauthSession.advertiserId === session.user.id) {
        const fresh = await ensureFreshAweberAccessToken({
          accessToken: oauthSession.accessToken,
          refreshToken: oauthSession.refreshToken || undefined,
          tokenExpiresAt: oauthSession.expiresAt,
        });
        accessToken = fresh.accessToken;
        accountId = oauthSession.accountId;
      } else if (connectionId) {
        const row = await getConnectionById(connectionId, session.user.id);
        if (!row || row.provider !== "AWEBER") {
          throw new AppError("NOT_FOUND", "AWeber connection not found", 404);
        }
        const config = decryptConfigSecrets((row.config ?? {}) as Record<string, unknown>);
        const token = String(config.accessToken ?? "");
        const refresh = typeof config.refreshToken === "string" ? config.refreshToken : undefined;
        const expiresAt =
          typeof config.tokenExpiresAt === "number" ? config.tokenExpiresAt : undefined;
        accountId = String(config.accountId ?? "");
        if (!token || !accountId) {
          throw new AppError("VALIDATION_ERROR", "Connect with AWeber first", 422);
        }
        const fresh = await ensureFreshAweberAccessToken({
          accessToken: token,
          refreshToken: refresh,
          tokenExpiresAt: expiresAt,
        });
        accessToken = fresh.accessToken;
      } else {
        throw new AppError(
          "VALIDATION_ERROR",
          "Connect with AWeber before loading lists",
          422,
        );
      }

      const lists = await fetchAweberLists(accessToken, accountId);
      return Response.json({ data: lists });
    } catch (error) {
      return errorResponse(error);
    }
  }, ["ADVERTISER"]);
}
