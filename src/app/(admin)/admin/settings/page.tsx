import { PlatformSettingsForm } from "@/components/forms/platform-settings-form";

export default function AdminSettingsPage() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Platform Settings</h2>
      <PlatformSettingsForm />
    </div>
  );
}
