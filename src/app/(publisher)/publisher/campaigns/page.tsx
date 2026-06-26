export const dynamic = "force-dynamic";

import { Suspense } from "react";
import { Megaphone, Plus, Store } from "lucide-react";
import { auth } from "@/lib/auth";
import { shortPublisherCampaignId } from "@/lib/publisher-campaigns";
import {
  listPublisherCampaigns,
  type PublisherCampaignSort,
} from "@/services/campaign.service";
import { PageSection } from "@/components/admin/page-section";
import { formatCurrency } from "@/components/admin/admin-ui";
import { UsersTablePagination } from "@/components/admin/users-table-pagination";
import { RoleHero } from "@/components/layout/role-hero";
import { PublisherInfoBanner } from "@/components/publisher/publisher-info-banner";
import { PublisherCampaignsFilters } from "@/components/publisher/publisher-campaigns-filters";
import { PublisherCampaignsSortHeader } from "@/components/publisher/publisher-campaigns-sort-header";
import { PublisherCopyLinkButton } from "@/components/publisher/publisher-marketplace-table";
import { ButtonLink } from "@/components/ui/button-link";
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
    status?: string;
    sort?: string;
    page?: string;
  }>;
}

function parseSort(sort?: string): PublisherCampaignSort {
  const valid: PublisherCampaignSort[] = [
    "approved_desc",
    "name_asc",
    "name_desc",
    "cpl_asc",
    "cpl_desc",
    "clicks_asc",
    "clicks_desc",
    "status_asc",
    "status_desc",
  ];
  return valid.includes(sort as PublisherCampaignSort)
    ? (sort as PublisherCampaignSort)
    : "approved_desc";
}

export default async function PublisherCampaignsPage({ searchParams }: PageProps) {
  const session = await auth();
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page ?? "1", 10));
  const limit = 10;

  const { data: joins, meta } = await listPublisherCampaigns({
    publisherId: session!.user.id,
    search: params.q,
    status: params.status,
    sort: parseSort(params.sort),
    page,
    limit,
  });

  const hasFilters = !!(params.q || params.status || params.sort || (params.page && params.page !== "1"));

  return (
    <div className="space-y-6">
      <RoleHero
        eyebrow="Publisher Portal"
        title="My Campaigns"
        description="Campaigns you've joined, tracking links, and performance at a glance."
        action={{ label: "Browse Marketplace", href: "/publisher/marketplace", icon: Store }}
      />

      <PublisherInfoBanner>
        Manage your joined campaigns and copy tracking links to promote offers. Pending requests
        will appear here once approved by the advertiser or platform.
      </PublisherInfoBanner>

      <PageSection
        title="Joined Campaigns"
        description={
          hasFilters
            ? `Showing ${joins.length} filtered result${joins.length === 1 ? "" : "s"}`
            : `${meta.total} campaign${meta.total === 1 ? "" : "s"} joined`
        }
        icon={Megaphone}
        gradient="approved"
      >
        <Suspense fallback={<div className="px-6 py-4 text-sm text-slate-500">Loading filters...</div>}>
          <PublisherCampaignsFilters />
        </Suspense>

        {joins.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <div
              className="mb-4 flex h-14 w-14 items-center justify-center rounded-full"
              style={{ background: "var(--theme-primary-soft)" }}
            >
              <Megaphone className="h-7 w-7 text-[var(--theme-primary)]" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900">
              {hasFilters ? "No matching campaigns" : "No campaigns joined yet"}
            </h3>
            <p className="mt-1 max-w-sm text-sm text-slate-500">
              {hasFilters
                ? "Try adjusting your search or status filter."
                : "Browse the marketplace to find campaigns and start earning."}
            </p>
            {!hasFilters && (
              <ButtonLink
                href="/publisher/marketplace"
                className="mt-4 h-9 gap-1.5 rounded-lg bg-[var(--theme-primary)] px-4 text-sm hover:opacity-90"
              >
                <Plus className="h-4 w-4" />
                Browse Marketplace
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
                      <PublisherCampaignsSortHeader field="name" label="Campaign" />
                    </Suspense>
                  </TableHead>
                  <TableHead className="h-11 px-4 text-slate-600">Category</TableHead>
                  <TableHead className="h-11 px-4 text-right text-slate-600">
                    <Suspense fallback={<span>CPL</span>}>
                      <PublisherCampaignsSortHeader field="cpl" label="CPL" align="right" />
                    </Suspense>
                  </TableHead>
                  <TableHead className="h-11 px-4 text-right text-slate-600">
                    <Suspense fallback={<span>Clicks</span>}>
                      <PublisherCampaignsSortHeader field="clicks" label="Clicks" align="right" />
                    </Suspense>
                  </TableHead>
                  <TableHead className="h-11 px-4 text-slate-600">
                    <Suspense fallback={<span>Status</span>}>
                      <PublisherCampaignsSortHeader field="status" label="Join Status" />
                    </Suspense>
                  </TableHead>
                  <TableHead className="h-11 px-6 text-right text-slate-600">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {joins.map((join) => (
                  <TableRow
                    key={join.id}
                    className="border-slate-100 transition-colors hover:bg-blue-50/40"
                  >
                    <TableCell className="px-6 py-4 font-mono text-xs text-slate-500">
                      {shortPublisherCampaignId(join.campaign.id)}
                    </TableCell>
                    <TableCell className="px-4 py-4 font-medium text-slate-900">
                      {join.campaign.name}
                    </TableCell>
                    <TableCell className="px-4 py-4 capitalize text-slate-600">
                      {join.campaign.category.toLowerCase()}
                    </TableCell>
                    <TableCell className="px-4 py-4 text-right font-semibold text-[var(--theme-primary)]">
                      {formatCurrency(Number(join.campaign.cpl))}
                    </TableCell>
                    <TableCell className="px-4 py-4 text-right">
                      <span className="inline-flex min-w-8 items-center justify-center rounded-md bg-indigo-50 px-2.5 py-1 text-sm font-semibold text-indigo-700">
                        {join.clickCount}
                      </span>
                    </TableCell>
                    <TableCell className="px-4 py-4">
                      <Badge
                        variant="outline"
                        className={
                          join.status === "APPROVED"
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                            : join.status === "PENDING"
                              ? "border-amber-200 bg-amber-50 text-amber-700"
                              : "border-red-200 bg-red-50 text-red-700"
                        }
                      >
                        {join.status.toLowerCase()}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-6 py-4 text-right">
                      {join.trackingSlug ? (
                        <PublisherCopyLinkButton slug={join.trackingSlug} />
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
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
