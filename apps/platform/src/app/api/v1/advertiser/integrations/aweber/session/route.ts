import { cookies } from "next/headers";
import { withAuth } from "@/lib/api-handler";
import {
  AWEBER_SESSION_COOKIE,
  parseAweberSessionCookie,
} from "@/modules/autoresponder/providers/aweber-oauth";

/** Returns whether the advertiser has a live AWeber OAuth session after Connect. */
export async function GET() {
  return withAuth(async (session) => {
    const cookieStore = await cookies();
    const oauthSession = parseAweberSessionCookie(
      cookieStore.get(AWEBER_SESSION_COOKIE)?.value,
    );
    const connected =
      Boolean(oauthSession) && oauthSession?.advertiserId === session.user.id;

    return Response.json({
      data: {
        connected,
        accountId: connected ? oauthSession!.accountId : null,
      },
    });
  }, ["ADVERTISER"]);
}
