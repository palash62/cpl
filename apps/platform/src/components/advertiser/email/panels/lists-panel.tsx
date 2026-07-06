"use client";

import { useMemo } from "react";
import { List, Plus } from "lucide-react";
import { PageSection } from "@/components/admin/page-section";
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
import { filterBySearch, MOCK_LISTS } from "../email-mock-data";

function ListsContent() {
  const { search } = useEmailModuleFilters();
  const rows = useMemo(
    () => filterBySearch(MOCK_LISTS, search, ["name"]),
    [search],
  );

  return (
    <PageSection title="Email Lists" icon={List} gradient="leads">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Subscribers</TableHead>
              <TableHead>Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="h-32 text-center text-slate-500">
                  No lists match your search
                </TableCell>
              </TableRow>
            ) : (
              rows.map((list) => (
                <TableRow key={list.id} className="transition-colors hover:bg-slate-50">
                  <TableCell className="font-medium">{list.name}</TableCell>
                  <TableCell>{list.subscribers.toLocaleString()}</TableCell>
                  <TableCell className="text-slate-500">{list.createdAt}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </PageSection>
  );
}

export function ListsPanel() {
  return (
    <EmailModuleShell
      title="Lists"
      description="Organize subscribers into lists for targeted campaigns."
      breadcrumbs={[
        { label: "Autoresponder", href: "/advertiser/email" },
        { label: "Lists" },
      ]}
      stats={[
        { label: "Total Lists", value: "4", icon: List, accent: "purple" },
        { label: "Total Subscribers", value: "2,186", icon: List, accent: "green" },
      ]}
      searchPlaceholder="Search lists…"
      primaryAction={{ label: "Create List", icon: Plus }}
    >
      <ListsContent />
    </EmailModuleShell>
  );
}
