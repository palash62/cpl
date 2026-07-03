"use client";

import { OptinFunnelBuilderPage } from "@/components/advertiser/optin-funnel-builder-page";
import { useParams } from "next/navigation";

export default function OptinFunnelEditPage() {
  const params = useParams();
  const funnelId = params.id as string;
  return <OptinFunnelBuilderPage funnelId={funnelId} />;
}
