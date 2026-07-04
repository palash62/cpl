"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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

type Campaign = { id: string; name: string };
type Template = { id: string; name: string };

const DELAY_PRESETS = [
  { label: "Immediate", minutes: 0 },
  { label: "1 day", minutes: 1440 },
  { label: "3 days", minutes: 4320 },
  { label: "7 days", minutes: 10080 },
];

type Step = { templateId: string; delayMinutes: number; order: number };

type Props = { automationId?: string; campaigns: Campaign[] };

export function EmailAutomationWizard({ automationId, campaigns }: Props) {
  const router = useRouter();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    trigger: "LEAD_CAPTURED" as "LEAD_CAPTURED" | "LEAD_APPROVED",
    campaignId: "",
    fromName: "",
    replyTo: "",
  });
  const [steps, setSteps] = useState<Step[]>([
    { templateId: "", delayMinutes: 0, order: 0 },
  ]);

  useEffect(() => {
    fetch("/api/v1/advertiser/email/templates")
      .then((r) => r.json())
      .then((d) => setTemplates(d.data ?? []));
    fetch("/api/v1/advertiser/email/settings")
      .then((r) => r.json())
      .then((d) => {
        if (d.data) {
          setForm((f) => ({
            ...f,
            fromName: d.data.fromName || f.fromName,
            replyTo: d.data.replyTo || f.replyTo,
          }));
        }
      });
  }, []);

  useEffect(() => {
    if (!automationId) return;
    fetch(`/api/v1/advertiser/email/automations/${automationId}`)
      .then((r) => r.json())
      .then((d) => {
        const a = d.data;
        setForm({
          name: a.name,
          trigger: a.trigger,
          campaignId: a.campaignId ?? "",
          fromName: a.fromName,
          replyTo: a.replyTo ?? "",
        });
        setSteps(
          a.steps.map((s: Step & { templateId: string }) => ({
            templateId: s.templateId,
            delayMinutes: s.delayMinutes,
            order: s.order,
          })),
        );
      });
  }, [automationId]);

  function addStep() {
    setSteps((s) => [...s, { templateId: "", delayMinutes: 1440, order: s.length }]);
  }

  function removeStep(index: number) {
    setSteps((s) => s.filter((_, i) => i !== index).map((st, i) => ({ ...st, order: i })));
  }

  async function save(activate = false) {
    setSaving(true);
    setError("");
    const payload = {
      ...form,
      campaignId: form.campaignId || null,
      replyTo: form.replyTo || null,
      steps: steps.map((s, i) => ({ ...s, order: i })),
    };
    const url = automationId
      ? `/api/v1/advertiser/email/automations/${automationId}`
      : "/api/v1/advertiser/email/automations";
    const res = await fetch(url, {
      method: automationId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (!res.ok) {
      setSaving(false);
      setError(json?.error?.message ?? "Save failed");
      return;
    }
    const id = automationId ?? json.data.id;
    if (activate) {
      await fetch(`/api/v1/advertiser/email/automations/${id}/activate`, { method: "POST" });
    }
    setSaving(false);
    router.push("/advertiser/email/automations");
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 rounded-xl border border-slate-200 bg-white p-6">
      <div className="flex gap-2 text-sm">
        {[1, 2, 3].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setStep(n)}
            className={`rounded-full px-3 py-1 ${step === n ? "bg-[var(--theme-primary)] text-white" : "bg-slate-100 text-slate-600"}`}
          >
            Step {n}
          </button>
        ))}
      </div>

      {step === 1 && (
        <div className="space-y-4">
          <div>
            <Label>Automation name</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <Label>Trigger</Label>
            <Select value={form.trigger} onValueChange={(v) => setForm({ ...form, trigger: v as "LEAD_CAPTURED" | "LEAD_APPROVED" })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="LEAD_CAPTURED">When lead is submitted</SelectItem>
                <SelectItem value="LEAD_APPROVED">When lead is approved</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Campaign scope</Label>
            <Select value={form.campaignId || "all"} onValueChange={(v) => setForm({ ...form, campaignId: !v || v === "all" ? "" : v })}>
              <SelectTrigger><SelectValue placeholder="All campaigns" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All campaigns</SelectItem>
                {campaigns.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>From name</Label>
            <Input value={form.fromName} onChange={(e) => setForm({ ...form, fromName: e.target.value })} />
          </div>
          <div>
            <Label>Reply-to email</Label>
            <Input type="email" value={form.replyTo} onChange={(e) => setForm({ ...form, replyTo: e.target.value })} />
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          {steps.map((s, i) => (
            <div key={i} className="rounded-lg border border-slate-200 p-4">
              <p className="mb-2 text-sm font-medium text-slate-700">Email {i + 1}</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label>Template</Label>
                  <Select value={s.templateId || undefined} onValueChange={(v) => {
                    if (!v) return;
                    const next = [...steps];
                    next[i] = { ...next[i], templateId: v };
                    setSteps(next);
                  }}>
                    <SelectTrigger><SelectValue placeholder="Select template" /></SelectTrigger>
                    <SelectContent>
                      {templates.map((t) => (
                        <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Delay after trigger</Label>
                  <Select
                    value={String(s.delayMinutes)}
                    onValueChange={(v) => {
                      const next = [...steps];
                      next[i] = { ...next[i], delayMinutes: Number(v) };
                      setSteps(next);
                    }}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {DELAY_PRESETS.map((p) => (
                        <SelectItem key={p.minutes} value={String(p.minutes)}>{p.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {steps.length > 1 && (
                <Button variant="ghost" size="sm" className="mt-2 text-red-600" onClick={() => removeStep(i)}>
                  Remove step
                </Button>
              )}
            </div>
          ))}
          <Button variant="outline" onClick={addStep}>Add follow-up email</Button>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-2 text-sm text-slate-600">
          <p><strong>Name:</strong> {form.name}</p>
          <p><strong>Trigger:</strong> {form.trigger === "LEAD_CAPTURED" ? "On submit" : "On approval"}</p>
          <p><strong>Steps:</strong> {steps.length}</p>
          <p className="text-slate-500">Activating will start sending to new matching leads.</p>
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex justify-between pt-2">
        <Button variant="outline" disabled={step === 1} onClick={() => setStep(step - 1)}>Back</Button>
        <div className="flex gap-2">
          {step < 3 ? (
            <Button onClick={() => setStep(step + 1)}>Next</Button>
          ) : (
            <>
              <Button variant="outline" disabled={saving} onClick={() => save(false)}>Save draft</Button>
              <Button disabled={saving} onClick={() => save(true)}>Save & activate</Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
