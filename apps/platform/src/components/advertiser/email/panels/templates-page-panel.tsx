"use client";

import { FileText, Plus } from "lucide-react";
import { EmailTemplatesPanel } from "../email-templates-panel";
import { EmailModuleShell } from "../email-module-shell";

export function TemplatesPagePanel() {
  return (
    <EmailModuleShell
      title="Templates"
      description="Create reusable emails with merge tags like {{first_name}}."
      breadcrumbs={[
        { label: "Autoresponder", href: "/advertiser/email" },
        { label: "Templates" },
      ]}
      stats={[
        { label: "Total Templates", value: "6", icon: FileText, accent: "purple" },
        { label: "Last Updated", value: "Today", icon: FileText, accent: "green" },
      ]}
      searchPlaceholder="Search templates…"
      primaryAction={{ label: "New Template", href: "/advertiser/email/templates/new", icon: Plus }}
    >
      <EmailTemplatesPanel />
    </EmailModuleShell>
  );
}
