import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getPlatformUrl } from "@cpl/shared";
import {
  AWEBER_STATE_COOKIE,
  createAweberSessionCookie,
  exchangeAweberCode,
  fetchAweberAccountId,
  parseAweberStateCookie,
  tokenExpiresAtFromResponse,
} from "@/modules/autoresponder/providers/aweber-oauth";

function redirectWithError(code: string) {
  const url = new URL("/advertiser/integrations", getPlatformUrl());
  url.searchParams.set("aweber", "error");
  url.searchParams.set("reason", code);
  return NextResponse.redirect(url.toString());
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const oauthError = searchParams.get("error");

    if (oauthError) {
      return redirectWithError(oauthError);
    }
    if (!code || !state) {
      return redirectWithError("missing_code");
    }

    const cookieStore = await cookies();
    const statePayload = parseAweberStateCookie(cookieStore.get(AWEBER_STATE_COOKIE)?.value);
    if (!statePayload || statePayload.nonce !== state) {
      return redirectWithError("invalid_state");
    }

    const token = await exchangeAweberCode(code);
    if (!token.access_token) {
      return redirectWithError("token_failed");
    }

    const accountId = await fetchAweberAccountId(token.access_token);
    const sessionCookie = createAweberSessionCookie({
      advertiserId: statePayload.advertiserId,
      accessToken: token.access_token,
      refreshToken: token.refresh_token ?? "",
      accountId,
      expiresAt: tokenExpiresAtFromResponse(token),
    });

    const dest = new URL("/advertiser/integrations", getPlatformUrl());
    dest.searchParams.set("aweber", "connected");

    const response = NextResponse.redirect(dest.toString());
    response.cookies.set(sessionCookie.name, sessionCookie.value, sessionCookie.options);
    response.cookies.set(AWEBER_STATE_COOKIE, "", {
      httpOnly: true,
      path: "/",
      maxAge: 0,
    });
    return response;
  } catch (error) {
    console.error("[aweber/callback]", error);
    return redirectWithError("callback_failed");
  }
}
