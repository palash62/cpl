"use client";

import { useCallback, useEffect, useState } from "react";
import type { AutoresponderProvider, AutoresponderTrigger } from "@prisma/client";
import { Loader2, Plus, Save, X } from "lucide-react";
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
  { value: "SYSTEME", label: "Systeme.io", hint: "Contacts and optional tag automation" },
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

type EditableConnection = {
  id: string;
  name: string;
  provider: AutoresponderProvider;
  trigger: AutoresponderTrigger;
  campaignId: string | null;
  config: Record<string, unknown>;
};

const SELECT_TRIGGER_CLASS =
  "h-10 !w-full min-w-0 bg-white *:data-[slot=select-value]:line-clamp-none *:data-[slot=select-value]:whitespace-normal";

/** Fixed comfortable menu width — avoids collapsed --anchor-width when alignItemWithTrigger is false. */
const SELECT_MENU_CLASS = "z-200 !w-[22rem] max-w-[calc(100vw-2rem)]";

const SELECT_MENU_WIDE_CLASS = "z-200 !w-[26rem] max-w-[calc(100vw-2rem)]";

const MASKED_SECRET = "••••••••";

type GetResponseListOption = { campaignId: string; name: string };

type SystemeTagOption = { tagId: string; name: string };

const SYSTEME_NO_TAG = "__none__";

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
  systemeTagId: string;
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
  systemeTagId: "",
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
    systemeTagId: "",
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
    case "SYSTEME":
      return {
        apiKey: form.apiKey.trim(),
        ...(form.systemeTagId.trim() ? { tagId: form.systemeTagId.trim() } : {}),
      };
    default:
      return {};
  }
}

function formatApiError(data: unknown, fallback: string, status?: number): string {
  if (!data || typeof data !== "object") {
    return status ? `${fallback} (HTTP ${status})` : fallback;
  }

  const payload = data as {
    error?: { message?: string; code?: string };
    message?: string;
    issues?: Array<{ message?: string; path?: Array<string | number> }>;
  };

  if (typeof payload.error?.message === "string" && payload.error.message.trim()) {
    return payload.error.message;
  }
  if (typeof payload.message === "string" && payload.message.trim()) {
    return payload.message;
  }

  const issue = payload.issues?.find((item) => item.message?.trim());
  if (issue?.message) {
    const path = issue.path?.length ? `${issue.path.join(".")}: ` : "";
    return `${path}${issue.message}`;
  }

  return status ? `${fallback} (HTTP ${status})` : fallback;
}

export function AutoresponderConnectionForm({
  campaigns,
  onSaved,
  initialConnection,
  onCancelEdit,
}: {
  campaigns: CampaignOption[];
  onSaved: (connection?: EditableConnection) => void;
  initialConnection?: EditableConnection | null;
  onCancelEdit?: () => void;
}) {
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [getResponseLists, setGetResponseLists] = useState<GetResponseListOption[]>([]);
  const [getResponseListsLoading, setGetResponseListsLoading] = useState(false);
  const [getResponseListsError, setGetResponseListsError] = useState<string | null>(null);
  const [systemeTags, setSystemeTags] = useState<SystemeTagOption[]>([]);
  const [systemeTagsLoading, setSystemeTagsLoading] = useState(false);
  const [systemeTagsError, setSystemeTagsError] = useState<string | null>(null);
  const isEditMode = Boolean(initialConnection);

  const loadGetResponseLists = useCallback(
    async (apiKey: string, connectionId?: string) => {
      const trimmedKey = apiKey.trim();
      const canUseKey = trimmedKey.length > 0 && trimmedKey !== MASKED_SECRET;
      const resolvedConnectionId = connectionId ?? (isEditMode ? initialConnection?.id : undefined);

      if (!canUseKey && !resolvedConnectionId) {
        setGetResponseLists([]);
        setGetResponseListsError(null);
        return;
      }

      setGetResponseListsLoading(true);
      setGetResponseListsError(null);

      const res = await fetch("/api/v1/advertiser/autoresponders/getresponse/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(canUseKey ? { apiKey: trimmedKey } : {}),
          ...(resolvedConnectionId ? { connectionId: resolvedConnectionId } : {}),
        }),
      });
      const data = await res.json().catch(() => null);
      setGetResponseListsLoading(false);

      if (!res.ok) {
        setGetResponseLists([]);
        setGetResponseListsError(formatApiError(data, "Unable to load GetResponse lists"));
        return;
      }

      const campaigns = (data?.data as GetResponseListOption[]) ?? [];
      setGetResponseLists(campaigns);

      if (campaigns.length > 0) {
        setForm((prev) => {
          if (prev.provider !== "GETRESPONSE") return prev;
          const current = prev.getResponseListId.trim();
          const isNumeric = /^\d+$/.test(current);
          const byId = campaigns.find((list) => list.campaignId === current);
          if (current && byId && !isNumeric) return prev;
          const byName = campaigns.find((list) => list.name === current);
          if (byName) return { ...prev, getResponseListId: byName.campaignId };
          const nextId = campaigns[0]?.campaignId ?? "";
          return nextId ? { ...prev, getResponseListId: nextId } : prev;
        });
      }
    },
    [initialConnection?.id, isEditMode],
  );

  const refreshGetResponseLists = useCallback(() => {
    if (form.provider !== "GETRESPONSE") return;
    void loadGetResponseLists(form.apiKey, initialConnection?.id);
  }, [form.provider, form.apiKey, initialConnection?.id, loadGetResponseLists]);

  const loadSystemeTags = useCallback(
    async (apiKey: string, connectionId?: string) => {
      const trimmedKey = apiKey.trim();
      const canUseKey = trimmedKey.length > 0 && trimmedKey !== MASKED_SECRET;
      const resolvedConnectionId = connectionId ?? (isEditMode ? initialConnection?.id : undefined);

      if (!canUseKey && !resolvedConnectionId) {
        setSystemeTags([]);
        setSystemeTagsError(null);
        return;
      }

      setSystemeTagsLoading(true);
      setSystemeTagsError(null);

      const res = await fetch("/api/v1/advertiser/autoresponders/systeme/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(canUseKey ? { apiKey: trimmedKey } : {}),
          ...(resolvedConnectionId ? { connectionId: resolvedConnectionId } : {}),
        }),
      });
      const data = await res.json().catch(() => null);
      setSystemeTagsLoading(false);

      if (!res.ok) {
        setSystemeTags([]);
        setSystemeTagsError(formatApiError(data, "Unable to load Systeme.io tags"));
        return;
      }

      const tags = (data?.data as SystemeTagOption[]) ?? [];
      setSystemeTags(tags);

      setForm((prev) => {
        if (prev.provider !== "SYSTEME") return prev;
        const current = prev.systemeTagId.trim();
        if (current) return prev;
        const nextId = tags[0]?.tagId ?? "";
        return nextId ? { ...prev, systemeTagId: nextId } : prev;
      });
    },
    [initialConnection?.id, isEditMode],
  );

  const refreshSystemeTags = useCallback(() => {
    if (form.provider !== "SYSTEME") return;
    void loadSystemeTags(form.apiKey, initialConnection?.id);
  }, [form.provider, form.apiKey, initialConnection?.id, loadSystemeTags]);

  useEffect(() => {
    if (!initialConnection) {
      setForm(emptyForm());
      setGetResponseLists([]);
      setGetResponseListsError(null);
      setSystemeTags([]);
      setSystemeTagsError(null);
      return;
    }
    const cfg = initialConnection.config ?? {};
    setForm({
      name: initialConnection.name ?? "",
      provider: initialConnection.provider,
      trigger: initialConnection.trigger,
      campaignId: initialConnection.campaignId ?? "all",
      url: String(cfg.url ?? ""),
      secret: String(cfg.secret ?? ""),
      apiKey: String(cfg.apiKey ?? ""),
      serverPrefix: String(cfg.serverPrefix ?? ""),
      listId: String(cfg.listId ?? ""),
      accessToken: String(cfg.accessToken ?? ""),
      accountId: String(cfg.accountId ?? ""),
      getResponseListId: String(cfg.campaignId ?? cfg.listId ?? ""),
      systemeTagId: String(cfg.tagId ?? ""),
    });

    if (initialConnection.provider === "GETRESPONSE") {
      void loadGetResponseLists(String(cfg.apiKey ?? ""), initialConnection.id);
    }
    if (initialConnection.provider === "SYSTEME") {
      void loadSystemeTags(String(cfg.apiKey ?? ""), initialConnection.id);
    }
  }, [initialConnection, loadGetResponseLists, loadSystemeTags]);

  useEffect(() => {
    if (form.provider !== "GETRESPONSE") {
      setGetResponseLists([]);
      setGetResponseListsError(null);
      return;
    }

    const trimmedKey = form.apiKey.trim();
    const canUseKey = trimmedKey.length > 0 && trimmedKey !== MASKED_SECRET;
    if (!canUseKey && !isEditMode) {
      setGetResponseLists([]);
      setGetResponseListsError(null);
      return;
    }

    const timer = window.setTimeout(() => {
      void loadGetResponseLists(trimmedKey, initialConnection?.id);
    }, canUseKey ? 500 : 0);

    return () => window.clearTimeout(timer);
  }, [form.provider, form.apiKey, isEditMode, initialConnection?.id, loadGetResponseLists]);

  useEffect(() => {
    if (form.provider !== "SYSTEME") {
      setSystemeTags([]);
      setSystemeTagsError(null);
      return;
    }

    const trimmedKey = form.apiKey.trim();
    const canUseKey = trimmedKey.length > 0 && trimmedKey !== MASKED_SECRET;
    if (!canUseKey && !isEditMode) {
      setSystemeTags([]);
      setSystemeTagsError(null);
      return;
    }

    const timer = window.setTimeout(() => {
      void loadSystemeTags(trimmedKey, initialConnection?.id);
    }, canUseKey ? 500 : 0);

    return () => window.clearTimeout(timer);
  }, [form.provider, form.apiKey, isEditMode, initialConnection?.id, loadSystemeTags]);

  const selectedProvider = PROVIDERS.find((p) => p.value === form.provider);
  const selectedTrigger = TRIGGERS.find((t) => t.value === form.trigger);

  const getResponseListOptions =
    form.getResponseListId &&
    !/^\d+$/.test(form.getResponseListId.trim()) &&
    !getResponseLists.some((list) => list.campaignId === form.getResponseListId)
      ? [
          ...getResponseLists,
          { campaignId: form.getResponseListId, name: `${form.getResponseListId} (saved)` },
        ]
      : getResponseLists;

  const systemeTagOptions =
    form.systemeTagId &&
    !systemeTags.some((tag) => tag.tagId === form.systemeTagId)
      ? [...systemeTags, { tagId: form.systemeTagId, name: `${form.systemeTagId} (saved)` }]
      : systemeTags;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    if (form.provider === "SYSTEME" && form.systemeTagId.trim() && !/^\d+$/.test(form.systemeTagId.trim())) {
      setSaving(false);
      setError("Systeme.io tag ID must be numeric (any length). Leave blank if you are not using a tag.");
      return;
    }

    if (form.provider === "GETRESPONSE" && !form.getResponseListId.trim()) {
      setSaving(false);
      setError("Select a GetResponse list before saving.");
      return;
    }

    const endpoint = isEditMode
      ? `/api/v1/advertiser/autoresponders/${initialConnection!.id}`
      : "/api/v1/advertiser/autoresponders";
    const method = isEditMode ? "PATCH" : "POST";
    const res = await fetch(endpoint, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name.trim(),
        ...(isEditMode ? {} : { provider: form.provider }),
        trigger: form.trigger,
        campaignId: form.campaignId === "all" ? null : form.campaignId,
        config: buildConfig(form),
      }),
    });
    const data = await res.json().catch(() => null);
    setSaving(false);

    if (!res.ok) {
      setError(
        formatApiError(
          data,
          isEditMode ? "Failed to update connection" : "Failed to create connection",
          res.status,
        ),
      );
      return;
    }

    const savedConnection = data?.data as EditableConnection | undefined;

    if (isEditMode) {
      onSaved(savedConnection);
      return;
    }

    setForm(emptyForm());
    onSaved(savedConnection);
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">
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
            disabled={isEditMode}
            onValueChange={(v) => {
              if (!v) return;
              setForm(
                clearProviderCredentials({
                  ...form,
                  provider: v as AutoresponderProvider,
                }),
              );
              setGetResponseLists([]);
              setGetResponseListsError(null);
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
              <div className="flex gap-2">
                <Input
                  type="password"
                  value={form.apiKey}
                  onChange={(e) => {
                    const nextKey = e.target.value;
                    setForm((prev) => ({
                      ...prev,
                      apiKey: nextKey,
                      ...(nextKey !== MASKED_SECRET && nextKey !== prev.apiKey
                        ? { getResponseListId: "" }
                        : {}),
                    }));
                    setGetResponseListsError(null);
                  }}
                  onBlur={refreshGetResponseLists}
                  required
                  className="bg-white"
                />
                <Button
                  type="button"
                  variant="outline"
                  className="shrink-0"
                  disabled={getResponseListsLoading || (!form.apiKey.trim() && !isEditMode)}
                  onClick={refreshGetResponseLists}
                >
                  {getResponseListsLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Load lists"
                  )}
                </Button>
              </div>
              <p className="text-xs text-slate-500">
                Paste your API key, then lists load automatically. Use Load lists if they do not appear.
              </p>
            </div>
            <div className="space-y-2">
              <Label>GetResponse list</Label>
              {getResponseListsLoading ? (
                <div className="flex h-10 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-500">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading lists…
                </div>
              ) : getResponseListOptions.length > 0 ? (
                <Select
                  value={form.getResponseListId || undefined}
                  onValueChange={(v) => {
                    if (!v) return;
                    setForm({ ...form, getResponseListId: v });
                  }}
                >
                  <SelectTrigger className={SELECT_TRIGGER_CLASS}>
                    <SelectValue placeholder="Select a list">
                      {(() => {
                        const selected = getResponseListOptions.find(
                          (list) => list.campaignId === form.getResponseListId,
                        );
                        if (!selected) return "Select a list";
                        return selected.name === selected.campaignId
                          ? selected.name
                          : `${selected.name} (${selected.campaignId})`;
                      })()}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent
                    align="start"
                    alignItemWithTrigger={false}
                    className={`${SELECT_MENU_WIDE_CLASS} max-h-60`}
                  >
                    {getResponseListOptions.map((list) => (
                      <SelectItem key={list.campaignId} value={list.campaignId}>
                        {list.name === list.campaignId
                          ? list.name
                          : `${list.name} (${list.campaignId})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="flex h-10 items-center rounded-md border border-dashed border-slate-200 bg-white px-3 text-sm text-slate-500">
                  {form.apiKey.trim() || isEditMode
                    ? "No lists loaded yet — click Load lists"
                    : "Enter your API key first"}
                </div>
              )}
              {getResponseListsError ? (
                <p className="text-xs text-red-600">{getResponseListsError}</p>
              ) : getResponseListOptions.length > 0 ? (
                <p className="text-xs text-slate-500">
                  Choose the GetResponse list where new leads should be added. The short code in
                  parentheses is the API list token saved with the connection.
                </p>
              ) : (
                <p className="text-xs text-slate-500">
                  Lists are fetched from your GetResponse account using the API key above.
                </p>
              )}
            </div>
          </div>
        )}

        {form.provider === "SYSTEME" && (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>API key</Label>
              <div className="flex gap-2">
                <Input
                  type="password"
                  value={form.apiKey}
                  onChange={(e) => {
                    const nextKey = e.target.value;
                    setForm((prev) => ({
                      ...prev,
                      apiKey: nextKey,
                      ...(nextKey !== MASKED_SECRET && nextKey !== prev.apiKey
                        ? { systemeTagId: "" }
                        : {}),
                    }));
                    setSystemeTagsError(null);
                  }}
                  onBlur={refreshSystemeTags}
                  required
                  className="bg-white"
                />
                <Button
                  type="button"
                  variant="outline"
                  className="shrink-0"
                  disabled={systemeTagsLoading || (!form.apiKey.trim() && !isEditMode)}
                  onClick={refreshSystemeTags}
                >
                  {systemeTagsLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Load tags"
                  )}
                </Button>
              </div>
              <p className="text-xs text-slate-500">
                Paste your API key, then tags load automatically. Use Load tags if they do not appear.
              </p>
            </div>
            <div className="space-y-2">
              <Label>Tag (optional)</Label>
              {systemeTagsLoading ? (
                <div className="flex h-10 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-500">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading tags…
                </div>
              ) : form.apiKey.trim() || isEditMode ? (
                <Select
                  value={form.systemeTagId ? form.systemeTagId : SYSTEME_NO_TAG}
                  onValueChange={(v) => {
                    if (!v) return;
                    setForm({
                      ...form,
                      systemeTagId: v === SYSTEME_NO_TAG ? "" : v,
                    });
                  }}
                >
                  <SelectTrigger className={SELECT_TRIGGER_CLASS}>
                    <SelectValue placeholder="Select a tag">
                      {(() => {
                        if (!form.systemeTagId) return "No tag";
                        const selected = systemeTagOptions.find(
                          (tag) => tag.tagId === form.systemeTagId,
                        );
                        if (!selected) return "Select a tag";
                        return selected.name === selected.tagId
                          ? selected.name
                          : `${selected.name} (${selected.tagId})`;
                      })()}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent
                    align="start"
                    alignItemWithTrigger={false}
                    className={`${SELECT_MENU_WIDE_CLASS} max-h-60`}
                  >
                    <SelectItem value={SYSTEME_NO_TAG}>No tag</SelectItem>
                    {systemeTagOptions.map((tag) => (
                      <SelectItem key={tag.tagId} value={tag.tagId}>
                        {tag.name === tag.tagId ? tag.name : `${tag.name} (${tag.tagId})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="flex h-10 items-center rounded-md border border-dashed border-slate-200 bg-white px-3 text-sm text-slate-500">
                  Enter your API key first
                </div>
              )}
              {systemeTagsError ? (
                <p className="text-xs text-red-600">{systemeTagsError}</p>
              ) : systemeTagOptions.length > 0 ? (
                <p className="text-xs text-slate-500">
                  Choose the Systeme.io tag to apply to new contacts, or select No tag to skip tagging.
                </p>
              ) : (
                <p className="text-xs text-slate-500">
                  Tags are fetched from your Systeme.io account using the API key above.
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-end">
        {isEditMode && onCancelEdit ? (
          <Button type="button" variant="outline" className="mr-2" onClick={onCancelEdit}>
            <X className="mr-2 h-4 w-4" />
            Cancel
          </Button>
        ) : null}
        <Button type="submit" disabled={saving} className="min-w-[160px]">
          {isEditMode ? <Save className="mr-2 h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />}
          {saving ? (isEditMode ? "Saving…" : "Adding…") : (isEditMode ? "Save changes" : "Add connection")}
        </Button>
      </div>
    </form>
  );
}
