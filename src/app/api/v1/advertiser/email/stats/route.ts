import { withAuth } from "@/lib/api-handler";
import { getEmailStats } from "@/modules/email-marketing";

export async function GET() {
  return withAuth(async (session) => {
    const data = await getEmailStats(session.user.id);
    return Response.json({ data });
  }, ["ADVERTISER"]);
}
