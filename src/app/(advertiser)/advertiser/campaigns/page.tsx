export const dynamic = "force-dynamic";

import { Suspense } from "react";
import { Info, Megaphone, Plus } from "lucide-react";
import { getSession } from "@/lib/session";
import {
  listAdvertiserCampaigns,
  type AdvertiserCampaignSort,
} from "@/services/campaign.service";
import { PageSection } from "@/components/admin/page-section";
import { CampaignStatusBadge, formatCurrency } from "@/components/admin/admin-ui";
import { UsersTablePagination } from "@/components/admin/users-table-pagination";
import { RoleHero } from "@/components/layout/role-hero";
import { AdvertiserCampaignsFilters } from "@/components/advertiser/advertiser-campaigns-filters";
import { defaultCampaignDateFrom, defaultCampaignDateTo } from "@/lib/advertiser-campaigns";
import { AdvertiserCampaignsSortHeader } from "@/components/advertiser/advertiser-campaigns-sort-header";
import { ButtonLink } from "@/components/ui/button-link";
import { CampaignPixelButton } from "@/components/advertiser/campaign-pixel-button";
import { Badge } from "@/components/ui/badge";
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
    q?: string;
    from?: string;
    to?: string;
    sort?: string;
    page?: string;
  }>;
}

function parseSort(sort?: string): AdvertiserCampaignSort {
  const valid: AdvertiserCampaignSort[] = [
    "created_desc",
    "name_asc",
    "name_desc",
    "leads_asc",
    "leads_desc",
    "cpl_asc",
    "cpl_desc",
    "spent_asc",
    "spent_desc",
  ];
  return valid.includes(sort as AdvertiserCampaignSort)
    ? (sort as AdvertiserCampaignSort)
    : "created_desc";
}

function shortId(id: string) {
  return id.slice(-8).toUpperCase();
}

export default async function AdvertiserCampaignsPage({ searchParams }: PageProps) {
  const [session, params] = await Promise.all([getSession(), searchParams]);
  const page = Math.max(1, parseInt(params.page ?? "1", 10));
  const limit = 10;
  const dateFrom = params.from ?? defaultCampaignDateFrom();
  const dateTo = params.to ?? defaultCampaignDateTo();

  const { data: campaigns, meta } = await listAdvertiserCampaigns({
    advertiserId: session!.user.id,
    search: params.q,
    dateFrom: new Date(dateFrom),
    dateTo: new Date(dateTo),
    sort: parseSort(params.sort),
    page,
    limit,
  });

  const hasFilters = !!(params.q || params.sort || (params.page && params.page !== "1"));

  return (
    <div className="space-y-6">
      <RoleHero
        eyebrow="Advertiser Portal"
        title="All Campaigns"
        description="Manage your lead generation campaigns, track CPL performance, and control lead approval."
        action={{ label: "Create Campaign", href: "/advertiser/campaigns/new", icon: Megaphone }}
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
          Create a campaign to start collecting leads from publishers. Set your CPL, budget, and
          approval rules — verified leads are billed only when they meet your criteria.
        </p>
      </div>

      <PageSection
        title="Campaign List"
        description={
          hasFilters
            ? `Showing ${campaigns.length} filtered result${campaigns.length === 1 ? "" : "s"}`
            : `${meta.total} campaign${meta.total === 1 ? "" : "s"} in the selected period`
        }
        icon={Megaphone}
        gradient="approved"
      >
        <Suspense fallback={<div className="px-6 py-4 text-sm text-slate-500">Loading filters...</div>}>
          <AdvertiserCampaignsFilters />
        </Suspense>

        {campaigns.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <div
              className="mb-4 flex h-14 w-14 items-center justify-center rounded-full"
              style={{ background: "var(--theme-primary-soft)" }}
            >
              <Megaphone className="h-7 w-7 text-[var(--theme-primary)]" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900">
              {hasFilters ? "No matching campaigns" : "No campaigns yet"}
            </h3>
            <p className="mt-1 max-w-sm text-sm text-slate-500">
              {hasFilters
                ? "Try adjusting your search or date range."
                : "Create your first campaign to start collecting leads from publishers."}
            </p>
            {!hasFilters && (
              <ButtonLink
                href="/advertiser/campaigns/new"
                className="mt-4 h-9 gap-1.5 rounded-lg bg-[var(--theme-primary)] px-4 text-sm hover:opacity-90"
              >
                <Plus className="h-4 w-4" />
                Create Campaign
              </ButtonLink>
            )}
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow
                  className="border-none hover:bg-transparent"
                  style={{ background: "var(--theme-primary-soft)" }}
                >
                  <TableHead className="h-11 w-[90px] px-6 text-slate-600">ID</TableHead>
                  <TableHead className="h-11 px-4 text-slate-600">
                    <Suspense fallback={<span>Name</span>}>
                      <AdvertiserCampaignsSortHeader field="name" label="Name" />
                    </Suspense>
                  </TableHead>
                  <TableHead className="h-11 px-4 text-right text-slate-600">
                    <Suspense fallback={<span>Leads</span>}>
                      <AdvertiserCampaignsSortHeader field="leads" label="Leads" align="right" />
                    </Suspense>
                  </TableHead>
                  <TableHead className="h-11 px-4 text-right text-slate-600">
                    <Suspense fallback={<span>CPL</span>}>
                      <AdvertiserCampaignsSortHeader field="cpl" label="CPL" align="right" />
                    </Suspense>
                  </TableHead>
                  <TableHead className="h-11 px-4 text-right text-slate-600">
                    <Suspense fallback={<span>Cost</span>}>
                      <AdvertiserCampaignsSortHeader field="spent" label="Cost" align="right" />
                    </Suspense>
                  </TableHead>
                  <TableHead className="h-11 px-4 text-slate-600">Approval</TableHead>
                  <TableHead className="h-11 px-6 text-right text-slate-600">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {campaigns.map((c) => (
                  <TableRow
                    key={c.id}
                    className="border-slate-100 transition-colors hover:bg-blue-50/40"
                  >
                    <TableCell className="px-6 py-4 font-mono text-xs text-slate-500">
                      {shortId(c.id)}
                    </TableCell>
                    <TableCell className="px-4 py-4">
                      <p className="font-medium text-slate-900">{c.name}</p>
                      <p className="text-xs capitalize text-slate-500">{c.category.toLowerCase()}</p>
                    </TableCell>
                    <TableCell className="px-4 py-4 text-right">
                      <span className="inline-flex min-w-8 items-center justify-center rounded-md bg-indigo-50 px-2.5 py-1 text-sm font-semibold text-indigo-700">
                        {c._count.leads}
                      </span>
                    </TableCell>
                    <TableCell className="px-4 py-4 text-right">
                      <span className="font-semibold text-[var(--theme-primary)]">
                        {formatCurrency(Number(c.cpl))}
                      </span>
                    </TableCell>
                    <TableCell className="px-4 py-4 text-right text-sm font-medium text-slate-700">
                      {formatCurrency(Number(c.spent))}
                    </TableCell>
                    <TableCell className="px-4 py-4">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <CampaignStatusBadge status={c.status} />
                        <Badge variant="outline" className="text-xs font-normal">
                          {c.autoApprove ? "Auto" : "Manual"}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <CampaignPixelButton
                          campaignId={c.id}
                          campaignName={c.name}
                          pixelToken={c.pixelToken}
                        />
                        <ButtonLink
                          href="/advertiser/leads"
                          variant="outline"
                          size="sm"
                          className="h-8 rounded-md border-slate-200 text-xs"
                        >
                          View Leads
                        </ButtonLink>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <Suspense>
              <UsersTablePagination page={meta.page} totalPages={meta.totalPages} total={meta.total} />
            </Suspense>
          </>
        )}
      </PageSection>
    </div>
  );
}
