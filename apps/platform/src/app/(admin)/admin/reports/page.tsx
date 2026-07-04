import { Suspense } from "react";
import { endOfDay, parseISO, startOfDay } from "date-fns";
import { getAdminReportsBreakdown, type AdminEntityReportRow } from "@/services/report.service";
import { defaultCampaignDateFrom, defaultCampaignDateTo } from "@/lib/advertiser-campaigns";
import { BarChart3 } from "lucide-react";
import { PageHero } from "@/components/admin/page-hero";
import { PageSection } from "@/components/admin/page-section";
import { AdminReportsFilters } from "@/components/admin/admin-reports-filters";
import {
  AdminReportsSummaryBar,
  AdminReportsTable,
} from "@/components/admin/admin-reports-table";
import { formatCurrency } from "@/components/admin/admin-ui";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{
    q?: string;
    from?: string;
    to?: string;
    view?: string;
    sort?: string;
  }>;
}

function parseSort(sort?: string): "leads" | "clicks" | "conversion" | "spend" {
  if (sort === "clicks" || sort === "conversion" || sort === "spend") return sort;
  return "leads";
}

function formatPercent(value: number) {
  return `${value.toFixed(2)}%`;
}

function sumVisibleRows(rows: AdminEntityReportRow[]) {
  const totals = rows.reduce(
    (acc, row) => ({
      clicks: acc.clicks + row.clicks,
      leads: acc.leads + row.leads,
      approvedLeads: acc.approvedLeads + row.approvedLeads,
      rejectedLeads: acc.rejectedLeads + row.rejectedLeads,
      pendingLeads: acc.pendingLeads + row.pendingLeads,
      spend: acc.spend + row.spend,
      earnings: acc.earnings + row.earnings,
    }),
    {
      clicks: 0,
      leads: 0,
      approvedLeads: 0,
      rejectedLeads: 0,
      pendingLeads: 0,
      spend: 0,
      earnings: 0,
    },
  );
  return {
    ...totals,
    conversionRate: totals.clicks > 0 ? Math.round((totals.leads / totals.clicks) * 10000) / 100 : 0,
    approvalRate: totals.leads > 0 ? Math.round((totals.approvedLeads / totals.leads) * 10000) / 100 : 0,
  };
}

export default async function AdminReportsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const fromStr = params.from ?? defaultCampaignDateFrom();
  const toStr = params.to ?? defaultCampaignDateTo();
  const view = params.view === "advertisers" ? "advertisers" : "publishers";
  const mode = view === "advertisers" ? "advertiser" : "publisher";

  const breakdown = await getAdminReportsBreakdown({
    search: params.q,
    from: startOfDay(parseISO(fromStr)),
    to: endOfDay(parseISO(toStr)),
    sort: parseSort(params.sort),
  });

  const rows = view === "advertisers" ? breakdown.advertisers : breakdown.publishers;
  const visibleTotals = sumVisibleRows(rows);

  return (
    <div className="space-y-6">
      <PageHero
        eyebrow="Analytics"
        title="Platform Reports"
        description="Filter by date and search accounts to review clicks, leads, and conversion performance"
        badge={`${formatPercent(visibleTotals.conversionRate)} conv.`}
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard label="Clicks" value={visibleTotals.clicks.toLocaleString()} />
        <SummaryCard label="Leads" value={visibleTotals.leads.toLocaleString()} />
        <SummaryCard label="Conversion rate" value={formatPercent(visibleTotals.conversionRate)} />
        <SummaryCard
          label={mode === "publisher" ? "Publisher earnings" : "Advertiser spend"}
          value={formatCurrency(mode === "publisher" ? visibleTotals.earnings : visibleTotals.spend)}
        />
      </div>

      <PageSection
        title={view === "advertisers" ? "Advertiser performance" : "Publisher performance"}
        description={`${fromStr} to ${toStr}`}
        icon={BarChart3}
        gradient="leads"
      >
        <Suspense fallback={<div className="px-6 py-4 text-sm text-slate-500">Loading filters...</div>}>
          <AdminReportsFilters />
        </Suspense>

        <AdminReportsSummaryBar totals={visibleTotals} rowCount={rows.length} mode={mode} />

        <AdminReportsTable rows={rows} mode={mode} />
      </PageSection>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="premium-card p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-bold text-slate-900">{value}</p>
    </div>
  );
}
