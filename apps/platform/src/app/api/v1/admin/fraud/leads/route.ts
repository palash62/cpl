import { withAuth, parsePagination, ADMIN_PORTAL_ROLES } from "@/lib/api-handler";
import { listHighRiskLeads } from "@/modules/fraud";

export async function GET(request: Request) {
  return withAuth(async () => {
    const { searchParams } = new URL(request.url);
    const { page, limit } = parsePagination(searchParams);
    const minRisk = searchParams.get("minRisk");
    const contextualRiskLevel = searchParams.get("contextualRiskLevel") ?? undefined;
    const signal = searchParams.get("signal") ?? undefined;
    const result = await listHighRiskLeads(
      page,
      limit,
      minRisk ? parseInt(minRisk, 10) : undefined,
      { contextualRiskLevel, signal },
    );
    return Response.json(result);
  }, ADMIN_PORTAL_ROLES);
}
