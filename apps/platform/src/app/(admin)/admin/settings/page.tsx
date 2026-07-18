import { Suspense } from "react";
import { AdminSettingsShell } from "@/components/admin/admin-settings-shell";
import { PageHero } from "@/components/admin/page-hero";

export default function AdminSettingsPage() {
  return (
    <div className="space-y-7">
      <PageHero
        eyebrow="Configuration"
        title="Platform Settings"
        description="Configure global platform options and defaults"
      />
      <Suspense
        fallback={<p className="text-sm text-slate-500">Loading settings...</p>}
      >
        <AdminSettingsShell />
      </Suspense>
    </div>
  );
}
