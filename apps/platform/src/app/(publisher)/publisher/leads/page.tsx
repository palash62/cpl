export const dynamic = "force-dynamic";

import { Suspense } from "react";
import { format } from "date-fns";
import { FileText } from "lucide-react";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import {
  extractLeadCountry,
  formatLeadRejectReason,
  parseUserAgent,
  shortLeadId,
} from "@/lib/publisher-leads";
import { calculatePublisherPayout } from "@/lib/platform-settings";
import { getPlatformSettingsConfig } from "@/lib/platform-settings-server";
import { listLeads, type AdvertiserLeadSort } from "@/services/lead.service";
import { PageSection } from "@/components/admin/page-section";
import { LeadStatusBadge } from "@/components/admin/admin-ui";
import { RoleHero } from "@/components/layout/role-hero";
import { AdvertiserLeadsTableFooter } from "@/components/advertiser/advertiser-leads-table-footer";
import { PublisherInfoBanner } from "@/components/publisher/publisher-info-banner";
import { PublisherLeadsFilters } from "@/components/publisher/publisher-leads-filters";
import { PublisherLeadsSortHeader } from "@/components/publisher/publisher-leads-sort-header";
import { cn } from "@/lib/utils";
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

export default async function PublisherLeadsPage({ searchParams }: PageProps) {
  const session = await getSession();
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page ?? "1", 10));
  const limit = 10;

  const [settings, { data: leads, meta }] = await Promise.all([
    getPlatformSettingsConfig(),
    listLeads({
      publisherId: session!.user.id,
      campaignSearch: params.campaign,
      source: params.source,
      sort: parseSort(params.sort),
      page,
      limit,
    }),
  ]);
  const leadIds = leads.map((lead) => lead.id);
  const creditedEntries =
    leadIds.length > 0
      ? await prisma.ledgerEntry.findMany({
          where: {
            type: "CREDIT",
            referenceType: "lead",
            referenceId: { in: leadIds },
            wallet: { userId: session!.user.id },
          },
          select: { referenceId: true, amount: true },
        })
      : [];
  const creditedByLeadId = new Map(
    creditedEntries.map((entry) => [entry.referenceId, Number(entry.amount)]),
  );

  return (
    <div className="space-y-6">
      <RoleHero
        eyebrow="Publisher Portal"
        title="My Leads"
        description="Track leads you've generated through your Smart Link."
      />

      <PublisherInfoBanner>
        Review date, payout, country, device, and status for each lead. Rejected leads show the
        rejection reason so you can improve traffic quality.
      </PublisherInfoBanner>

      <PageSection
        title="Lead Submissions"
        description="Detailed lead activity across campaigns"
        icon={FileText}
        gradient="leads"
      >
        <Suspense fallback={<div className="px-6 py-4 text-sm text-slate-500">Loading filters...</div>}>
          <PublisherLeadsFilters />
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
                    <PublisherLeadsSortHeader field="at" label="Date / Time" />
                  </Suspense>
                </TableHead>
                <TableHead className="h-11 whitespace-nowrap px-4 text-slate-600">Lead ID</TableHead>
                <TableHead className="h-11 whitespace-nowrap px-4 text-right text-slate-600">
                  Payout
                </TableHead>
                <TableHead className="h-11 whitespace-nowrap px-4 text-slate-600">Country</TableHead>
                <TableHead className="h-11 whitespace-nowrap px-4 text-slate-600">
                  <Suspense fallback={<span>Status</span>}>
                    <PublisherLeadsSortHeader field="status" label="Status" />
                  </Suspense>
                </TableHead>
                <TableHead className="h-11 whitespace-nowrap px-4 text-slate-600">Device</TableHead>
                <TableHead className="h-11 whitespace-nowrap px-4 text-slate-600">OS</TableHead>
                <TableHead className="h-11 whitespace-nowrap px-4 text-slate-600">Source</TableHead>
                <TableHead className="h-11 min-w-[180px] whitespace-nowrap px-4 text-slate-600">
                  Reject Reason
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leads.length === 0 ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={9} className="h-48 px-6 py-16 text-center">
                    <p className="text-base font-medium text-slate-500">No leads found</p>
                    <p className="mt-1 text-sm text-slate-400">
                      Share your Smart Link to start generating leads.
                    </p>
                  </TableCell>
                </TableRow>
              ) : (
                leads.map((lead) => {
                  const { device, os } = parseUserAgent(lead.userAgent);
                  const payoutAmount = calculatePublisherPayout(
                    Number(lead.campaign.cpl),
                    lead.country,
                    settings,
                  ).publisherAmount;
                  const creditedAmount = creditedByLeadId.get(lead.id);
                  const payout =
                    creditedAmount !== undefined
                      ? {
                          label: new Intl.NumberFormat("en-US", {
                            style: "currency",
                            currency: "USD",
                          }).format(creditedAmount),
                          className: "font-semibold text-emerald-700",
                        }
                      : lead.status === "PAID" || lead.status === "APPROVED"
                        ? lead.source === "optin"
                          ? { label: "—", className: "text-slate-400" }
                          : {
                              label: new Intl.NumberFormat("en-US", {
                                style: "currency",
                                currency: "USD",
                              }).format(payoutAmount),
                              className: "font-semibold text-emerald-700",
                            }
                        : lead.status === "PENDING" ||
                            lead.status === "VALIDATING" ||
                            lead.status === "CAPTURED"
                          ? { label: "Pending", className: "text-amber-700" }
                          : { label: "—", className: "text-slate-400" };
                  const rejectReason = formatLeadRejectReason(lead);

                  return (
                    <TableRow
                      key={lead.id}
                      className="border-slate-100 transition-colors hover:bg-blue-50/40"
                    >
                      <TableCell className="whitespace-nowrap px-4 py-4 text-sm text-slate-600">
                        {format(new Date(lead.createdAt), "MMM d, yyyy HH:mm:ss")}
                      </TableCell>
                      <TableCell className="whitespace-nowrap px-4 py-4 font-mono text-xs text-slate-500">
                        {shortLeadId(lead.id)}
                      </TableCell>
                      <TableCell className={cn("whitespace-nowrap px-4 py-4 text-right text-sm", payout.className)}>
                        {payout.label}
                      </TableCell>
                      <TableCell className="whitespace-nowrap px-4 py-4 text-sm text-slate-700">
                        {extractLeadCountry(lead.data, lead.country)}
                      </TableCell>
                      <TableCell className="whitespace-nowrap px-4 py-4">
                        <LeadStatusBadge status={lead.status} />
                      </TableCell>
                      <TableCell className="whitespace-nowrap px-4 py-4 text-sm text-slate-600">
                        {device}
                      </TableCell>
                      <TableCell className="whitespace-nowrap px-4 py-4 text-sm text-slate-600">
                        {os}
                      </TableCell>
                      <TableCell className="whitespace-nowrap px-4 py-4 text-sm capitalize text-slate-600">
                        {lead.source ?? "—"}
                      </TableCell>
                      <TableCell className="max-w-[220px] px-4 py-4 text-sm text-slate-600">
                        <p
                          className={cn(
                            "truncate",
                            lead.status === "REJECTED" && "text-red-700",
                          )}
                          title={rejectReason}
                        >
                          {rejectReason}
                        </p>
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
            perPage={meta.limit}
          />
        </Suspense>
      </PageSection>
    </div>
  );
}
