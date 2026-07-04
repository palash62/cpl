"use client";

import { useEffect, useState } from "react";
import { Globe, Percent, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Settings = {
  publisherPayoutPercent: number;
  minPayoutAmount: number;
  tier1PayoutMin: number;
  tier1PayoutMax: number;
  tier2PayoutMin: number;
  tier2PayoutMax: number;
  tier3PayoutMin: number;
  tier3PayoutMax: number;
  globalLinkUrl: string | null;
};

function TierPayoutRow({
  tier,
  min,
  max,
  onMinChange,
  onMaxChange,
}: {
  tier: string;
  min: number;
  max: number;
  onMinChange: (value: number) => void;
  onMaxChange: (value: number) => void;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
      <p className="mb-3 text-sm font-semibold text-slate-900">{tier}</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label className="text-xs text-slate-500">Min payout (USD)</Label>
          <Input
            type="number"
            min={0}
            step={0.01}
            value={min}
            onChange={(e) => onMinChange(Number(e.target.value))}
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-slate-500">Max payout (USD)</Label>
          <Input
            type="number"
            min={0}
            step={0.01}
            value={max}
            onChange={(e) => onMaxChange(Number(e.target.value))}
          />
        </div>
      </div>
    </div>
  );
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
    setMessage("");
    const res = await fetch("/api/v1/admin/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });
    const data = await res.json();
    if (!res.ok) {
      setMessage(data?.error?.message ?? "Failed to save settings");
      setSaving(false);
      return;
    }
    setSettings(data.data);
    setMessage("Settings saved");
    setSaving(false);
  }

  if (!settings) {
    return <p className="text-sm text-slate-500">Loading settings...</p>;
  }

  return (
    <form onSubmit={save} className="mx-auto max-w-3xl space-y-8">
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Percent className="h-4 w-4 text-[var(--theme-primary)]" />
          <h3 className="text-sm font-semibold text-slate-900">Publisher payout</h3>
        </div>
        <p className="text-sm text-slate-500">
          Publisher earnings are calculated as a percentage of the advertiser CPL, then clamped to the
          tier payout range for the lead&apos;s country.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="publisherPayoutPercent">Publisher payout (% of CPL)</Label>
            <Input
              id="publisherPayoutPercent"
              type="number"
              min={1}
              max={100}
              step={0.1}
              value={settings.publisherPayoutPercent}
              onChange={(e) =>
                setSettings({ ...settings, publisherPayoutPercent: Number(e.target.value) })
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="minPayout">Minimum payout request ($)</Label>
            <Input
              id="minPayout"
              type="number"
              min={1}
              step={1}
              value={settings.minPayoutAmount}
              onChange={(e) =>
                setSettings({ ...settings, minPayoutAmount: Number(e.target.value) })
              }
            />
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Wallet className="h-4 w-4 text-[var(--theme-primary)]" />
          <h3 className="text-sm font-semibold text-slate-900">Tier payout ranges (USD per lead)</h3>
        </div>
        <div className="grid gap-3">
          <TierPayoutRow
            tier="Tier 1 — AU, CA, NZ, GB, US"
            min={settings.tier1PayoutMin}
            max={settings.tier1PayoutMax}
            onMinChange={(v) => setSettings({ ...settings, tier1PayoutMin: v })}
            onMaxChange={(v) => setSettings({ ...settings, tier1PayoutMax: v })}
          />
          <TierPayoutRow
            tier="Tier 2 — AR, BR, CL, IN, ID, MY, MX, PH, PL, ZA, TH, TR"
            min={settings.tier2PayoutMin}
            max={settings.tier2PayoutMax}
            onMinChange={(v) => setSettings({ ...settings, tier2PayoutMin: v })}
            onMaxChange={(v) => setSettings({ ...settings, tier2PayoutMax: v })}
          />
          <TierPayoutRow
            tier="Tier 3 — BD, EG, GH, KE, NG, PK, LK, TZ, UG, VN, ZM"
            min={settings.tier3PayoutMin}
            max={settings.tier3PayoutMax}
            onMinChange={(v) => setSettings({ ...settings, tier3PayoutMin: v })}
            onMaxChange={(v) => setSettings({ ...settings, tier3PayoutMax: v })}
          />
        </div>
      </section>

      <section className="space-y-2">
        <div className="flex items-center gap-2">
          <Globe className="h-4 w-4 text-[var(--theme-primary)]" />
          <h3 className="text-sm font-semibold text-slate-900">Global link</h3>
        </div>
        <Label htmlFor="globalLinkUrl">Global campaign link</Label>
        <Input
          id="globalLinkUrl"
          type="url"
          value={settings.globalLinkUrl ?? ""}
          onChange={(e) =>
            setSettings({ ...settings, globalLinkUrl: e.target.value.trim() || null })
          }
          placeholder="https://example.com/offer"
        />
      </section>

      <div className="flex items-center gap-3 border-t border-slate-100 pt-4">
        <Button
          type="submit"
          disabled={saving}
          className="bg-[var(--theme-primary)] hover:opacity-90"
        >
          {saving ? "Saving..." : "Save Settings"}
        </Button>
        {message && (
          <p
            className={`text-sm ${message.includes("Failed") ? "text-red-600" : "text-emerald-600"}`}
          >
            {message}
          </p>
        )}
      </div>
    </form>
  );
}
