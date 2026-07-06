"use client";

import { useMemo } from "react";
import { Filter, Plus, Users } from "lucide-react";
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
import { filterBySearch, MOCK_SEGMENTS } from "../email-mock-data";

function SegmentsContent() {
  const { search } = useEmailModuleFilters();
  const rows = useMemo(
    () => filterBySearch(MOCK_SEGMENTS, search, ["name", "rules"]),
    [search],
  );

  return (
    <PageSection title="Audience Segments" icon={Filter} gradient="approved">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Rules</TableHead>
              <TableHead>Subscribers</TableHead>
              <TableHead>Updated</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-32 text-center text-slate-500">
                  No segments match your search
                </TableCell>
              </TableRow>
            ) : (
              rows.map((seg) => (
                <TableRow key={seg.id} className="transition-colors hover:bg-slate-50">
                  <TableCell className="font-medium">{seg.name}</TableCell>
                  <TableCell className="max-w-xs truncate text-slate-600">{seg.rules}</TableCell>
                  <TableCell>{seg.subscribers}</TableCell>
                  <TableCell className="text-slate-500">{seg.updatedAt}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </PageSection>
  );
}

export function SegmentsPanel() {
  return (
    <EmailModuleShell
      title="Segments"
      description="Create dynamic audience segments based on behavior and attributes."
      breadcrumbs={[
        { label: "Autoresponder", href: "/advertiser/email" },
        { label: "Segments" },
      ]}
      stats={[
        { label: "Active Segments", value: "3", icon: Filter, accent: "purple" },
        { label: "Matched Subscribers", value: "269", icon: Users, accent: "green" },
      ]}
      searchPlaceholder="Search segments…"
      primaryAction={{ label: "Create Segment", icon: Plus }}
    >
      <SegmentsContent />
    </EmailModuleShell>
  );
}
