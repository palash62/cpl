export const dynamic = "force-dynamic";

import { Suspense } from "react";
import {
  CheckCircle,
  DollarSign,
  FileText,
  MousePointer,
  Percent,
  Store,
  TrendingUp,
} from "lucide-react";
import { getSession } from "@/lib/session";
import { PUBLISHER_PERIODS, parsePublisherPeriod } from "@/lib/publisher-periods";
import { getPublisherDashboardData } from "@/services/report.service";
import { GradientStatCard, NeutralStatCard } from "@/components/admin/gradient-stat-card";
import { PageSection } from "@/components/admin/page-section";
import { formatCurrency } from "@/components/admin/admin-ui";
import { LeadsTrendChart } from "@/components/dashboard/dashboard-charts";
import { RoleHero } from "@/components/layout/role-hero";
import { PublisherInfoBanner } from "@/components/publisher/publisher-info-banner";
import { PublisherPeriodFilter } from "@/components/publisher/publisher-period-filter";
import {
  PublisherRecentLeadsTable,
  PublisherTopCampaignsTable,
} from "@/components/publisher/publisher-dashboard-panels";
import { ButtonLink } from "@/components/ui/button-link";

interface PageProps {
  searchParams: Promise<{ period?: string }>;
}

export default async function PublisherDashboardPage({ searchParams }: PageProps) {
  const session = await getSession();
  const params = await searchParams;
  const period = parsePublisherPeriod(params.period);
  const periodLabel = PUBLISHER_PERIODS.find((p) => p.value === period)?.label ?? "Last 30 Days";
  const data = await getPublisherDashboardData(session!.user.id, period);
  const firstName = session?.user?.name?.split(" ")[0] ?? "Publisher";

  return (
    <div className="space-y-7">
      <RoleHero
        eyebrow="Publisher Portal"
        title={`Welcome back, ${firstName}`}
        description={`Performance overview for ${periodLabel.toLowerCase()}.`}
        action={{ label: "Browse Campaigns", href: "/publisher/marketplace", icon: Store }}
      />

      <PublisherInfoBanner>
        Track clicks, leads, and earnings across your joined campaigns. Browse the marketplace to
        find new offers and copy your tracking links to start promoting.
      </PublisherInfoBanner>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Suspense fallback={<div className="h-9 w-36 animate-pulse rounded-lg bg-slate-100" />}>
          <PublisherPeriodFilter current={period} />
        </Suspense>
        <div className="flex items-center gap-3">
          <div className="rounded-[18px] border border-slate-200/80 border-t-[3px] border-t-emerald-500 bg-white px-5 py-3 shadow-sm">
            <p className="text-xs font-medium text-slate-500">Available Balance</p>
            <p className="text-xl font-bold tracking-tight text-[var(--theme-primary)]">
              {formatCurrency(data.availableBalance)}
            </p>
          </div>
          <ButtonLink
            href="/publisher/payouts/request"
            className="h-9 rounded-lg bg-[var(--theme-primary)] px-4 text-sm hover:opacity-90"
          >
            <TrendingUp className="mr-1.5 h-4 w-4" />
            Request Payout
          </ButtonLink>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <GradientStatCard
          variant="leads"
          label="Clicks"
          value={data.stats.clicks}
          icon={MousePointer}
          trend={data.stats.clicksTrend}
        />
        <GradientStatCard
          variant="leads"
          label="Leads"
          value={data.stats.totalLeads}
          icon={FileText}
          trend={data.stats.leadsTrend}
        />
        <NeutralStatCard
          label="Approved"
          value={data.stats.approvedLeads}
          icon={CheckCircle}
          accent="green"
          trend={data.stats.approvedTrend}
        />
        <NeutralStatCard
          label="Conversion"
          value={`${data.stats.conversionRate.toFixed(1)}%`}
          icon={Percent}
          accent="purple"
          trend={data.stats.conversionTrend}
        />
        <GradientStatCard
          variant="revenue"
          label="Earnings"
          value={formatCurrency(data.stats.earnings)}
          icon={DollarSign}
          trend={data.stats.earningsTrend}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_300px]">
        <div className="space-y-6">
          <PublisherRecentLeadsTable leads={data.recentLeads} />

          {data.leadsTrend.length > 0 && (
            <PageSection
              title="Leads Trend"
              description="Daily lead volume over the last 30 days"
              icon={FileText}
              gradient="leads"
              contentClassName="p-6"
            >
              <LeadsTrendChart title="Leads Trend" data={data.leadsTrend} />
            </PageSection>
          )}
        </div>

        <PublisherTopCampaignsTable campaigns={data.topCampaigns} />
      </div>
    </div>
  );
}
