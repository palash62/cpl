import { withAuth } from "@/lib/api-handler";
import {
  listOptinFunnelTemplatesForAdvertiser,
} from "@/services/optin-funnel.service";

export async function GET() {
  return withAuth(async () => {
    const data = await listOptinFunnelTemplatesForAdvertiser();
    return Response.json({ data });
  }, ["ADVERTISER"]);
}

