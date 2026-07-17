export const dynamic = "force-dynamic";

import { Suspense } from "react";
import { format } from "date-fns";
import { CheckCircle, FileText, ShieldAlert, XCircle } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { defaultCampaignDateFrom, defaultCampaignDateTo } from "@/lib/advertiser-campaigns";
import {
  formatAdvertiserLeadCpl,
  formatLeadDataSummary,
} from "@/lib/advertiser-lead-details";
import {
  extractLeadCountry,
  formatLeadIp,
  formatLeadRejectReason,
  parseUserAgent,
  shortLeadId,
} from "@/lib/publisher-leads";
import { listLeads, type AdvertiserLeadSort } from "@/services/lead.service";
import { PageHero } from "@/components/admin/page-hero";
import { PageSection } from "@/components/admin/page-section";
import { GradientStatCard, NeutralStatCard } from "@/components/admin/gradient-stat-card";
import { LeadStatusBadge } from "@/components/admin/admin-ui";
import { AdminLeadDetailsFilters } from "@/components/admin/admin-lead-details-filters";
import { AdminLeadRejectAction } from "@/components/admin/admin-lead-reject-action";
import { AdvertiserLeadsSortHeader } from "@/components/advertiser/advertiser-leads-sort-header";
import { AdvertiserLeadsTableFooter } from "@/components/advertiser/advertiser-leads-table-footer";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { LeadStatus } from "@prisma/client";

interface PageProps {
  searchParams: Promise<{
    advertiserId?: string;
    campaignId?: string;
    status?: string;
    from?: string;
    to?: string;
    sort?: string;
    page?: string;
  }>;
}

function parseSort(sort?: string): AdvertiserLeadSort {
  const valid: AdvertiserLeadSort[] = [
    "created_desc",
    "created_asc",
    "campaign_asc",
    "campaign_desc",
    "status_asc",
    "status_desc",
  ];
  return valid.includes(sort as AdvertiserLeadSort)
    ? (sort as AdvertiserLeadSort)
    : "created_desc";
}

function riskBadge(score: number | null) {
  if (score === null) return <span className="text-slate-400">—</span>;
  const cls =
    score > 50
      ? "bg-red-100 text-red-700"
      : score > 20
        ? "bg-amber-100 text-amber-800"
        : "bg-emerald-100 text-emerald-700";
  return (
    <span className={cn("inline-flex rounded-full px-2 py-0.5 text-xs font-semibold", cls)}>
      {score}
    </span>
  );
}

export default async function AdminLeadsPage({ searchParams }: PageProps) {
  const session = await getSession();
  if (!session?.user) {
    redirect("/login");
  }

  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page ?? "1", 10));
  const limit = 15;
  const dateFrom = params.from ?? defaultCampaignDateFrom();
  const dateTo = params.to ?? defaultCampaignDateTo();

  const status =
    params.status &&
    ["CAPTURED", "VALIDATING", "PENDING", "APPROVED", "REJECTED", "PAID"].includes(params.status)
      ? (params.status as LeadStatus)
      : undefined;

  const [
    total,
    approved,
    rejected,
    highRisk,
    campaigns,
    advertisers,
    { data: leads, meta },
  ] = await Promise.all([
    prisma.lead.count(),
    prisma.lead.count({ where: { status: { in: ["APPROVED", "PAID"] } } }),
    prisma.lead.count({ where: { status: "REJECTED" } }),
    prisma.lead.count({ where: { riskScore: { gt: 50 } } }),
    prisma.campaign.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.user.findMany({
      where: { role: "ADVERTISER" },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    listLeads({
      advertiserId: params.advertiserId,
      campaignId: params.campaignId,
      status,
      dateFrom: new Date(dateFrom),
      dateTo: new Date(dateTo),
      sort: parseSort(params.sort),
      page,
      limit,
    }),
  ]);

  return (
    <div className="space-y-7">
      <PageHero
        eyebrow="Lead Management"
        title="All Leads"
        description="Review lead submissions with full data across all campaigns and advertisers"
        badge={`${meta.total} lead${meta.total === 1 ? "" : "s"} in range`}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <GradientStatCard variant="leads" label="Total Leads" value={total} icon={FileText} />
        <NeutralStatCard label="Approved" value={approved} icon={CheckCircle} accent="green" />
        <NeutralStatCard label="Rejected" value={rejected} icon={XCircle} accent="red" />
        <NeutralStatCard label="High Risk" value={highRisk} icon={ShieldAlert} accent="red" />
      </div>

      <PageSection
        title="Lead Details"
        description={`${meta.total} lead${meta.total === 1 ? "" : "s"} matching filters`}
        icon={FileText}
        gradient="leads"
      >
        <Suspense fallback={<div className="px-6 py-4 text-sm text-slate-500">Loading filters...</div>}>
          <AdminLeadDetailsFilters campaigns={campaigns} advertisers={advertisers} />
        </Suspense>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow
                className="border-none hover:bg-transparent"
                style={{ background: "var(--theme-primary-soft)" }}
              >
                <TableHead className="h-11 whitespace-nowrap px-4 text-slate-600">
                  <Suspense fallback={<span>Date / Time</span>}>
                    <AdvertiserLeadsSortHeader field="at" label="Date / Time" />
                  </Suspense>
                </TableHead>
                <TableHead className="h-11 whitespace-nowrap px-4 text-slate-600">Lead ID</TableHead>
                <TableHead className="h-11 whitespace-nowrap px-4 text-slate-600">Advertiser</TableHead>
                <TableHead className="h-11 whitespace-nowrap px-4 text-slate-600">
                  <Suspense fallback={<span>Campaign</span>}>
                    <AdvertiserLeadsSortHeader field="campaign" label="Campaign" />
                  </Suspense>
                </TableHead>
                <TableHead className="h-11 whitespace-nowrap px-4 text-slate-600">Publisher</TableHead>
                <TableHead className="h-11 whitespace-nowrap px-4 text-slate-600">Lead Data</TableHead>
                <TableHead className="h-11 whitespace-nowrap px-4 text-slate-600">Country</TableHead>
                <TableHead className="h-11 whitespace-nowrap px-4 text-slate-600">IP</TableHead>
                <TableHead className="h-11 whitespace-nowrap px-4 text-slate-600">Source</TableHead>
                <TableHead className="h-11 whitespace-nowrap px-4 text-slate-600">Sub ID</TableHead>
                <TableHead className="h-11 whitespace-nowrap px-4 text-slate-600">Device</TableHead>
                <TableHead className="h-11 whitespace-nowrap px-4 text-slate-600">OS</TableHead>
                <TableHead className="h-11 whitespace-nowrap px-4 text-right text-slate-600">CPL</TableHead>
                <TableHead className="h-11 whitespace-nowrap px-4 text-slate-600">Risk</TableHead>
                <TableHead className="h-11 whitespace-nowrap px-4 text-slate-600">Flags</TableHead>
                <TableHead className="h-11 whitespace-nowrap px-4 text-slate-600">
                  <Suspense fallback={<span>Status</span>}>
                    <AdvertiserLeadsSortHeader field="status" label="Status" />
                  </Suspense>
                </TableHead>
                <TableHead className="h-11 min-w-[160px] whitespace-nowrap px-4 text-slate-600">
                  Notes
                </TableHead>
                <TableHead className="h-11 whitespace-nowrap px-4 text-slate-600">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leads.length === 0 ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={18} className="h-48 px-6 py-16 text-center">
                    <p className="text-base font-medium text-slate-500">No leads found</p>
                    <p className="mt-1 text-sm text-slate-400">
                      Try adjusting the filters or date range.
                    </p>
                  </TableCell>
                </TableRow>
              ) : (
                leads.map((lead) => {
                  const { device, os } = parseUserAgent(lead.userAgent);
                  const country = extractLeadCountry(
                    lead.data,
                    lead.country,
                    lead.geoCountry,
                    lead.submissionMeta,
                  );
                  const cpl = formatAdvertiserLeadCpl(lead.status, Number(lead.campaign.cpl));
                  const notes = formatLeadRejectReason(lead);
                  const leadData = formatLeadDataSummary(lead.data);
                  const failedFlags = lead.validationResults.filter((r) => !r.passed);

                  return (
                    <TableRow
                      key={lead.id}
                      className="border-slate-100 transition-colors hover:bg-violet-50/40"
                    >
                      <TableCell className="whitespace-nowrap px-4 py-4 text-sm text-slate-600">
                        {format(new Date(lead.createdAt), "MMM d, yyyy HH:mm:ss")}
                      </TableCell>
                      <TableCell className="whitespace-nowrap px-4 py-4 font-mono text-xs text-slate-500">
                        {shortLeadId(lead.id)}
                      </TableCell>
                      <TableCell className="max-w-[120px] px-4 py-4 text-sm text-slate-700">
                        <span className="line-clamp-2" title={lead.campaign.advertiser?.name}>
                          {lead.campaign.advertiser?.name ?? "—"}
                        </span>
                      </TableCell>
                      <TableCell className="max-w-[140px] px-4 py-4 text-sm font-medium text-slate-800">
                        <span className="line-clamp-2" title={lead.campaign.name}>
                          {lead.campaign.name}
                        </span>
                      </TableCell>
                      <TableCell className="max-w-[120px] px-4 py-4 text-sm text-slate-700">
                        <span className="line-clamp-2" title={lead.publisher.name}>
                          {lead.publisher.name}
                        </span>
                      </TableCell>
                      <TableCell className="max-w-[220px] px-4 py-4 text-sm text-slate-700">
                        <span className="line-clamp-2" title={leadData}>
                          {leadData}
                        </span>
                      </TableCell>
                      <TableCell className="whitespace-nowrap px-4 py-4 text-sm text-slate-600">
                        {country}
                      </TableCell>
                      <TableCell className="whitespace-nowrap px-4 py-4 font-mono text-xs text-slate-600">
                        {formatLeadIp(lead.ip)}
                      </TableCell>
                      <TableCell className="whitespace-nowrap px-4 py-4 text-sm text-slate-600">
                        {lead.source ?? "—"}
                      </TableCell>
                      <TableCell className="max-w-[100px] truncate px-4 py-4 text-sm text-slate-600">
                        {lead.subId ?? "—"}
                      </TableCell>
                      <TableCell className="whitespace-nowrap px-4 py-4 text-sm text-slate-600">
                        {device}
                      </TableCell>
                      <TableCell className="whitespace-nowrap px-4 py-4 text-sm text-slate-600">
                        {os}
                      </TableCell>
                      <TableCell className="whitespace-nowrap px-4 py-4 text-right text-sm text-slate-700">
                        {cpl}
                      </TableCell>
                      <TableCell className="px-4 py-4">{riskBadge(lead.riskScore)}</TableCell>
                      <TableCell className="px-4 py-4">
                        {failedFlags.length > 0 ? (
                          <div className="flex max-w-[140px] flex-wrap gap-1">
                            {failedFlags.slice(0, 3).map((r) => (
                              <span
                                key={r.id}
                                className="rounded bg-rose-50 px-1.5 py-0.5 font-mono text-[10px] text-rose-700"
                              >
                                {r.rule}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </TableCell>
                      <TableCell className="px-4 py-4">
                        <LeadStatusBadge status={lead.status} />
                      </TableCell>
                      <TableCell className="max-w-[180px] px-4 py-4 text-sm text-slate-600">
                        <span className="line-clamp-2" title={notes}>
                          {notes}
                        </span>
                      </TableCell>
                      <TableCell className="whitespace-nowrap px-4 py-4">
                        <AdminLeadRejectAction leadId={lead.id} status={lead.status} />
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        <Suspense>
          <AdvertiserLeadsTableFooter
            page={meta.page}
            totalPages={meta.totalPages}
            total={meta.total}
            perPage={limit}
          />
        </Suspense>

        <div className="border-t border-slate-100 px-6 py-4">
          <Link href="/admin/fraud" className="text-sm font-medium text-[var(--theme-primary)] hover:underline">
            Open Fraud Center for high-risk review →
          </Link>
        </div>
      </PageSection>
    </div>
  );
}
