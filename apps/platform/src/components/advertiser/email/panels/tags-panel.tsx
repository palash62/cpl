"use client";

import { useMemo } from "react";
import { Plus, Tags } from "lucide-react";
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
import { filterBySearch, MOCK_TAGS } from "../email-mock-data";

function TagsContent() {
  const { search } = useEmailModuleFilters();
  const rows = useMemo(
    () => filterBySearch(MOCK_TAGS, search, ["name"]),
    [search],
  );

  return (
    <PageSection title="Subscriber Tags" icon={Tags} gradient="revenue">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tag</TableHead>
              <TableHead>Subscribers</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={2} className="h-32 text-center text-slate-500">
                  No tags match your search
                </TableCell>
              </TableRow>
            ) : (
              rows.map((tag) => (
                <TableRow key={tag.id} className="transition-colors hover:bg-slate-50">
                  <TableCell>
                    <Badge className={tag.color}>{tag.name}</Badge>
                  </TableCell>
                  <TableCell>{tag.subscribers}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </PageSection>
  );
}

export function TagsPanel() {
  return (
    <EmailModuleShell
      title="Tags"
      description="Label subscribers with tags for flexible segmentation and targeting."
      breadcrumbs={[
        { label: "Autoresponder", href: "/advertiser/email" },
        { label: "Tags" },
      ]}
      stats={[
        { label: "Total Tags", value: "4", icon: Tags, accent: "purple" },
        { label: "Tagged Subscribers", value: "1,322", icon: Tags, accent: "green" },
      ]}
      searchPlaceholder="Search tags…"
      primaryAction={{ label: "Create Tag", icon: Plus }}
    >
      <TagsContent />
    </EmailModuleShell>
  );
}
