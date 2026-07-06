"use client";

import { useMemo } from "react";
import { Plus, Send } from "lucide-react";
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
import { filterByField, filterBySearch, MOCK_CAMPAIGNS } from "../email-mock-data";

const STATUS_VARIANT: Record<string, "default" | "secondary" | "outline"> = {
  sent: "default",
  scheduled: "secondary",
  draft: "outline",
  sending: "default",
};

function CampaignsContent() {
  const { search, filterValues } = useEmailModuleFilters();
  const rows = useMemo(() => {
    let r = filterBySearch(MOCK_CAMPAIGNS, search, ["name"]);
    r = filterByField(r, "status", filterValues.status);
    return r;
  }, [search, filterValues]);

  return (
    <PageSection title="Email Campaigns" icon={Send} gradient="leads">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Sent</TableHead>
              <TableHead>Opens</TableHead>
              <TableHead>Clicks</TableHead>
              <TableHead>Scheduled</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-slate-500">
                  No campaigns match your search
                </TableCell>
              </TableRow>
            ) : (
              rows.map((c) => (
                <TableRow key={c.id} className="transition-colors hover:bg-slate-50">
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell>
                    <Badge variant={STATUS_VARIANT[c.status]}>{c.status}</Badge>
                  </TableCell>
                  <TableCell>{c.sent.toLocaleString()}</TableCell>
                  <TableCell>{c.opens}</TableCell>
                  <TableCell>{c.clicks}</TableCell>
                  <TableCell className="text-slate-500">{c.scheduledAt}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </PageSection>
  );
}

export function CampaignsPanel() {
  return (
    <EmailModuleShell
      title="Campaigns"
      description="Create and manage one-time email campaigns to your audience."
      breadcrumbs={[
        { label: "Autoresponder", href: "/advertiser/email" },
        { label: "Campaigns" },
      ]}
      stats={[
        { label: "Total Campaigns", value: "3", icon: Send, accent: "purple" },
        { label: "Sent", value: "1,240", icon: Send, variant: "leads" },
        { label: "Avg Open Rate", value: "39%", icon: Send, accent: "green" },
        { label: "Avg Click Rate", value: "7.4%", icon: Send, accent: "orange" },
      ]}
      searchPlaceholder="Search campaigns…"
      filters={[
        {
          id: "status",
          label: "Status",
          options: [
            { value: "draft", label: "Draft" },
            { value: "scheduled", label: "Scheduled" },
            { value: "sent", label: "Sent" },
          ],
        },
      ]}
      primaryAction={{ label: "Create Campaign", icon: Plus }}
    >
      <CampaignsContent />
    </EmailModuleShell>
  );
}
