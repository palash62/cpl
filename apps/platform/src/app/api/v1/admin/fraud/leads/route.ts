import { withAuth, parsePagination } from "@/lib/api-handler";
import { listHighRiskLeads } from "@/modules/fraud";

export async function GET(request: Request) {
  return withAuth(async () => {
    const { searchParams } = new URL(request.url);
    const { page, limit } = parsePagination(searchParams);
    const minRisk = searchParams.get("minRisk");
    const result = await listHighRiskLeads(
      page,
      limit,
      minRisk ? parseInt(minRisk, 10) : undefined,
    );
    return Response.json(result);
  }, ["ADMIN"]);
}
