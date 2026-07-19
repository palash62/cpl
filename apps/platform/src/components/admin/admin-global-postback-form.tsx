"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { PageHero } from "@/components/admin/page-hero";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { readApiErrorMessage } from "@/lib/errors";

type Settings = {
  useSecurityKey: boolean;
  securityKey: string;
  parallelPostbackUrl: string;
  s2sPostbackUrlExample: string;
  impressionPixelExample: string;
  conversionPixelExample: string;
};

export function AdminGlobalPostbackForm() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [values, setValues] = useState<Settings>({
    useSecurityKey: false,
    securityKey: "",
    parallelPostbackUrl: "",
    s2sPostbackUrlExample: "",
    impressionPixelExample: "",
    conversionPixelExample: "",
  });

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch("/api/v1/admin/global-postback");
        const body = await res.json().catch(() => null);
        if (!res.ok) {
          throw new Error(readApiErrorMessage(body, "Failed to load settings.", res.status));
        }
        setValues((prev) => ({ ...prev, ...body.data }));
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to load");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch("/api/v1/admin/global-postback", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          useSecurityKey: values.useSecurityKey,
          securityKey: values.securityKey,
          parallelPostbackUrl: values.parallelPostbackUrl,
        }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(readApiErrorMessage(body, "Failed to save settings.", res.status));
      }
      setValues((prev) => ({ ...prev, ...body.data }));
      toast.success("Postback settings saved");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <p className="text-sm text-slate-500">Loading postback settings…</p>;
  }

  return (
    <div className="space-y-6">
      <PageHero
        eyebrow="Network"
        title="Global Postback"
        description="Configure postback security and parallel webhook delivery for CPA conversions."
      />

      <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
        <h2 className="text-base font-semibold text-slate-900">Postback URL Info</h2>
        <p className="mt-1 text-sm text-slate-500">
          These settings apply platform-wide to inbound CPA network postbacks and optional parallel
          delivery.
        </p>

        <div className="mt-6 space-y-5">
          <div className="grid gap-2 sm:grid-cols-[240px_minmax(0,1fr)] sm:items-start sm:gap-6">
            <div>
              <Label className="text-sm font-semibold text-slate-800">Use Postback Security Key?</Label>
              <p className="mt-1 text-xs text-slate-500">
                Require networks to include <code className="font-mono">&amp;secure=&#123;key&#125;</code> on
                inbound postbacks.
              </p>
            </div>
            <Select
              value={values.useSecurityKey ? "yes" : "no"}
              onValueChange={(v) =>
                setValues((prev) => ({ ...prev, useSecurityKey: v === "yes" }))
              }
            >
              <SelectTrigger className="h-11 w-full max-w-md bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="no">No</SelectItem>
                <SelectItem value="yes">Yes</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2 sm:grid-cols-[240px_minmax(0,1fr)] sm:items-start sm:gap-6">
            <div>
              <Label className="text-sm font-semibold text-slate-800">Postback Security Key</Label>
              <p className="mt-1 text-xs text-slate-500">
                Include this parameter on S2S postbacks:{" "}
                <code className="font-mono">&amp;secure=&#123;PostbackSecurityKey&#125;</code>
              </p>
            </div>
            <Input
              value={values.securityKey}
              onChange={(e) => setValues((prev) => ({ ...prev, securityKey: e.target.value }))}
              placeholder="lsdjh3328ds"
              className="max-w-xl font-mono text-sm"
            />
          </div>

          <div className="grid gap-2 sm:grid-cols-[240px_minmax(0,1fr)] sm:items-start sm:gap-6">
            <div>
              <Label className="text-sm font-semibold text-slate-800">Parallel Postback</Label>
              <p className="mt-1 text-xs text-slate-500">
                Optional webhook fired on every CPA conversion. Supports macros like {"{offer_id}"},{" "}
                {"{aff_id}"}, {"{payout}"}, {"{click_id}"}.
              </p>
            </div>
            <Input
              value={values.parallelPostbackUrl}
              onChange={(e) =>
                setValues((prev) => ({ ...prev, parallelPostbackUrl: e.target.value }))
              }
              placeholder="https://example.com/?offer_id={offer_id}&affiliate={aff_id}&payout={payout}"
              className="font-mono text-sm"
            />
          </div>

          <div className="grid gap-2 sm:grid-cols-[240px_minmax(0,1fr)] sm:items-start sm:gap-6">
            <div>
              <Label className="text-sm font-semibold text-slate-800">S2S Postback Url</Label>
              <p className="mt-1 text-xs text-slate-500">
                Network-wide inbound URL. Give this same URL to every offer network —{" "}
                {"{click_id}"} identifies the offer and advertiser from the tracked click.
              </p>
            </div>
            <Input readOnly value={values.s2sPostbackUrlExample} className="bg-slate-50 font-mono text-xs" />
          </div>

          <div className="grid gap-2 sm:grid-cols-[240px_minmax(0,1fr)] sm:items-start sm:gap-6">
            <div>
              <Label className="text-sm font-semibold text-slate-800">Impression pixel</Label>
            </div>
            <Input
              readOnly
              value={values.impressionPixelExample}
              className="bg-slate-50 font-mono text-xs"
            />
          </div>

          <div className="grid gap-2 sm:grid-cols-[240px_minmax(0,1fr)] sm:items-start sm:gap-6">
            <div>
              <Label className="text-sm font-semibold text-slate-800">Conversion pixel</Label>
            </div>
            <Input
              readOnly
              value={values.conversionPixelExample}
              className="bg-slate-50 font-mono text-xs"
            />
          </div>
        </div>

        <div className="mt-8 flex justify-end">
          <Button type="button" disabled={saving} onClick={() => void handleSave()}>
            {saving ? "Saving…" : "Save"}
          </Button>
        </div>
      </section>
    </div>
  );
}
