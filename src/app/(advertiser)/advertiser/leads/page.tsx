export const dynamic = "force-dynamic";

import { Suspense } from "react";
import { format } from "date-fns";
import { FileText, Info } from "lucide-react";
import Link from "next/link";
import { getSession } from "@/lib/session";
import {
  formatLeadLogData,
  formatLeadMessage,
  shortCampaignId,
} from "@/lib/advertiser-leads";
import { listLeads, type AdvertiserLeadSort } from "@/services/lead.service";
import { listBlockedPublishers } from "@/services/smart-link.service";
import { PageSection } from "@/components/admin/page-section";
import { LeadStatusBadge } from "@/components/admin/admin-ui";
import { RoleHero } from "@/components/layout/role-hero";
import { AdvertiserBlockPublisherButton } from "@/components/advertiser/advertiser-block-publisher-button";
import { AdvertiserLeadsFilters } from "@/components/advertiser/advertiser-leads-filters";
import { AdvertiserLeadsSortHeader } from "@/components/advertiser/advertiser-leads-sort-header";
import { AdvertiserLeadsTableFooter } from "@/components/advertiser/advertiser-leads-table-footer";
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
    "campaignId_asc",
    "campaignId_desc",
    "logData_asc",
    "logData_desc",
    "status_asc",
    "status_desc",
    "message_asc",
    "message_desc",
  ];
  return valid.includes(sort as AdvertiserLeadSort)
    ? (sort as AdvertiserLeadSort)
    : "created_desc";
}

export default async function AdvertiserLeadsPage({ searchParams }: PageProps) {
  const session = await getSession();
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page ?? "1", 10));
  const limit = 10;

  const { data: leads, meta } = await listLeads({
    advertiserId: session!.user.id,
    campaignSearch: params.campaign,
    sort: parseSort(params.sort),
    page,
    limit,
  });

  const blockedPublishers = await listBlockedPublishers(session!.user.id);
  const blockedIds = new Set(blockedPublishers.map((b) => b.publisherId));

  return (
    <div className="space-y-6">
      <RoleHero
        eyebrow="Advertiser Portal"
        title="Leads / Sales Logs"
        description="Review lead submissions, conversion events, and postback activity for your campaigns."
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
          You can review your leads and sales pixel and postback logs here. Please note that older
          logs are automatically deleted after a few days. For a comprehensive overview of leads and
          sales, refer to the{" "}
          <Link href="/advertiser/reports" className="font-medium text-[var(--theme-primary)] hover:underline">
            campaign statistics report
          </Link>
          .
        </p>
      </div>

      <PageSection
        title="Leads / Sales Logs"
        description="Lead and postback log entries for your campaigns"
        icon={FileText}
        gradient="leads"
      >
        <Suspense fallback={<div className="px-6 py-4 text-sm text-slate-500">Loading filters...</div>}>
          <AdvertiserLeadsFilters />
        </Suspense>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow
                className="border-none hover:bg-transparent"
                style={{ background: "var(--theme-primary-soft)" }}
              >
                <TableHead className="h-11 px-6 text-slate-600">
                  <Suspense fallback={<span>AT</span>}>
                    <AdvertiserLeadsSortHeader field="at" label="AT" />
                  </Suspense>
                </TableHead>
                <TableHead className="h-11 px-4 text-slate-600">
                  <Suspense fallback={<span>CAMPAIGN ID</span>}>
                    <AdvertiserLeadsSortHeader field="campaignId" label="Campaign ID" />
                  </Suspense>
                </TableHead>
                <TableHead className="h-11 px-4 text-slate-600">
                  <Suspense fallback={<span>CAMPAIGN</span>}>
                    <AdvertiserLeadsSortHeader field="campaign" label="Campaign" />
                  </Suspense>
                </TableHead>
                <TableHead className="h-11 px-4 text-slate-600">Publisher</TableHead>
                <TableHead className="h-11 px-4 text-slate-600">
                  <Suspense fallback={<span>LOG DATA</span>}>
                    <AdvertiserLeadsSortHeader field="logData" label="Log Data" />
                  </Suspense>
                </TableHead>
                <TableHead className="h-11 px-4 text-slate-600">
                  <Suspense fallback={<span>STATUS</span>}>
                    <AdvertiserLeadsSortHeader field="status" label="Status" />
                  </Suspense>
                </TableHead>
                <TableHead className="h-11 px-6 text-slate-600">
                  <Suspense fallback={<span>MESSAGE</span>}>
                    <AdvertiserLeadsSortHeader field="message" label="Message" />
                  </Suspense>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leads.length === 0 ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={7} className="h-48 px-6 py-16 text-center">
                    <p className="text-base font-medium text-slate-500">No Data Found</p>
                  </TableCell>
                </TableRow>
              ) : (
                leads.map((lead) => (
                  <TableRow
                    key={lead.id}
                    className="border-slate-100 transition-colors hover:bg-blue-50/40"
                  >
                    <TableCell className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">
                      {format(new Date(lead.createdAt), "MMM d, yyyy HH:mm:ss")}
                    </TableCell>
                    <TableCell className="px-4 py-4 font-mono text-xs text-slate-500">
                      {shortCampaignId(lead.campaign.id)}
                    </TableCell>
                    <TableCell className="px-4 py-4 text-sm text-slate-800">
                      {lead.campaign.name}
                    </TableCell>
                    <TableCell className="px-4 py-4">
                      <div className="flex flex-col gap-2">
                        <span className="text-sm font-medium text-slate-800">
                          {lead.publisher.name}
                        </span>
                        <AdvertiserBlockPublisherButton
                          publisherId={lead.publisherId}
                          publisherName={lead.publisher.name}
                          blocked={blockedIds.has(lead.publisherId)}
                        />
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[280px] px-4 py-4 font-mono text-xs text-slate-600">
                      <p className="truncate" title={formatLeadLogData(lead.data)}>
                        {formatLeadLogData(lead.data)}
                      </p>
                    </TableCell>
                    <TableCell className="px-4 py-4">
                      <LeadStatusBadge status={lead.status} />
                    </TableCell>
                    <TableCell className="max-w-[240px] px-6 py-4 text-sm text-slate-600">
                      <p className="truncate" title={formatLeadMessage(lead)}>
                        {formatLeadMessage(lead)}
                      </p>
                    </TableCell>
                  </TableRow>
                ))
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
