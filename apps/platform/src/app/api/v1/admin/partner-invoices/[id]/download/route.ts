import { withAuth, ADMIN_PORTAL_ROLES } from "@/lib/api-handler";
import { errorResponse } from "@/lib/errors";
import { getPartnerInvoiceById, getPartnerInvoicePdfBuffer } from "@/services/partner-invoice.service";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  return withAuth(async () => {
    const { id } = await context.params;
    try {
      const invoice = await getPartnerInvoiceById(id);
      if (!invoice) {
        return Response.json(
          { error: { code: "NOT_FOUND", message: "Invoice not found", status: 404 } },
          { status: 404 },
        );
      }

      const pdf = await getPartnerInvoicePdfBuffer(id);
      return new Response(new Uint8Array(pdf), {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="${invoice.invoiceNumber}.pdf"`,
          "Cache-Control": "private, no-store",
        },
      });
    } catch (error) {
      console.error("[partner-invoice:download]", id, error);
      return errorResponse(error);
    }
  }, ADMIN_PORTAL_ROLES);
}
