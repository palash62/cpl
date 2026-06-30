import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { RoleHero } from "@/components/layout/role-hero";
import { AutoresponderConnectionsPanel } from "@/components/advertiser/autoresponder/autoresponder-connections-panel";
import { Info } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdvertiserIntegrationsPage() {
  const session = await getSession();

  const campaigns = await prisma.campaign.findMany({
    where: { advertiserId: session!.user.id },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6">
      <RoleHero
        eyebrow="Advertiser Portal"
        title="Integrations"
        description="Send campaign and opt-in page leads to your email list or automation tool automatically."
      />

      <div
        className="flex gap-3 rounded-xl border px-4 py-3 text-sm text-slate-700"
        style={{
          borderColor: "color-mix(in srgb, var(--theme-primary) 20%, transparent)",
          background: "var(--theme-primary-soft)",
        }}
      >
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-[var(--theme-primary)]" />
        <p>
          You are responsible for obtaining subscriber consent before adding leads to your marketing
          lists. Ensure your opt-in pages and privacy policies disclose that information may be
          shared with your email provider.
        </p>
      </div>

      <AutoresponderConnectionsPanel campaigns={campaigns} />
    </div>
  );
}
