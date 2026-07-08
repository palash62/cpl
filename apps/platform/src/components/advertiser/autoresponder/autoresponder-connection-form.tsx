"use client";

import { useState } from "react";
import type { AutoresponderProvider, AutoresponderTrigger } from "@prisma/client";
import { Plus } from "lucide-react";
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

const PROVIDERS: { value: AutoresponderProvider; label: string; hint: string }[] = [
  { value: "WEBHOOK", label: "Custom Webhook", hint: "Zapier, Make, n8n" },
  { value: "MAILCHIMP", label: "Mailchimp", hint: "Audience list" },
  { value: "AWEBER", label: "AWeber", hint: "Subscriber list" },
  { value: "GETRESPONSE", label: "GetResponse", hint: "Contact list" },
];

const TRIGGERS: { value: AutoresponderTrigger; label: string; description: string }[] = [
  {
    value: "LEAD_CAPTURED",
    label: "When lead is submitted",
    description: "Fires as soon as a lead is captured on your campaign or opt-in page",
  },
  {
    value: "LEAD_APPROVED",
    label: "When lead is approved",
    description: "Fires only after the lead passes review and is paid",
  },
];

type CampaignOption = { id: string; name: string };

const SELECT_TRIGGER_CLASS =
  "h-10 !w-full min-w-0 bg-white *:data-[slot=select-value]:line-clamp-none *:data-[slot=select-value]:whitespace-normal";

/** Fixed comfortable menu width — avoids collapsed --anchor-width when alignItemWithTrigger is false. */
const SELECT_MENU_CLASS = "z-200 !w-[22rem] max-w-[calc(100vw-2rem)]";

const SELECT_MENU_WIDE_CLASS = "z-200 !w-[26rem] max-w-[calc(100vw-2rem)]";

type FormState = {
  name: string;
  provider: AutoresponderProvider;
  trigger: AutoresponderTrigger;
  campaignId: string;
  url: string;
  secret: string;
  apiKey: string;
  serverPrefix: string;
  listId: string;
  accessToken: string;
  accountId: string;
  getResponseListId: string;
};

const emptyForm = (): FormState => ({
  name: "",
  provider: "WEBHOOK",
  trigger: "LEAD_CAPTURED",
  campaignId: "all",
  url: "",
  secret: "",
  apiKey: "",
  serverPrefix: "",
  listId: "",
  accessToken: "",
  accountId: "",
  getResponseListId: "",
});

function clearProviderCredentials(form: FormState): FormState {
  return {
    ...form,
    url: "",
    secret: "",
    apiKey: "",
    serverPrefix: "",
    listId: "",
    accessToken: "",
    accountId: "",
    getResponseListId: "",
  };
}

function buildConfig(form: FormState): Record<string, unknown> {
  switch (form.provider) {
    case "WEBHOOK":
      return {
        url: form.url.trim(),
        ...(form.secret.trim() && { secret: form.secret.trim() }),
      };
    case "MAILCHIMP":
      return {
        apiKey: form.apiKey.trim(),
        serverPrefix: form.serverPrefix.trim(),
        listId: form.listId.trim(),
      };
    case "AWEBER":
      return {
        accessToken: form.accessToken.trim(),
        accountId: form.accountId.trim(),
        listId: form.listId.trim(),
      };
    case "GETRESPONSE":
      return {
        apiKey: form.apiKey.trim(),
        campaignId: form.getResponseListId.trim(),
      };
    default:
      return {};
  }
}

function formatApiError(data: unknown, fallback: string): string {
  if (!data || typeof data !== "object") return fallback;
  const error = (data as { error?: { message?: string } }).error;
  if (typeof error?.message === "string" && error.message.trim()) return error.message;
  return fallback;
}

export function AutoresponderConnectionForm({
  campaigns,
  onCreated,
}: {
  campaigns: CampaignOption[];
  onCreated: () => void;
}) {
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedProvider = PROVIDERS.find((p) => p.value === form.provider);
  const selectedTrigger = TRIGGERS.find((t) => t.value === form.trigger);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    if (form.provider === "GETRESPONSE" && /^\d+$/.test(form.getResponseListId.trim())) {
      setSaving(false);
      setError(
        "GetResponse list ID must be the alphanumeric campaign token from GetResponse, not the numeric list number.",
      );
      return;
    }

    const res = await fetch("/api/v1/advertiser/autoresponders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name.trim(),
        provider: form.provider,
        trigger: form.trigger,
        campaignId: form.campaignId === "all" ? null : form.campaignId,
        config: buildConfig(form),
      }),
    });
    const data = await res.json().catch(() => null);
    setSaving(false);

    if (!res.ok) {
      setError(formatApiError(data, "Failed to create connection"));
      return;
    }

    setForm(emptyForm());
    onCreated();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="ar-name">Connection name</Label>
          <Input
            id="ar-name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Main email list"
            required
            className="bg-white"
          />
        </div>
        <div className="relative z-20 space-y-2">
          <Label>Campaign scope</Label>
          <Select
            value={form.campaignId}
            onValueChange={(v) => setForm({ ...form, campaignId: v ?? "all" })}
          >
            <SelectTrigger className={SELECT_TRIGGER_CLASS}>
              <SelectValue placeholder="All campaigns">
                {form.campaignId === "all"
                  ? "All campaigns"
                  : campaigns.find((c) => c.id === form.campaignId)?.name ?? "Select campaign"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent
              align="start"
              alignItemWithTrigger={false}
              className={`${SELECT_MENU_WIDE_CLASS} max-h-60`}
            >
              <SelectItem value="all">All campaigns</SelectItem>
              {campaigns.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-slate-500">Limit to one campaign or apply to all</p>
        </div>
        <div className="space-y-2">
          <Label>Provider</Label>
          <Select
            value={form.provider}
            onValueChange={(v) => {
              if (!v) return;
              setForm(
                clearProviderCredentials({
                  ...form,
                  provider: v as AutoresponderProvider,
                }),
              );
            }}
          >
            <SelectTrigger className={SELECT_TRIGGER_CLASS}>
              <SelectValue placeholder="Select provider">
                {selectedProvider?.label ?? "Select provider"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent align="start" alignItemWithTrigger={false} className={SELECT_MENU_CLASS}>
              {PROVIDERS.map((p) => (
                <SelectItem key={p.value} value={p.value}>
                  {p.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedProvider && (
            <p className="text-xs text-slate-500">{selectedProvider.hint}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label>When to send</Label>
          <Select
            value={form.trigger}
            onValueChange={(v) => {
              if (!v) return;
              setForm({ ...form, trigger: v as AutoresponderTrigger });
            }}
          >
            <SelectTrigger className={SELECT_TRIGGER_CLASS}>
              <SelectValue placeholder="Select trigger">
                {selectedTrigger?.label ?? "Select trigger"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent align="start" alignItemWithTrigger={false} className={SELECT_MENU_WIDE_CLASS}>
              {TRIGGERS.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedTrigger && (
            <p className="text-xs text-slate-500">{selectedTrigger.description}</p>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-5">
        <p className="mb-4 text-sm font-medium text-slate-700">
          {selectedProvider?.label} credentials
        </p>

        {form.provider === "WEBHOOK" && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="ar-url">Webhook URL</Label>
              <Input
                id="ar-url"
                type="url"
                value={form.url}
                onChange={(e) => setForm({ ...form, url: e.target.value })}
                placeholder="https://hooks.zapier.com/hooks/catch/..."
                required
                className="bg-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ar-secret">Signing secret (optional)</Label>
              <Input
                id="ar-secret"
                type="password"
                value={form.secret}
                onChange={(e) => setForm({ ...form, secret: e.target.value })}
                placeholder="Adds X-CPL-Signature header to requests"
                className="bg-white"
              />
            </div>
          </div>
        )}

        {form.provider === "MAILCHIMP" && (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label>API key</Label>
              <Input
                type="password"
                value={form.apiKey}
                onChange={(e) => setForm({ ...form, apiKey: e.target.value })}
                required
                className="bg-white"
              />
            </div>
            <div className="space-y-2">
              <Label>Server prefix</Label>
              <Input
                value={form.serverPrefix}
                onChange={(e) => setForm({ ...form, serverPrefix: e.target.value })}
                placeholder="us21"
                required
                className="bg-white"
              />
              <p className="text-xs text-slate-500">From your Mailchimp API key (e.g. us21)</p>
            </div>
            <div className="space-y-2">
              <Label>Audience list ID</Label>
              <Input
                value={form.listId}
                onChange={(e) => setForm({ ...form, listId: e.target.value })}
                required
                className="bg-white"
              />
            </div>
          </div>
        )}

        {form.provider === "AWEBER" && (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label>Access token</Label>
              <Input
                type="password"
                value={form.accessToken}
                onChange={(e) => setForm({ ...form, accessToken: e.target.value })}
                required
                className="bg-white"
              />
            </div>
            <div className="space-y-2">
              <Label>Account ID</Label>
              <Input
                value={form.accountId}
                onChange={(e) => setForm({ ...form, accountId: e.target.value })}
                required
                className="bg-white"
              />
            </div>
            <div className="space-y-2">
              <Label>List ID</Label>
              <Input
                value={form.listId}
                onChange={(e) => setForm({ ...form, listId: e.target.value })}
                required
                className="bg-white"
              />
            </div>
          </div>
        )}

        {form.provider === "GETRESPONSE" && (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>API key</Label>
              <Input
                type="password"
                value={form.apiKey}
                onChange={(e) => setForm({ ...form, apiKey: e.target.value })}
                required
                className="bg-white"
              />
            </div>
            <div className="space-y-2">
              <Label>GetResponse list ID</Label>
              <Input
                value={form.getResponseListId}
                onChange={(e) => setForm({ ...form, getResponseListId: e.target.value })}
                placeholder="e.g. p86zQ"
                required
                className="bg-white"
              />
              <p className="text-xs text-slate-500">
                Alphanumeric campaign token from GetResponse Lists (not the numeric ID). Find it via
                API GET /campaigns or under the list name.
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={saving} className="min-w-[160px]">
          <Plus className="mr-2 h-4 w-4" />
          {saving ? "Adding…" : "Add connection"}
        </Button>
      </div>
    </form>
  );
}
