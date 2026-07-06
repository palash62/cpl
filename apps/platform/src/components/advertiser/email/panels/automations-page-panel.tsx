"use client";

import { Zap } from "lucide-react";
import { EmailAutomationsPanel } from "../email-automations-panel";
import { EmailModuleShell } from "../email-module-shell";

export function AutomationsPagePanel() {
  return (
    <EmailModuleShell
      title="Automations"
      description="Automated drip sequences triggered when leads are captured or approved."
      breadcrumbs={[
        { label: "Autoresponder", href: "/advertiser/email" },
        { label: "Automations" },
      ]}
      stats={[
        { label: "Active", value: "2", icon: Zap, accent: "green" },
        { label: "Total Sends", value: "486", icon: Zap, variant: "leads" },
      ]}
      searchPlaceholder="Search automations…"
      primaryAction={{ label: "Create Automation", href: "/advertiser/email/automations/new", icon: Zap }}
    >
      <EmailAutomationsPanel />
    </EmailModuleShell>
  );
}
