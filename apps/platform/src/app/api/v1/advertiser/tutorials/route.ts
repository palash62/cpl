import { withAuth } from "@/lib/api-handler";
import { listTutorialsForAdvertiser } from "@/services/tutorial.service";

export async function GET() {
  return withAuth(async () => {
    const data = await listTutorialsForAdvertiser();
    return Response.json({ data });
  }, ["ADVERTISER"]);
}
