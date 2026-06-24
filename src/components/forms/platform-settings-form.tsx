"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Settings {
  platformFeePercent: number;
  minPayoutAmount: number;
  holdPeriodDays: number;
  duplicateWindowDays: number;
}

export function PlatformSettingsForm() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/v1/admin/settings")
      .then((r) => r.json())
      .then((d) => setSettings(d.data));
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!settings) return;
    setSaving(true);
    const res = await fetch("/api/v1/admin/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });
    const data = await res.json();
    setSettings(data.data);
    setMessage("Settings saved");
    setSaving(false);
  }

  if (!settings) return <p className="text-muted-foreground">Loading settings...</p>;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Platform Settings</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={save} className="grid gap-4 max-w-md">
          <div className="space-y-2">
            <Label htmlFor="fee">Platform Fee (%)</Label>
            <Input
              id="fee"
              type="number"
              value={settings.platformFeePercent}
              onChange={(e) => setSettings({ ...settings, platformFeePercent: Number(e.target.value) })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="minPayout">Min Payout ($)</Label>
            <Input
              id="minPayout"
              type="number"
              value={settings.minPayoutAmount}
              onChange={(e) => setSettings({ ...settings, minPayoutAmount: Number(e.target.value) })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="hold">Hold Period (days)</Label>
            <Input
              id="hold"
              type="number"
              value={settings.holdPeriodDays}
              onChange={(e) => setSettings({ ...settings, holdPeriodDays: Number(e.target.value) })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="dup">Duplicate Window (days)</Label>
            <Input
              id="dup"
              type="number"
              value={settings.duplicateWindowDays}
              onChange={(e) => setSettings({ ...settings, duplicateWindowDays: Number(e.target.value) })}
            />
          </div>
          <Button type="submit" disabled={saving}>
            {saving ? "Saving..." : "Save Settings"}
          </Button>
          {message && <p className="text-sm text-green-600">{message}</p>}
        </form>
      </CardContent>
    </Card>
  );
}
