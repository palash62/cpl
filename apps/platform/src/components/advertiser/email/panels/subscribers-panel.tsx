"use client";

import { useMemo } from "react";
import { Download, Upload, UserPlus, Users } from "lucide-react";
import { PageSection } from "@/components/admin/page-section";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useEmailModuleFilters } from "../email-module-filter-context";
import { EmailModuleShell } from "../email-module-shell";
import { filterByField, filterBySearch, MOCK_SUBSCRIBERS } from "../email-mock-data";

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  active: "default",
  unsubscribed: "secondary",
  bounced: "destructive",
};

function SubscribersContent() {
  const { search, filterValues } = useEmailModuleFilters();
  const rows = useMemo(() => {
    let r = filterBySearch(MOCK_SUBSCRIBERS, search, ["email", "name"]);
    r = filterByField(r, "status", filterValues.status);
    return r;
  }, [search, filterValues]);

  return (
    <PageSection title="All Subscribers" icon={Users} gradient="approved">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Lists</TableHead>
              <TableHead>Tags</TableHead>
              <TableHead>Subscribed</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-slate-500">
                  No subscribers match your search
                </TableCell>
              </TableRow>
            ) : (
              rows.map((sub) => (
                <TableRow key={sub.id} className="transition-colors hover:bg-slate-50">
                  <TableCell className="font-medium">{sub.email}</TableCell>
                  <TableCell>{sub.name}</TableCell>
                  <TableCell>
                    <Badge variant={STATUS_VARIANT[sub.status]}>{sub.status}</Badge>
                  </TableCell>
                  <TableCell className="text-slate-600">{sub.lists}</TableCell>
                  <TableCell className="text-slate-600">{sub.tags}</TableCell>
                  <TableCell className="text-slate-500">{sub.subscribedAt}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </PageSection>
  );
}

export function SubscribersPanel() {
  return (
    <EmailModuleShell
      title="Subscribers"
      description="Manage your email subscribers, import lists, and track subscription status."
      breadcrumbs={[
        { label: "Autoresponder", href: "/advertiser/email" },
        { label: "Subscribers" },
      ]}
      stats={[
        { label: "Total", value: "1,240", icon: Users, accent: "purple" },
        { label: "Active", value: "1,198", icon: Users, accent: "green" },
        { label: "Unsubscribed", value: "32", icon: Users, accent: "orange" },
        { label: "Bounced", value: "10", icon: Users, accent: "red" },
      ]}
      searchPlaceholder="Search by email or name…"
      filters={[
        {
          id: "status",
          label: "Status",
          options: [
            { value: "active", label: "Active" },
            { value: "unsubscribed", label: "Unsubscribed" },
            { value: "bounced", label: "Bounced" },
          ],
        },
      ]}
      primaryAction={{ label: "Add Subscriber", icon: UserPlus }}
      secondaryActions={[
        { label: "Import", icon: Upload, variant: "outline" },
        { label: "Export", icon: Download, variant: "outline" },
      ]}
    >
      <SubscribersContent />
    </EmailModuleShell>
  );
}
