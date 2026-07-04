"use client";

import { useEffect, useState } from "react";
import { Cloud, Save, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";

type SesSettings = {
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  secretConfigured: boolean;
  fromDomain: string;
  fromEmail: string;
  configurationSet: string;
  appUrl: string;
  enabled: boolean;
  source: "database" | "environment" | "none";
};

const SOURCE_LABELS: Record<SesSettings["source"], string> = {
  database: "Using settings saved in admin",
  environment: "Using .env variables",
  none: "Not configured — marketing emails will not send",
};

export function SesSettingsForm() {
  const [settings, setSettings] = useState<SesSettings | null>(null);
  const [testTo, setTestTo] = useState("");
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/v1/admin/email/ses")
      .then((r) => r.json())
      .then((d) => setSettings(d.data));
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!settings) return;
    setSaving(true);
    setMessage("");
    setError("");

    const res = await fetch("/api/v1/admin/email/ses", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        region: settings.region,
        accessKeyId: settings.accessKeyId,
        secretAccessKey: settings.secretAccessKey || undefined,
        fromDomain: settings.fromDomain,
        fromEmail: settings.fromEmail,
        configurationSet: settings.configurationSet,
        appUrl: settings.appUrl,
      }),
    });

    const data = await res.json();
    setSaving(false);

    if (!res.ok) {
      setError(data?.error?.message ?? "Failed to save SES settings");
      return;
    }

    setSettings(data.data);
    setMessage("SES settings saved");
  }

  async function sendTest() {
    setTesting(true);
    setError("");
    const res = await fetch("/api/v1/admin/email/ses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to: testTo || undefined }),
    });
    const data = await res.json();
    setTesting(false);
    if (!res.ok) {
      setError(data?.error?.message ?? "Test failed");
      return;
    }
    setMessage(`Test sent (message ID: ${data.data?.messageId})`);
  }

  if (!settings) {
    return <p className="text-sm text-slate-500">Loading SES settings…</p>;
  }

  return (
    <form onSubmit={save} className="space-y-6">
      <Alert>
        <Cloud className="h-4 w-4" />
        <AlertDescription>
          {SOURCE_LABELS[settings.source]}
          {settings.enabled ? " — SES is ready for advertiser marketing emails." : ""}
        </AlertDescription>
      </Alert>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="ses-region">AWS Region</Label>
          <Input
            id="ses-region"
            value={settings.region}
            onChange={(e) => setSettings({ ...settings, region: e.target.value })}
            placeholder="us-east-1"
          />
        </div>
        <div>
          <Label htmlFor="ses-from-domain">From domain</Label>
          <Input
            id="ses-from-domain"
            value={settings.fromDomain}
            onChange={(e) => setSettings({ ...settings, fromDomain: e.target.value })}
            placeholder="mail.yourplatform.com"
          />
        </div>
        <div>
          <Label htmlFor="ses-from-email">From email</Label>
          <Input
            id="ses-from-email"
            value={settings.fromEmail}
            onChange={(e) => setSettings({ ...settings, fromEmail: e.target.value })}
            placeholder="noreply@mail.yourplatform.com"
          />
        </div>
        <div>
          <Label htmlFor="ses-config-set">Configuration set</Label>
          <Input
            id="ses-config-set"
            value={settings.configurationSet}
            onChange={(e) => setSettings({ ...settings, configurationSet: e.target.value })}
            placeholder="marketing-config-set"
          />
        </div>
        <div>
          <Label htmlFor="ses-access-key">Access key ID</Label>
          <Input
            id="ses-access-key"
            value={settings.accessKeyId}
            onChange={(e) => setSettings({ ...settings, accessKeyId: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="ses-secret">
            Secret access key {settings.secretConfigured ? "(configured)" : ""}
          </Label>
          <Input
            id="ses-secret"
            type="password"
            value={settings.secretAccessKey}
            onChange={(e) => setSettings({ ...settings, secretAccessKey: e.target.value })}
            placeholder={settings.secretConfigured ? "Leave blank to keep current" : ""}
          />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="ses-app-url">App URL (for tracking & unsubscribe links)</Label>
          <Input
            id="ses-app-url"
            value={settings.appUrl}
            onChange={(e) => setSettings({ ...settings, appUrl: e.target.value })}
          />
        </div>
      </div>

      <p className="text-xs text-slate-500">
        SNS webhook URL: <code className="rounded bg-slate-100 px-1">{settings.appUrl}/api/v1/webhooks/ses</code>
      </p>

      {message && <p className="text-sm text-green-600">{message}</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex flex-wrap items-end gap-3">
        <Button type="submit" disabled={saving}>
          <Save className="mr-2 h-4 w-4" />
          {saving ? "Saving…" : "Save SES settings"}
        </Button>
        <Input
          className="max-w-xs"
          placeholder="Test recipient email"
          value={testTo}
          onChange={(e) => setTestTo(e.target.value)}
        />
        <Button type="button" variant="outline" disabled={testing} onClick={sendTest}>
          <Send className="mr-2 h-4 w-4" />
          Send test
        </Button>
      </div>
    </form>
  );
}
