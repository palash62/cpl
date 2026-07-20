import { NextResponse } from "next/server";
import { withAuth } from "@/lib/api-handler";
import { errorResponse, AppError } from "@/lib/errors";
import {
  AWEBER_STATE_COOKIE,
  assertAweberOAuthConfigured,
  buildAweberAuthorizeUrl,
  createAweberStateCookie,
} from "@/modules/autoresponder/providers/aweber-oauth";

export async function GET() {
  return withAuth(async (session) => {
    try {
      assertAweberOAuthConfigured();
      const stateCookie = createAweberStateCookie(session.user.id);
      const url = buildAweberAuthorizeUrl(stateCookie.nonce);

      const response = NextResponse.redirect(url);
      response.cookies.set(AWEBER_STATE_COOKIE, stateCookie.value, stateCookie.options);
      return response;
    } catch (error) {
      if (error instanceof Error && error.message.includes("not configured")) {
        return errorResponse(new AppError("VALIDATION_ERROR", error.message, 422));
      }
      return errorResponse(error);
    }
  }, ["ADVERTISER"]);
}
