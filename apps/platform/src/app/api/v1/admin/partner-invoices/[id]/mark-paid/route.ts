import { withAuth, ADMIN_PORTAL_ROLES } from "@/lib/api-handler";
import { errorResponse, Errors } from "@/lib/errors";
import { markPartnerInvoicePaid } from "@/services/partner-invoice.service";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(_request: Request, context: RouteContext) {
  return withAuth(async (session) => {
    if (session.impersonatorId) {
      return errorResponse(Errors.forbidden());
    }

    const { id } = await context.params;
    try {
      const invoice = await markPartnerInvoicePaid(id, session.user.id);
      return Response.json({ data: invoice });
    } catch (error) {
      return errorResponse(error);
    }
  }, ADMIN_PORTAL_ROLES);
}
