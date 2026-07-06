"use client";

import { FormInput, Plus } from "lucide-react";
import { PageSection } from "@/components/admin/page-section";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmailModuleShell } from "../email-module-shell";
import { MOCK_FORMS } from "../email-mock-data";

export function FormsPanel() {
  return (
    <EmailModuleShell
      title="Forms"
      description="Create embedded and popup signup forms to grow your subscriber list."
      breadcrumbs={[
        { label: "Autoresponder", href: "/advertiser/email" },
        { label: "Forms" },
      ]}
      stats={[
        { label: "Active Forms", value: "2", icon: FormInput, accent: "purple" },
        { label: "Total Submissions", value: "1,726", icon: FormInput, accent: "green" },
        { label: "Avg Conversion", value: "4.5%", icon: FormInput, accent: "orange" },
      ]}
      searchPlaceholder="Search forms…"
      primaryAction={{ label: "Create Form", icon: Plus }}
    >
      <PageSection title="Signup Forms" icon={FormInput} gradient="revenue">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {MOCK_FORMS.map((form) => (
            <Card
              key={form.id}
              className="transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base">{form.name}</CardTitle>
                  <Badge variant={form.type === "popup" ? "secondary" : "outline"}>
                    {form.type}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-slate-600">
                <div className="flex justify-between">
                  <span>Submissions</span>
                  <span className="font-medium text-slate-900">{form.submissions.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Conversion</span>
                  <span className="font-medium text-slate-900">{form.conversionRate}</span>
                </div>
                <Badge variant={form.status === "active" ? "default" : "secondary"} className="mt-2">
                  {form.status}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      </PageSection>
    </EmailModuleShell>
  );
}
