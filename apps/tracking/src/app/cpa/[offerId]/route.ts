import { prisma } from "@cpl/database";
import { NextResponse } from "next/server";

function appendParams(destination: string, requestUrl: URL): string {
  try {
    const target = destination.startsWith("/")
      ? new URL(destination, requestUrl.origin)
      : new URL(destination);

    for (const key of ["adv_id", "sub_id", "src"] as const) {
      const value = requestUrl.searchParams.get(key)?.trim();
      if (value) target.searchParams.set(key, value);
    }

    return target.toString();
  } catch {
    return destination;
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ offerId: string }> },
) {
  const { offerId } = await params;
  const offer = await prisma.cpaOffer.findUnique({
    where: { id: offerId },
    select: { id: true, status: true, trackingUrl: true },
  });

  if (!offer) {
    return NextResponse.json({ error: { code: "NOT_FOUND" } }, { status: 404 });
  }

  if (offer.status !== "ACTIVE") {
    return NextResponse.json({ error: { code: "GONE" } }, { status: 410 });
  }

  const requestUrl = new URL(request.url);
  const redirectTo = appendParams(offer.trackingUrl, requestUrl);
  return NextResponse.redirect(redirectTo, 302);
}
