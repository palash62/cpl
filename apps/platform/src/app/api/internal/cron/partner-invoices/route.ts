import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { getInternalServiceToken } from "@cpl/shared";
import { errorResponse } from "@/lib/errors";
import { isValidPeriodMonth, previousCalendarMonth } from "@/services/partner-payment.service";
import { generatePartnerInvoice } from "@/services/partner-invoice.service";

export const runtime = "nodejs";

function verifyServiceToken(request: Request): boolean {
  const token = getInternalServiceToken();
  const provided = request.headers.get("x-service-token");
  if (!token || !provided) return false;
  try {
    const a = Buffer.from(provided);
    const b = Buffer.from(token);
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  if (!verifyServiceToken(request)) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Invalid service token", status: 401 } },
      { status: 401 },
    );
  }

  try {
    const url = new URL(request.url);
    const monthParam = url.searchParams.get("month")?.trim();
    const periodMonth =
      monthParam && isValidPeriodMonth(monthParam) ? monthParam : previousCalendarMonth();

    const result = await generatePartnerInvoice(periodMonth, { sendEmail: true });

    return NextResponse.json({
      generated: result.status === "created" || result.status === "updated",
      skipped: result.status === "skipped",
      emailed: result.emailed,
      periodMonth,
      invoiceId: result.invoice.id,
      invoiceNumber: result.invoice.invoiceNumber,
      errors: result.emailError ? [result.emailError] : [],
    });
  } catch (error) {
    return errorResponse(error);
  }
}
