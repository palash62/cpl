import { Suspense } from "react";
import { redirect } from "next/navigation";
import { formatUserDateTime } from "@/lib/user-timezone";
import { LayoutGrid, Phone, UserCheck, UserCog, UserX, Users } from "lucide-react";
import type { UserStatus } from "@prisma/client";
import { listPlatformManagers, getUserDeleteEligibility } from "@/services/admin.service";
import { getSession } from "@/lib/session";
import { parseStaffMenuAccess } from "@/lib/admin-portal";
import { PageHero } from "@/components/admin/page-hero";
import { PageSection } from "@/components/admin/page-section";
import { NeutralStatCard } from "@/components/admin/gradient-stat-card";
import {
  avatarColors,
  getInitials,
  UserStatusBadge,
} from "@/components/admin/admin-ui";
import { AdminCreateStaffUserDialog } from "@/components/admin/admin-create-staff-user-dialog";
import { AdminEditStaffMenusDialog } from "@/components/admin/admin-edit-staff-menus-dialog";
import { StaffUserActionsMenu } from "@/components/admin/staff-user-actions-menu";
import { UsersTableFilters } from "@/components/admin/users-table-filters";
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
import { ADMIN_NAV } from "@/components/layout/nav-config";
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

function menuLabels(access: string[]) {
  const items = Array.isArray(ADMIN_NAV) ? ADMIN_NAV : [];
  const map = new Map(items.map((n) => [n.href, n.label]));
  return access.map((href) => map.get(href) ?? href);
}

export default async function AdminUsersPage({ searchParams }: PageProps) {
  const session = await getSession();
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/admin");
  }

  const tz = session.user.timezone;
  const adminId = session.user.id;
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page ?? "1", 10));
  const hasFilters = !!(params.q || params.status || params.from || params.to);

  const [{ data: managers, meta }, { data: allManagers }] = await Promise.all([
    listPlatformManagers({
      search: params.q,
      status: params.status as UserStatus | undefined,
      dateFrom: params.from ? new Date(params.from) : undefined,
      dateTo: params.to ? new Date(params.to) : undefined,
      page,
      limit: 20,
    }),
    listPlatformManagers({ limit: 500 }),
  ]);

  const activeCount = allManagers.filter((u) => u.status === "ACTIVE").length;
  const inactiveCount = allManagers.filter((u) => u.status === "SUSPENDED").length;
  const customMenusCount = allManagers.filter(
    (u) => parseStaffMenuAccess(u.staffMenuAccess).length > 0,
  ).length;

  return (
    <div className="space-y-7">
      <PageHero
        eyebrow="User Management"
        title="Users"
        description="Create Platform Managers, grant menu access, and set staff accounts inactive."
        badge={`${meta.total} platform manager${meta.total === 1 ? "" : "s"}`}
      />

      <div className="flex flex-wrap items-center justify-end gap-3">
        <AdminCreateStaffUserDialog />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <NeutralStatCard
          compact
          label="Platform Managers"
          value={allManagers.length}
          icon={Users}
          accent="purple"
        />
        <NeutralStatCard
          compact
          label="Active"
          value={activeCount}
          icon={UserCheck}
          accent="green"
        />
        <NeutralStatCard
          compact
          label="Inactive"
          value={inactiveCount}
          icon={UserX}
          accent="red"
        />
        <NeutralStatCard
          compact
          label="Custom menus"
          value={customMenusCount}
          icon={LayoutGrid}
          accent="orange"
        />
      </div>

      <PageSection
        title="Platform Managers"
        description={
          hasFilters
            ? `Showing ${managers.length} filtered result${managers.length === 1 ? "" : "s"}`
            : "Staff accounts with custom admin menu access"
        }
        icon={UserCog}
      >
        <Suspense fallback={<div className="px-6 py-4 text-sm text-slate-500">Loading filters...</div>}>
          <UsersTableFilters suspendedLabel="Inactive" hidePending />
        </Suspense>

        {managers.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
            <div
              className="mb-4 flex h-12 w-12 items-center justify-center rounded-full"
              style={{ background: "var(--theme-primary-soft)" }}
            >
              <UserCog className="h-6 w-6 text-[var(--theme-primary)]" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900">
              {hasFilters ? "No matching managers" : "No platform managers yet"}
            </h3>
            <p className="mt-1 max-w-sm text-sm text-slate-500">
              {hasFilters
                ? "Try adjusting your search or filter criteria."
                : "Create a staff account to grant custom admin menu access."}
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow
                    className="border-none hover:bg-transparent"
                    style={{ background: "var(--theme-primary-soft)" }}
                  >
                    <TableHead className="h-10 px-6 text-slate-600">User</TableHead>
                    <TableHead className="h-10 px-4 text-slate-600">Contact</TableHead>
                    <TableHead className="h-10 px-4 text-slate-600">Menus</TableHead>
                    <TableHead className="h-10 px-4 text-slate-600">Status</TableHead>
                    <TableHead className="h-10 px-4 text-slate-600">Created</TableHead>
                    <TableHead className="h-10 px-6 text-right text-slate-600">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {managers.map((user, index) => {
                    const menus = parseStaffMenuAccess(user.staffMenuAccess);
                    const labels = menuLabels(menus);
                    const deleteEligibility = getUserDeleteEligibility(
                      {
                        id: user.id,
                        role: user.role,
                        wallet: user.wallet,
                        _count: user._count,
                      },
                      adminId,
                    );
                    return (
                      <TableRow
                        key={user.id}
                        className="border-slate-100 transition-colors hover:bg-blue-50/40"
                      >
                        <TableCell className="px-6 py-2.5">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback
                                className={cn(
                                  "text-xs font-semibold text-white",
                                  avatarColors[index % avatarColors.length],
                                )}
                              >
                                {getInitials(user.name)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium text-slate-900">
                                {user.name}
                              </p>
                              <p className="truncate text-xs text-slate-500">{user.email}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="px-4 py-2.5 text-sm text-slate-600">
                          <div className="space-y-0.5">
                            {user.phone ? (
                              <p className="flex items-center gap-1.5">
                                <Phone className="h-3.5 w-3.5 shrink-0" />
                                {user.phone}
                              </p>
                            ) : null}
                            {user.country ? <p>{user.country}</p> : null}
                            {!user.phone && !user.country ? (
                              <span className="text-slate-400">—</span>
                            ) : null}
                          </div>
                        </TableCell>
                        <TableCell className="max-w-[220px] px-4 py-2.5">
                          {labels.length === 0 ? (
                            <span className="text-sm text-slate-400">Dashboard only</span>
                          ) : (
                            <p className="line-clamp-1 text-sm text-slate-600">
                              {labels.join(", ")}
                            </p>
                          )}
                        </TableCell>
                        <TableCell className="px-4 py-2.5">
                          <UserStatusBadge status={user.status} suspendedLabel="inactive" />
                        </TableCell>
                        <TableCell className="whitespace-nowrap px-4 py-2.5 text-sm text-slate-500">
                          {formatUserDateTime(user.createdAt, tz, "MMM d, yyyy")}
                        </TableCell>
                        <TableCell className="px-6 py-2.5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <AdminEditStaffMenusDialog
                              userId={user.id}
                              initialMenus={menus}
                            />
                            <StaffUserActionsMenu
                              userId={user.id}
                              userName={user.name}
                              currentStatus={user.status}
                              deleteDisabledReason={deleteEligibility.reason}
                            />
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
            <Suspense>
              <UsersTablePagination
                page={meta.page}
                totalPages={meta.totalPages}
                total={meta.total}
              />
            </Suspense>
          </>
        )}
      </PageSection>
    </div>
  );
}
