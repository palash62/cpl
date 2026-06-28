export const dynamic = "force-dynamic";

import { Suspense } from "react";
import { format } from "date-fns";
import { FileText } from "lucide-react";
import { getSession } from "@/lib/session";
import { shortPublisherCampaignId } from "@/lib/publisher-campaigns";
import { listLeads, type AdvertiserLeadSort } from "@/services/lead.service";
import { PageSection } from "@/components/admin/page-section";
import { formatCurrency, LeadStatusBadge } from "@/components/admin/admin-ui";
import { RoleHero } from "@/components/layout/role-hero";
import { AdvertiserLeadsTableFooter } from "@/components/advertiser/advertiser-leads-table-footer";
import { PublisherInfoBanner } from "@/components/publisher/publisher-info-banner";
import { PublisherLeadsFilters } from "@/components/publisher/publisher-leads-filters";
import { PublisherLeadsSortHeader } from "@/components/publisher/publisher-leads-sort-header";
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

  const { data: leads, meta } = await listLeads({
    publisherId: session!.user.id,
    campaignSearch: params.campaign,
    source: params.source,
    sort: parseSort(params.sort),
    page,
    limit,
  });

  return (
    <div className="space-y-6">
      <RoleHero
        eyebrow="Publisher Portal"
        title="My Leads"
        description="Track leads you've generated through your Smart Link."
      />

      <PublisherInfoBanner>
        Monitor lead status and earnings by campaign and traffic source. Approved and paid leads
        contribute to your wallet balance automatically.
      </PublisherInfoBanner>

      <PageSection
        title="Lead Submissions"
        description="Your lead activity across campaigns"
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
                <TableHead className="h-11 px-6 text-slate-600">
                  <Suspense fallback={<span>Date</span>}>
                    <PublisherLeadsSortHeader field="at" label="Date" />
                  </Suspense>
                </TableHead>
                <TableHead className="h-11 px-4 text-slate-600">Lead ID</TableHead>
                <TableHead className="h-11 px-4 text-slate-600">
                  <Suspense fallback={<span>Campaign</span>}>
                    <PublisherLeadsSortHeader field="campaign" label="Campaign" />
                  </Suspense>
                </TableHead>
                <TableHead className="h-11 px-4 text-slate-600">Source</TableHead>
                <TableHead className="h-11 px-4 text-right text-slate-600">CPL</TableHead>
                <TableHead className="h-11 px-6 text-slate-600">
                  <Suspense fallback={<span>Status</span>}>
                    <PublisherLeadsSortHeader field="status" label="Status" />
                  </Suspense>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leads.length === 0 ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={6} className="h-48 px-6 py-16 text-center">
                    <p className="text-base font-medium text-slate-500">No leads found</p>
                    <p className="mt-1 text-sm text-slate-400">
                      Share your Smart Link to start generating leads.
                    </p>
                  </TableCell>
                </TableRow>
              ) : (
                leads.map((lead) => (
                  <TableRow
                    key={lead.id}
                    className="border-slate-100 transition-colors hover:bg-blue-50/40"
                  >
                    <TableCell className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">
                      {format(new Date(lead.createdAt), "MMM d, yyyy HH:mm")}
                    </TableCell>
                    <TableCell className="px-4 py-4 font-mono text-xs text-slate-500">
                      {shortPublisherCampaignId(lead.id)}
                    </TableCell>
                    <TableCell className="px-4 py-4 text-sm font-medium text-slate-800">
                      {lead.campaign.name}
                    </TableCell>
                    <TableCell className="px-4 py-4 text-sm capitalize text-slate-600">
                      {lead.source ?? "—"}
                    </TableCell>
                    <TableCell className="px-4 py-4 text-right font-semibold text-[var(--theme-primary)]">
                      {formatCurrency(Number(lead.campaign.cpl))}
                    </TableCell>
                    <TableCell className="px-6 py-4">
                      <LeadStatusBadge status={lead.status} />
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
