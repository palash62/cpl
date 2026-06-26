import { Store } from "lucide-react";
import { RoleHero } from "@/components/layout/role-hero";
import { PublisherInfoBanner } from "@/components/publisher/publisher-info-banner";
import { PublisherMarketplaceTable } from "@/components/publisher/publisher-marketplace-table";

export default function MarketplacePage() {
  return (
    <div className="space-y-6">
      <RoleHero
        eyebrow="Publisher Portal"
        title="Campaign Marketplace"
        description="Browse active campaigns, request access, and get your tracking links."
        action={{ label: "My Campaigns", href: "/publisher/campaigns", icon: Store }}
      />

      <PublisherInfoBanner>
        Join campaigns that match your traffic sources. Once approved, copy your unique tracking link
        and start driving leads to earn per approved conversion.
      </PublisherInfoBanner>

      <PublisherMarketplaceTable />
    </div>
  );
}
