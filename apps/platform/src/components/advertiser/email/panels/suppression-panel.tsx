"use client";

import { useMemo } from "react";
import { AlertTriangle } from "lucide-react";
import { PageSection } from "@/components/admin/page-section";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useEmailModuleFilters } from "../email-module-filter-context";
import { EmailModuleShell } from "../email-module-shell";
import {
  filterBySearch,
  MOCK_BOUNCED,
  MOCK_COMPLAINTS,
  MOCK_UNSUBSCRIBED,
  type MockSuppression,
} from "../email-mock-data";

function SuppressionTable({ rows }: { rows: MockSuppression[] }) {
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Email</TableHead>
            <TableHead>Reason</TableHead>
            <TableHead>Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={3} className="h-32 text-center text-slate-500">
                No records match your search
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row) => (
              <TableRow key={row.id} className="transition-colors hover:bg-slate-50">
                <TableCell className="font-medium">{row.email}</TableCell>
                <TableCell className="text-slate-600">{row.reason}</TableCell>
                <TableCell className="text-slate-500">{row.date}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}

function SuppressionContent() {
  const { search } = useEmailModuleFilters();
  const bounced = useMemo(
    () => filterBySearch(MOCK_BOUNCED, search, ["email", "reason"]),
    [search],
  );
  const complaints = useMemo(
    () => filterBySearch(MOCK_COMPLAINTS, search, ["email", "reason"]),
    [search],
  );
  const unsubscribed = useMemo(
    () => filterBySearch(MOCK_UNSUBSCRIBED, search, ["email", "reason"]),
    [search],
  );

  return (
    <PageSection title="Suppressed Contacts" icon={AlertTriangle} gradient="approved">
      <Tabs defaultValue="bounced" className="px-6 pb-6">
        <TabsList className="mb-4">
          <TabsTrigger value="bounced">Bounced</TabsTrigger>
          <TabsTrigger value="complaints">Complaints</TabsTrigger>
          <TabsTrigger value="unsubscribed">Unsubscribed</TabsTrigger>
        </TabsList>
        <TabsContent value="bounced">
          <SuppressionTable rows={bounced} />
        </TabsContent>
        <TabsContent value="complaints">
          <SuppressionTable rows={complaints} />
        </TabsContent>
        <TabsContent value="unsubscribed">
          <SuppressionTable rows={unsubscribed} />
        </TabsContent>
      </Tabs>
    </PageSection>
  );
}

export function SuppressionPanel() {
  return (
    <EmailModuleShell
      title="Suppression List"
      description="Manage bounced addresses, spam complaints, and unsubscribed contacts."
      breadcrumbs={[
        { label: "Autoresponder", href: "/advertiser/email" },
        { label: "Suppression List" },
      ]}
      stats={[
        { label: "Bounced", value: "10", icon: AlertTriangle, accent: "red" },
        { label: "Complaints", value: "1", icon: AlertTriangle, accent: "orange" },
        { label: "Unsubscribed", value: "32", icon: AlertTriangle, accent: "purple" },
      ]}
      searchPlaceholder="Search suppressed emails…"
    >
      <SuppressionContent />
    </EmailModuleShell>
  );
}
