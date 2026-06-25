import { Suspense } from "react";
import { format } from "date-fns";
import { Mail, Megaphone, UserCheck, Users, Share2 } from "lucide-react";
import type { UserStatus } from "@prisma/client";
import { listUsers } from "@/services/admin.service";
import { PageHero } from "@/components/admin/page-hero";
import { PageSection } from "@/components/admin/page-section";
import { GradientStatCard, NeutralStatCard } from "@/components/admin/gradient-stat-card";
import {
  avatarColors,
  formatCurrency,
  getInitials,
  KycStatusBadge,
  UserStatusBadge,
} from "@/components/admin/admin-ui";
import { UsersTableFilters } from "@/components/admin/users-table-filters";
import { UserStatusActions } from "@/components/admin/user-status-actions";
import { UsersTablePagination } from "@/components/admin/users-table-pagination";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{
    q?: string;
    status?: string;
    from?: string;
    to?: string;
    page?: string;
  }>;
}

export default async function AdminPublishersPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page ?? "1", 10));

  const [{ data: publishers, meta }, { data: allPublishers }] = await Promise.all([
    listUsers({
      role: "PUBLISHER",
      search: params.q,
      status: params.status as UserStatus | undefined,
      dateFrom: params.from ? new Date(params.from) : undefined,
      dateTo: params.to ? new Date(params.to) : undefined,
      page,
      limit: 20,
    }),
    listUsers({ role: "PUBLISHER", limit: 500 }),
  ]);

  const activeCount = allPublishers.filter((u) => u.status === "ACTIVE").length;
  const totalLeads = allPublishers.reduce((sum, u) => sum + u._count.leads, 0);
  const kycApproved = allPublishers.filter((u) => u.publisherProfile?.kycStatus === "APPROVED").length;

  const hasFilters = !!(params.q || params.status || params.from || params.to);

  return (
    <div className="space-y-7">
      <PageHero
        eyebrow="User Management"
        title="Publishers"
        description="Manage publisher accounts, KYC status, and earnings"
        badge={`${meta.total} total account${meta.total === 1 ? "" : "s"}`}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <GradientStatCard variant="leads" label="Total Leads Generated" value={totalLeads} icon={Megaphone} />
        <NeutralStatCard label="Total Publishers" value={allPublishers.length} icon={Users} accent="purple" />
        <NeutralStatCard label="Active Accounts" value={activeCount} icon={UserCheck} accent="green" />
        <NeutralStatCard label="KYC Approved" value={kycApproved} icon={Share2} accent="orange" />
      </div>

      <PageSection
        title="Publisher Accounts"
        description={
          hasFilters
            ? `Showing ${publishers.length} filtered result${publishers.length === 1 ? "" : "s"}`
            : "View and manage all registered publishers on the platform"
        }
        icon={Share2}
        gradient="leads"
      >
        <Suspense fallback={<div className="px-6 py-4 text-sm text-slate-500">Loading filters...</div>}>
          <UsersTableFilters />
        </Suspense>

        {publishers.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full" style={{ background: "var(--theme-primary-soft)" }}>
              <Share2 className="h-7 w-7 text-[var(--theme-primary)]" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900">
              {hasFilters ? "No matching publishers" : "No publishers yet"}
            </h3>
            <p className="mt-1 max-w-sm text-sm text-slate-500">
              {hasFilters
                ? "Try adjusting your search or filter criteria."
                : "Publisher accounts will appear here once users register."}
            </p>
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow className="border-none hover:bg-transparent" style={{ background: "var(--theme-primary-soft)" }}>
                  <TableHead className="h-11 px-6 text-slate-600">Publisher</TableHead>
                  <TableHead className="h-11 px-4 text-slate-600">KYC</TableHead>
                  <TableHead className="h-11 px-4 text-center text-slate-600">Leads</TableHead>
                  <TableHead className="h-11 px-4 text-right text-slate-600">Earnings</TableHead>
                  <TableHead className="h-11 px-4 text-slate-600">Status</TableHead>
                  <TableHead className="h-11 px-4 text-slate-600">Joined</TableHead>
                  <TableHead className="h-11 px-6 text-right text-slate-600">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {publishers.map((publisher, index) => {
                  const balance = Number(publisher.wallet?.balance ?? 0);
                  return (
                    <TableRow key={publisher.id} className="border-slate-100 transition-colors hover:bg-indigo-50/40">
                      <TableCell className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <Avatar size="lg">
                            <AvatarFallback className={cn("text-sm font-semibold", avatarColors[index % avatarColors.length])}>
                              {getInitials(publisher.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="truncate font-medium text-slate-900">{publisher.name}</p>
                            <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-slate-500">
                              <Mail className="h-3 w-3 shrink-0 text-[var(--theme-primary)]" />
                              {publisher.email}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-4">
                        {publisher.publisherProfile ? (
                          <KycStatusBadge status={publisher.publisherProfile.kycStatus} />
                        ) : (
                          <span className="text-sm text-slate-400">—</span>
                        )}
                      </TableCell>
                      <TableCell className="px-4 py-4 text-center">
                        <span className="inline-flex min-w-8 items-center justify-center rounded-md bg-violet-50 px-2.5 py-1 text-sm font-semibold text-violet-700">
                          {publisher._count.leads}
                        </span>
                      </TableCell>
                      <TableCell className="px-4 py-4 text-right">
                        <span className={cn("text-sm font-semibold tabular-nums", balance > 0 ? "text-emerald-600" : "text-slate-400")}>
                          {formatCurrency(balance)}
                        </span>
                      </TableCell>
                      <TableCell className="px-4 py-4">
                        <UserStatusBadge status={publisher.status} />
                      </TableCell>
                      <TableCell className="px-4 py-4 text-sm text-slate-500">
                        {format(new Date(publisher.createdAt), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell className="px-6 py-4 text-right">
                        <UserStatusActions userId={publisher.id} currentStatus={publisher.status} />
                      </TableCell>
                    </TableRow>
                  );
                })}
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
