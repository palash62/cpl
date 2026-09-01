import { withAuth, ADMIN_PORTAL_ROLES } from "@/lib/api-handler";
import { errorResponse, Errors } from "@/lib/errors";
import { adminPartnerInvoiceGenerateSchema } from "@/lib/validations";
import { generatePartnerInvoice } from "@/services/partner-invoice.service";
import { previousCalendarMonth } from "@/services/partner-payment.service";

export async function POST(request: Request) {
  return withAuth(async (session) => {
    if (session.impersonatorId) {
      return errorResponse(Errors.forbidden());
    }

    try {
      const body = await request.json().catch(() => ({}));
      const parsed = adminPartnerInvoiceGenerateSchema.safeParse(body);
      if (!parsed.success) {
        const issue = parsed.error.issues[0];
        return errorResponse(
          Errors.validation(issue?.message ?? "Invalid body", issue?.path?.[0]?.toString()),
        );
      }

      const periodMonth = parsed.data.periodMonth ?? previousCalendarMonth();
      const result = await generatePartnerInvoice(periodMonth, {
        force: parsed.data.force ?? false,
        sendEmail: true,
      });

      return Response.json({ data: result });
    } catch (error) {
      return errorResponse(error);
    }
  }, ADMIN_PORTAL_ROLES);
}
