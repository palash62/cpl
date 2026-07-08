import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { ThankYouFunnelPage } from "@/components/optin/thank-you-funnel-page";
import { getSession } from "@/lib/session";
import {
  getAdvertiserThankYouFunnelPreview,
  getPublicThankYouFunnel,
} from "@/services/optin-funnel.service";

async function getOrigin() {
  const headerStore = await headers();
  const host = headerStore.get("x-forwarded-host") ?? headerStore.get("host");
  const proto = headerStore.get("x-forwarded-proto") ?? "http";
  if (host) return `${proto}://${host}`;
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}

export default async function OptinThankYouPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ lead_id?: string; preview?: string }>;
}) {
  const { slug } = await params;
  const { lead_id: leadId, preview } = await searchParams;
  const origin = await getOrigin();

  if (preview === "1") {
    const session = await getSession();
    if (!session || session.user.role !== "ADVERTISER") notFound();

    const draft = await getAdvertiserThankYouFunnelPreview(slug, session.user.id);
    if (!draft) notFound();

    return <ThankYouFunnelPage page={draft} origin={origin} />;
  }

  if (!leadId) notFound();

  const page = await getPublicThankYouFunnel(slug, leadId);
  if (!page) notFound();

  return <ThankYouFunnelPage page={page} origin={origin} />;
}
