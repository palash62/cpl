export const dynamic = "force-dynamic";

import { Suspense } from "react";
import Link from "next/link";
import { Info, Ban, SlidersHorizontal } from "lucide-react";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { formatUserDateTime } from "@/lib/user-timezone";
import { defaultCampaignDateFrom, defaultCampaignDateTo } from "@/lib/advertiser-campaigns";
import {
  listAdvertiserSourceReport,
  listBlockedSources,
} from "@/services/source-optimization.service";
import { PageSection } from "@/components/admin/page-section";
import { RoleHero } from "@/components/layout/role-hero";
import { AdvertiserSourceOptimizationFilters } from "@/components/advertiser/advertiser-source-optimization-filters";
import { AdvertiserSourceActions } from "@/components/advertiser/advertiser-source-actions";
import { AdvertiserBlockedSourcesTable } from "@/components/advertiser/advertiser-blocked-sources-table";
import { AdvertiserSourceOptimizationSortHeader } from "@/components/advertiser/advertiser-source-optimization-sort-header";
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
    campaign?: string;
    source?: string;
    from?: string;
    to?: string;
    sort?: string;
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

export default async function AdvertiserSourceOptimizationPage({ searchParams }: PageProps) {
  const session = await getSession();
  const tz = session!.user.timezone;
  const params = await searchParams;
  const dateFrom = params.from ?? defaultCampaignDateFrom();
  const dateTo = params.to ?? defaultCampaignDateTo();
  const campaignId = params.campaign?.trim() || undefined;

  const [campaigns, sourceReport, blockedSources] = await Promise.all([
    prisma.campaign.findMany({
      where: { advertiserId: session!.user.id },
      select: { id: true, name: true, cpl: true },
      orderBy: { updatedAt: "desc" },
      take: 200,
    }),
    listAdvertiserSourceReport({
      advertiserId: session!.user.id,
      campaignId,
      sourceSearch: params.source,
      dateFrom: new Date(dateFrom),
      dateTo: new Date(dateTo),
      sort: params.sort,
    }),
    listBlockedSources(session!.user.id),
  ]);

  const campaignOptions = campaigns.map((c) => ({
    id: c.id,
    name: c.name,
    cpl: Number(c.cpl),
  }));

  return (
    <div className="space-y-6">
      <RoleHero
        eyebrow="Advertiser Portal"
        title="Source Optimization"
        description="Review encrypted source performance, block low-quality traffic, and raise or lower bids per source — without seeing publisher source names."
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
          Source IDs are encrypted tokens (e.g. <span className="font-mono">SRC-A7F3K9…</span>). Raw
          traffic source names are never shown. Select a campaign to adjust per-source bids
          (50%–200% of campaign CPL). Blocked sources are rejected on lead submit and excluded from
          Smart Link rotation. For publisher-level blocks, see{" "}
          <Link
            href="/advertiser/lead-report"
            className="font-medium text-[var(--theme-primary)] hover:underline"
          >
            Lead Report
          </Link>
          .
        </p>
      </div>

      <Suspense fallback={null}>
        <AdvertiserSourceOptimizationFilters campaigns={campaignOptions} />
      </Suspense>

      <PageSection
        title="Performance by source"
        description={
          campaignId
            ? "Metrics and bid controls for the selected campaign."
            : "Aggregated across campaigns. Select a campaign to set source bids."
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
                  <TableHead>
                    <Suspense fallback="Source ID">
                      <AdvertiserSourceOptimizationSortHeader
                        field="sourceId"
                        label="Source ID"
                      />
                    </Suspense>
                  </TableHead>
                  <TableHead className="text-right">
                    <Suspense fallback="Leads">
                      <AdvertiserSourceOptimizationSortHeader
                        field="leads"
                        label="Leads"
                        align="right"
                      />
                    </Suspense>
                  </TableHead>
                  <TableHead className="text-right">
                    <Suspense fallback="Approved">
                      <AdvertiserSourceOptimizationSortHeader
                        field="approved"
                        label="Approved"
                        align="right"
                      />
                    </Suspense>
                  </TableHead>
                  <TableHead className="text-right">
                    <Suspense fallback="Rejected">
                      <AdvertiserSourceOptimizationSortHeader
                        field="rejected"
                        label="Rejected"
                        align="right"
                      />
                    </Suspense>
                  </TableHead>
                  <TableHead className="text-right">
                    <Suspense fallback="Sales">
                      <AdvertiserSourceOptimizationSortHeader
                        field="sales"
                        label="Sales"
                        align="right"
                      />
                    </Suspense>
                  </TableHead>
                  <TableHead className="text-right">
                    <Suspense fallback="Revenue">
                      <AdvertiserSourceOptimizationSortHeader
                        field="revenue"
                        label="Revenue"
                        align="right"
                      />
                    </Suspense>
                  </TableHead>
                  <TableHead className="text-right">
                    <Suspense fallback="Approval">
                      <AdvertiserSourceOptimizationSortHeader
                        field="approval"
                        label="Approval"
                        align="right"
                      />
                    </Suspense>
                  </TableHead>
                  <TableHead className="text-right">
                    <Suspense fallback="Spend">
                      <AdvertiserSourceOptimizationSortHeader
                        field="spend"
                        label="Spend"
                        align="right"
                      />
                    </Suspense>
                  </TableHead>
                  <TableHead className="text-right">
                    <Suspense fallback="Bid">
                      <AdvertiserSourceOptimizationSortHeader
                        field="bid"
                        label="Bid"
                        align="right"
                      />
                    </Suspense>
                  </TableHead>
                  <TableHead>
                    <Suspense fallback="Last lead">
                      <AdvertiserSourceOptimizationSortHeader
                        field="lastLead"
                        label="Last lead"
                      />
                    </Suspense>
                  </TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sourceReport.map((row) => (
                  <TableRow key={`${row.campaignId ?? "all"}:${row.sourceToken}`}>
                    <TableCell>
                      <div className="font-mono text-sm font-medium">{row.sourceDisplayId}</div>
                      {row.blocked && (
                        <span className="mt-0.5 inline-block rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-red-700">
                          Blocked
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{row.totalLeads}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {row.approvedLeads + row.paidLeads}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{row.rejectedLeads}</TableCell>
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
                      {row.effectiveCpl != null ? (
                        <span>
                          {formatCurrency(row.effectiveCpl)}
                          {row.sourceBid != null && row.campaignCpl != null && (
                            <span className="block text-[10px] text-slate-400">
                              default {formatCurrency(row.campaignCpl)}
                            </span>
                          )}
                        </span>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-sm text-slate-600">
                      {row.lastLeadAt
                        ? formatUserDateTime(row.lastLeadAt, tz)
                        : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <AdvertiserSourceActions
                        sourceToken={row.sourceToken}
                        sourceDisplayId={row.sourceDisplayId}
                        blocked={row.blocked}
                        campaignId={row.campaignId ?? campaignId ?? null}
                        campaignCpl={
                          row.campaignCpl ??
                          (campaignId
                            ? campaignOptions.find((c) => c.id === campaignId)?.cpl ?? null
                            : null)
                        }
                        currentBid={row.sourceBid}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </PageSection>

      <PageSection
        title="Blocked sources"
        description="Sources blocked for all of your campaigns. Unblock anytime."
        icon={Ban}
        gradient="approved"
      >
        <AdvertiserBlockedSourcesTable blocks={blockedSources} timezone={tz} />
      </PageSection>
    </div>
  );
}
