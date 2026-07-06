"use client";

import { Settings } from "lucide-react";
import { EmailSettingsPanel } from "../email-settings-panel";
import { EmailModuleShell } from "../email-module-shell";

export function SettingsPagePanel() {
  return (
    <EmailModuleShell
      title="Settings"
      description="General email settings, sender details, and custom domain verification."
      breadcrumbs={[
        { label: "Autoresponder", href: "/advertiser/email" },
        { label: "Settings" },
      ]}
      stats={[
        { label: "Verified Domains", value: "1", icon: Settings, accent: "green" },
        { label: "Sender Name", value: "Set", icon: Settings, accent: "purple" },
      ]}
      showToolbar={false}
    >
      <EmailSettingsPanel />
    </EmailModuleShell>
  );
}
