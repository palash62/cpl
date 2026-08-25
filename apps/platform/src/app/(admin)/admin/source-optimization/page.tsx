export const dynamic = "force-dynamic";

import { Suspense } from "react";
import { redirect } from "next/navigation";
import { Info, SlidersHorizontal } from "lucide-react";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { formatUserDateTime } from "@/lib/user-timezone";
import {
  defaultCampaignDateFrom,
  defaultCampaignDateTo,
} from "@/lib/advertiser-campaigns";
import { listAdminSourceReport } from "@/services/source-optimization.service";
import { PageHero } from "@/components/admin/page-hero";
import { PageSection } from "@/components/admin/page-section";
import { AdminSourceOptimizationFilters } from "@/components/admin/admin-source-optimization-filters";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface PageProps {
  searchParams: Promise<{
    advertiserId?: string;
    campaignId?: string;
    q?: string;
    from?: string;
    to?: string;
  }>;
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  }).format(amount);
}

function formatPct(rate: number) {
  return `${(rate * 100).toFixed(1)}%`;
}

export default async function AdminSourceOptimizationPage({
  searchParams,
}: PageProps) {
  const session = await getSession();
  if (!session?.user) redirect("/login");

  const tz = session.user.timezone;
  const params = await searchParams;
  const dateFrom = params.from ?? defaultCampaignDateFrom();
  const dateTo = params.to ?? defaultCampaignDateTo();
  const advertiserId = params.advertiserId?.trim() || undefined;
  const campaignId = params.campaignId?.trim() || undefined;

  const [advertisers, campaigns, sourceReport] = await Promise.all([
    prisma.user.findMany({
      where: { role: "ADVERTISER" },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
      take: 500,
    }),
    prisma.campaign.findMany({
      select: { id: true, name: true, advertiserId: true },
      orderBy: { updatedAt: "desc" },
      take: 500,
    }),
    listAdminSourceReport({
      advertiserId,
      campaignId,
      sourceSearch: params.q,
      dateFrom: new Date(dateFrom),
      dateTo: new Date(dateTo),
    }),
  ]);

  return (
    <div className="space-y-6">
      <PageHero
        eyebrow="Admin Portal"
        title="Source Optimization"
        description="Per-source lead and CPA performance. Encrypted SRC IDs match the advertiser view; original source is shown for ops."
      />

      <div
        className="flex gap-3 rounded-xl border px-4 py-3 text-sm text-slate-700"
        style={{
          background: "color-mix(in srgb, var(--theme-primary) 8%, white)",
          borderColor: "color-mix(in srgb, var(--theme-primary) 22%, transparent)",
        }}
      >
        <Info
          className="mt-0.5 h-4 w-4 shrink-0"
          style={{ color: "var(--theme-primary)" }}
        />
        <p>
          Advertisers only see the encrypted <span className="font-mono">SRC-…</span>{" "}
          ID. Original traffic tags are visible here so you can map sources without
          reversing the HMAC token.
        </p>
      </div>

      <Suspense fallback={null}>
        <AdminSourceOptimizationFilters
          advertisers={advertisers}
          campaigns={campaigns}
        />
      </Suspense>

      <PageSection
        title="Source performance"
        description={
          campaignId
            ? "Metrics for the selected campaign (bid shown when available)."
            : "Aggregated across campaigns. Select a campaign to see bid values."
        }
        icon={SlidersHorizontal}
        gradient="leads"
      >
        {sourceReport.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
            No source traffic in this date range.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Advertiser</TableHead>
                  <TableHead>Publisher</TableHead>
                  <TableHead>Source ID</TableHead>
                  <TableHead>Original source</TableHead>
                  <TableHead className="text-right">Leads</TableHead>
                  <TableHead className="text-right">Approved</TableHead>
                  <TableHead className="text-right">Rejected</TableHead>
                  <TableHead className="text-right">Sales</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                  <TableHead className="text-right">Approval</TableHead>
                  <TableHead className="text-right">Spend</TableHead>
                  <TableHead className="text-right">Bid</TableHead>
                  <TableHead>Last lead</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sourceReport.map((row) => (
                  <TableRow
                    key={`${row.advertiserId}:${row.campaignId ?? "all"}:${row.sourceToken}`}
                  >
                    <TableCell className="text-sm font-medium text-slate-800">
                      {row.advertiserName}
                    </TableCell>
                    <TableCell className="text-sm text-slate-700">
                      {row.publisherName}
                    </TableCell>
                    <TableCell>
                      <div className="font-mono text-sm font-medium">
                        {row.sourceDisplayId}
                      </div>
                      {row.blocked && (
                        <span className="mt-0.5 inline-block rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-red-700">
                          Blocked
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="max-w-[180px] truncate font-mono text-sm text-slate-700">
                      {row.originalSource}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {row.totalLeads}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {row.approvedLeads + row.paidLeads}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {row.rejectedLeads}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {row.salesCount.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatCurrency(row.revenue)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatPct(row.approvalRate)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatCurrency(row.estimatedSpend)}
                    </TableCell>
                    <TableCell className="text-right text-sm tabular-nums">
                      {row.effectiveCpl != null
                        ? formatCurrency(row.effectiveCpl)
                        : "—"}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-sm text-slate-600">
                      {row.lastLeadAt
                        ? formatUserDateTime(row.lastLeadAt, tz)
                        : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </PageSection>
    </div>
  );
}
