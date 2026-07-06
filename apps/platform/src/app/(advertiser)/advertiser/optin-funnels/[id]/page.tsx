export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { getSession } from "@/lib/session";
import { getOptinFunnel } from "@/services/optin-funnel.service";
import { FunnelDetailPanel } from "@/components/advertiser/funnel/funnel-detail-panel";

export default async function OptinFunnelDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  const { id } = await params;

  try {
    const funnel = await getOptinFunnel(id, session!.user.id);
    const appUrl = process.env.APP_URL ?? process.env.NEXT_PUBLIC_PLATFORM_URL ?? "http://localhost:3000";

    return <FunnelDetailPanel initialFunnel={funnel} appUrl={appUrl.replace(/\/$/, "")} />;
  } catch {
    notFound();
  }
}
