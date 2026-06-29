"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import {
  CalendarClock,
  Crosshair,
  Settings2,
  Target,
  Wallet,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DEFAULT_LEAD_FIELDS,
  DEVICE_TYPES,
  OPERATING_SYSTEMS,
  URL_TOKENS,
  VERTICALS,
} from "@/lib/campaign-form";
import { CampaignCountryField } from "@/components/advertiser/campaign-country-field";
import { CampaignSearchMultiSelect } from "@/components/advertiser/campaign-search-multi-select";
import {
  BidRecommendationPanel,
  CampaignSummaryPanel,
  TierPayoutInfoPanel,
} from "@/components/advertiser/create-campaign-sidebar";
import type { PayoutTiersDisplay } from "@/lib/platform-settings";
import { CampaignTrackingPixelPanel } from "@/components/advertiser/campaign-tracking-pixel-panel";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type StartMode = "now" | "scheduled";
type EndMode = "forever" | "scheduled";
type TrafficMode = "allow" | "block";
type CampaignStatusChoice = "ACTIVE" | "PENDING" | "PAUSED" | "DRAFT";

type AdvertiserOption = {
  id: string;
  name: string;
  email: string;
  wallet?: { balance: unknown } | null;
};

type CreateCampaignFormProps = {
  mode?: "advertiser" | "admin";
  payoutTiers: PayoutTiersDisplay;
};

const SECTION_ACCENTS = [
  "var(--theme-gradient-approved)",
  "var(--theme-gradient-leads)",
  "var(--theme-gradient-revenue)",
  "var(--theme-gradient-approved)",
] as const;

function todayInputValue() {
  return format(new Date(), "yyyy-MM-dd");
}

function todayLabel() {
  return format(new Date(), "MMMM d, yyyy");
}

function SectionCard({
  step,
  title,
  icon: Icon,
  accentIndex,
  children,
}: {
  step: number;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  accentIndex: number;
  children: React.ReactNode;
}) {
  return (
    <div className="premium-card overflow-hidden">
      <div className="h-1" style={{ background: SECTION_ACCENTS[accentIndex % SECTION_ACCENTS.length] }} />
      <div className="flex items-center gap-3 border-b border-slate-100 bg-[var(--theme-primary-soft)] px-5 py-4">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-sm font-bold text-[var(--theme-primary)] shadow-sm">
          {step}
        </span>
        <Icon className="h-4 w-4 text-[var(--theme-primary)]" />
        <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
      </div>
      <div className="space-y-4 p-5">{children}</div>
    </div>
  );
}

function FieldHint({ children }: { children: React.ReactNode }) {
  return <p className="text-xs text-slate-500">{children}</p>;
}

function CurrencyInput({
  id,
  value,
  onChange,
  placeholder,
  min,
  max,
  step,
  required,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  min?: number;
  max?: number;
  step?: number;
  required?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex h-10 w-full items-stretch overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm",
        "transition-colors focus-within:border-[var(--theme-primary)] focus-within:ring-2 focus-within:ring-[var(--theme-primary)]/15",
      )}
    >
      <span className="flex w-10 shrink-0 items-center justify-center border-r border-slate-200 bg-slate-50 text-sm font-semibold text-slate-600">
        $
      </span>
      <input
        id={id}
        type="number"
        min={min}
        max={max}
        step={step}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="min-w-0 flex-1 border-0 bg-white px-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      />
      <span className="flex w-12 shrink-0 items-center justify-center border-l border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
        USD
      </span>
    </div>
  );
}

function RadioOption({
  name,
  value,
  checked,
  onChange,
  label,
}: {
  name: string;
  value: string;
  checked: boolean;
  onChange: (value: string) => void;
  label: string;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={() => onChange(value)}
        className="h-4 w-4 accent-[var(--theme-primary)]"
      />
      {label}
    </label>
  );
}

export function CreateCampaignForm({ mode = "advertiser", payoutTiers }: CreateCampaignFormProps) {
  const isAdmin = mode === "admin";
  const backHref = isAdmin ? "/admin/campaigns" : "/advertiser/campaigns";
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [walletBalance, setWalletBalance] = useState(0);
  const [error, setError] = useState("");

  const [advertisers, setAdvertisers] = useState<AdvertiserOption[]>([]);
  const [loadingAdvertisers, setLoadingAdvertisers] = useState(isAdmin);
  const [advertiserId, setAdvertiserId] = useState("");
  const [campaignStatus, setCampaignStatus] = useState<CampaignStatusChoice>("ACTIVE");
  const [autoApprove, setAutoApprove] = useState(false);

  const [name, setName] = useState("");
  const [destinationUrl, setDestinationUrl] = useState("");
  const [startMode, setStartMode] = useState<StartMode>("now");
  const [startDate, setStartDate] = useState(todayInputValue());
  const [endMode, setEndMode] = useState<EndMode>("forever");
  const [endDate, setEndDate] = useState(todayInputValue());
  const [trafficMode, setTrafficMode] = useState<TrafficMode>("allow");
  const [vertical, setVertical] = useState("");
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  const [blacklistedCountries, setBlacklistedCountries] = useState<string[]>([]);
  const [devices, setDevices] = useState<string[]>([]);
  const [operatingSystems, setOperatingSystems] = useState<string[]>([]);
  const [blacklistedDevices, setBlacklistedDevices] = useState<string[]>([]);
  const [blacklistedOperatingSystems, setBlacklistedOperatingSystems] = useState<string[]>([]);
  const [cpl, setCpl] = useState("");
  const [totalBudget, setTotalBudget] = useState("");
  const [dailyBudget, setDailyBudget] = useState("");
  const [createdPixelToken, setCreatedPixelToken] = useState<string | null>(null);

  useEffect(() => {
    if (isAdmin) {
      fetch("/api/v1/admin/users?role=ADVERTISER&limit=500")
        .then((res) => res.json())
        .then((data) => setAdvertisers(data.data ?? []))
        .catch(() => setAdvertisers([]))
        .finally(() => setLoadingAdvertisers(false));
      return;
    }

    fetch("/api/v1/wallet")
      .then((res) => res.json())
      .then((data) => setWalletBalance(Number(data.availableBalance ?? data.balance ?? 0)))
      .catch(() => setWalletBalance(0));
  }, [isAdmin]);

  const selectedAdvertiser = advertisers.find((item) => item.id === advertiserId);
  const effectiveWalletBalance = isAdmin
    ? Number(selectedAdvertiser?.wallet?.balance ?? 0)
    : walletBalance;

  const cplValue = parseFloat(cpl) || 0;
  const totalBudgetValue = totalBudget.trim() ? parseFloat(totalBudget) : null;
  const dailyBudgetValue = dailyBudget.trim() ? parseFloat(dailyBudget) : null;
  const selectedVertical = VERTICALS.find((item) => item.label === vertical);

  const minCpl = 0.1;
  const cplInvalid = cplValue > 0 && (cplValue < minCpl || cplValue > 100);
  const insufficientBalance =
    !isAdmin &&
    cplValue > 0 &&
    (effectiveWalletBalance < cplValue ||
      (totalBudgetValue !== null && effectiveWalletBalance < totalBudgetValue));

  function appendToken(token: string) {
    setDestinationUrl((current) => `${current}${token}`);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("Campaign name is required.");
      return;
    }
    if (!destinationUrl.trim()) {
      setError("Destination URL is required.");
      return;
    }
    if (!vertical || !selectedVertical) {
      setError("Please select a vertical.");
      return;
    }
    if (isAdmin && !advertiserId) {
      setError("Please select an advertiser.");
      return;
    }
    if (!cplValue || cplValue < minCpl || cplValue > 100) {
      setError(`CPL bid is required (min $${minCpl.toFixed(2)}).`);
      return;
    }
    if (insufficientBalance) {
      setError("You do not have enough balance to create a campaign. Please add funds to your account.");
      return;
    }

    setLoading(true);

    const targeting = {
      destinationUrl: destinationUrl.trim(),
      scheduling: {
        startMode,
        startDate: startMode === "scheduled" ? startDate : null,
        endMode,
        endDate: endMode === "scheduled" ? endDate : null,
      },
      trafficMode,
      vertical,
      countries: trafficMode === "allow" ? selectedCountries : [],
      blacklistedCountries: trafficMode === "block" ? blacklistedCountries : [],
      devices: trafficMode === "allow" ? devices : [],
      operatingSystems: trafficMode === "allow" ? operatingSystems : [],
      blacklistedDevices: trafficMode === "block" ? blacklistedDevices : [],
      blacklistedOperatingSystems: trafficMode === "block" ? blacklistedOperatingSystems : [],
    };

    const payload = isAdmin
      ? {
          advertiserId,
          name: name.trim(),
          destinationUrl: destinationUrl.trim(),
          vertical,
          category: selectedVertical.category,
          cpl: cplValue,
          budget: totalBudgetValue ?? undefined,
          dailyCap: dailyBudgetValue ? Math.round(dailyBudgetValue) : undefined,
          status: campaignStatus,
          autoApprove,
          description: `Destination: ${destinationUrl.trim()}`,
          targeting,
          fields: DEFAULT_LEAD_FIELDS,
        }
      : {
          name: name.trim(),
          description: `Destination: ${destinationUrl.trim()}`,
          category: selectedVertical.category,
          cpl: cplValue,
          budget: totalBudgetValue ?? undefined,
          dailyCap: dailyBudgetValue ? Math.round(dailyBudgetValue) : undefined,
          autoApprove: autoApprove,
          targeting,
          fields: DEFAULT_LEAD_FIELDS,
        };

    const res = await fetch("/api/v1/campaigns", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setLoading(false);

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setError(body?.error?.message ?? "Failed to create campaign. Please try again.");
      return;
    }

    const body = await res.json();
    const pixelToken = body?.data?.pixelToken as string | undefined;

    if (pixelToken) {
      setCreatedPixelToken(pixelToken);
      document.getElementById("campaign-tracking-pixel")?.scrollIntoView({ behavior: "smooth" });
      return;
    }

    router.push(backHref);
    router.refresh();
  }

  const canSubmit =
    name.trim() &&
    destinationUrl.trim() &&
    vertical &&
    cplValue >= minCpl &&
    !insufficientBalance &&
    !cplInvalid &&
    (!isAdmin || (advertiserId && !loadingAdvertisers));

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div
        className="relative overflow-hidden rounded-[18px] px-6 py-5 shadow-md"
        style={{
          backgroundImage: "linear-gradient(to right, var(--theme-hero-from), var(--theme-hero-to))",
        }}
      >
        <div className="pointer-events-none absolute inset-0 opacity-[0.06]">
          <div className="absolute -right-6 -top-6 h-32 w-32 rounded-full bg-white" />
        </div>
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-white/70">
              {isAdmin ? "Admin Portal" : "Advertiser Portal"}
            </p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-white">Create Campaign</h1>
            <p className="mt-1.5 max-w-lg text-sm text-white/80">
              {isAdmin
                ? "Create a full campaign on behalf of an advertiser with the same targeting and budget options."
                : "Set up targeting, tier payouts, budget, scheduling, and tracking for your next lead campaign. Submissions are reviewed by admin before going live."}
            </p>
          </div>
          <Link
            href={backHref}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center self-end rounded-xl bg-white/15 text-white hover:bg-white/25 sm:self-center"
          >
            <X className="h-4 w-4" />
          </Link>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
        <div className="space-y-5">
          <SectionCard step={1} title="Basic Campaign Settings" icon={Settings2} accentIndex={0}>
            {isAdmin && (
              <div className="space-y-2">
                <Label htmlFor="advertiser">Advertiser*</Label>
                <Select
                  value={advertiserId}
                  onValueChange={(value) => value && setAdvertiserId(value)}
                  disabled={loadingAdvertisers}
                >
                  <SelectTrigger id="advertiser" className="h-10 w-full">
                    <SelectValue
                      placeholder={
                        loadingAdvertisers ? "Loading advertisers..." : "Select advertiser"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {advertisers.map((advertiser) => (
                      <SelectItem key={advertiser.id} value={advertiser.id}>
                        {advertiser.name} ({advertiser.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FieldHint>Campaign will be created under this advertiser account.</FieldHint>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="name">Campaign Name*</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter campaign name"
                required
              />
              <FieldHint>This is the name of your campaign that will be displayed in the dashboard</FieldHint>
            </div>

            <div className="space-y-2">
              <Label htmlFor="destinationUrl">Destination URL*</Label>
              <Input
                id="destinationUrl"
                value={destinationUrl}
                onChange={(e) => setDestinationUrl(e.target.value)}
                placeholder="https://example.com/landing"
                required
              />
              <FieldHint>This is the URL that users will be redirected to after clicking your ad</FieldHint>
              <div className="space-y-2 pt-1">
                <p className="text-xs text-slate-500">Click on a badge to append it to the URL:</p>
                <div className="flex flex-wrap gap-2">
                  {URL_TOKENS.map(({ token, highlight }) => (
                    <button
                      key={token}
                      type="button"
                      onClick={() => appendToken(token)}
                      className={cn(
                        "rounded-md border px-2.5 py-1 font-mono text-xs transition-colors",
                        highlight
                          ? "border-[var(--theme-primary)]/30 bg-[var(--theme-primary-soft)] text-[var(--theme-primary)] hover:opacity-80"
                          : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100",
                      )}
                    >
                      {token}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </SectionCard>

          <SectionCard step={2} title="Scheduling" icon={CalendarClock} accentIndex={1}>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/40 p-4">
                <p className="text-sm font-medium text-slate-800">Start Date</p>
                <RadioOption
                  name="startMode"
                  value="now"
                  checked={startMode === "now"}
                  onChange={(v) => setStartMode(v as StartMode)}
                  label="Start Campaign Now"
                />
                <RadioOption
                  name="startMode"
                  value="scheduled"
                  checked={startMode === "scheduled"}
                  onChange={(v) => setStartMode(v as StartMode)}
                  label="Scheduled Start"
                />
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  disabled={startMode === "now"}
                  className="h-9 bg-white"
                />
                <FieldHint>Date Format: yyyy-mm-dd</FieldHint>
              </div>

              <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/40 p-4">
                <p className="text-sm font-medium text-slate-800">End Date</p>
                <RadioOption
                  name="endMode"
                  value="forever"
                  checked={endMode === "forever"}
                  onChange={(v) => setEndMode(v as EndMode)}
                  label="No End Date - Campaign will run indefinitely"
                />
                <RadioOption
                  name="endMode"
                  value="scheduled"
                  checked={endMode === "scheduled"}
                  onChange={(v) => setEndMode(v as EndMode)}
                  label="Scheduled End"
                />
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  disabled={endMode === "forever"}
                  className="h-9 bg-white"
                />
                <FieldHint>Date Format: yyyy-mm-dd</FieldHint>
              </div>
            </div>
          </SectionCard>

          <SectionCard step={3} title="Targeting" icon={Target} accentIndex={2}>
            <div className="space-y-2">
              <Label htmlFor="vertical">Select a Vertical*</Label>
              <select
                id="vertical"
                value={vertical}
                onChange={(e) => setVertical(e.target.value)}
                className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm"
                required
              >
                <option value="">Search Verticals...</option>
                {VERTICALS.map((item) => (
                  <option key={item.label} value={item.label}>
                    {item.label}
                  </option>
                ))}
              </select>
              <FieldHint>You can select only one vertical.</FieldHint>
            </div>

            <Tabs value={trafficMode} onValueChange={(v) => v && setTrafficMode(v as TrafficMode)}>
              <TabsList className="w-full justify-start bg-slate-100">
                <TabsTrigger value="allow" className="flex-1">
                  Allow Traffic
                </TabsTrigger>
                <TabsTrigger value="block" className="flex-1">
                  Block Traffic (Blacklisted)
                </TabsTrigger>
              </TabsList>

              <TabsContent value="allow" className="mt-4 space-y-4">
                <CampaignCountryField
                  label="Country (Keep empty for all countries)"
                  selected={selectedCountries}
                  onChange={setSelectedCountries}
                />

                <TierPayoutInfoPanel payoutTiers={payoutTiers} cplValue={cplValue} />

                <CampaignSearchMultiSelect
                  label="Device Types (Keep empty to target all device types)"
                  options={DEVICE_TYPES}
                  selected={devices}
                  onChange={setDevices}
                  searchPlaceholder="Search Devices..."
                />

                <CampaignSearchMultiSelect
                  label="Device Operating Systems (keep empty for all OS)"
                  options={OPERATING_SYSTEMS}
                  selected={operatingSystems}
                  onChange={setOperatingSystems}
                  searchPlaceholder="Search Operating Systems..."
                />
              </TabsContent>

              <TabsContent value="block" className="mt-4 space-y-4">
                <CampaignCountryField
                  label="Blacklisted Countries"
                  selected={blacklistedCountries}
                  onChange={setBlacklistedCountries}
                  searchPlaceholder="Search Countries..."
                />

                <CampaignSearchMultiSelect
                  label="Blacklisted Device Types"
                  options={DEVICE_TYPES}
                  selected={blacklistedDevices}
                  onChange={setBlacklistedDevices}
                  searchPlaceholder="Search Devices..."
                />

                <CampaignSearchMultiSelect
                  label="Blacklisted Device Operating Systems"
                  options={OPERATING_SYSTEMS}
                  selected={blacklistedOperatingSystems}
                  onChange={setBlacklistedOperatingSystems}
                  searchPlaceholder="Search Operating Systems..."
                />
              </TabsContent>
            </Tabs>
          </SectionCard>

          <SectionCard step={4} title="Budget" icon={Wallet} accentIndex={3}>
            <div className="space-y-2">
              <Label htmlFor="cpl">CPL Bid (your maximum cost per lead) *</Label>
              <CurrencyInput
                id="cpl"
                value={cpl}
                onChange={setCpl}
                placeholder="0.00"
                min={minCpl}
                max={100}
                step={0.01}
                required
              />
              <FieldHint>Min. {minCpl.toFixed(2)} and Max. 100.00</FieldHint>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2 rounded-xl border border-slate-100 bg-slate-50/30 p-4">
                <Label htmlFor="totalBudget" className="leading-snug">
                  Total Budget
                </Label>
                <FieldHint>Stop campaign when reached — leave empty for unlimited</FieldHint>
                <div className="pt-1">
                  <CurrencyInput
                    id="totalBudget"
                    value={totalBudget}
                    onChange={setTotalBudget}
                    placeholder="Unlimited"
                    min={1}
                    step={1}
                  />
                </div>
              </div>
              <div className="space-y-2 rounded-xl border border-slate-100 bg-slate-50/30 p-4">
                <Label htmlFor="dailyBudget" className="leading-snug">
                  Daily Budget
                </Label>
                <FieldHint>Maximum spend per day — leave empty for unlimited</FieldHint>
                <div className="pt-1">
                  <CurrencyInput
                    id="dailyBudget"
                    value={dailyBudget}
                    onChange={setDailyBudget}
                    placeholder="Unlimited"
                    min={1}
                    step={1}
                  />
                </div>
              </div>
            </div>
          </SectionCard>

          <SectionCard
            step={5}
            title="Tracking Pixel"
            icon={Crosshair}
            accentIndex={3}
          >
            <div id="campaign-tracking-pixel">
              {createdPixelToken ? (
                <div className="space-y-4">
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                    {isAdmin
                      ? "Campaign created. Copy the tracking pixel below and share it with the advertiser."
                      : "Campaign submitted for admin review. Copy your tracking pixel below and place it on your conversion page once approved."}
                  </div>
                  <CampaignTrackingPixelPanel pixelToken={createdPixelToken} />
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/60 px-4 py-5 text-sm text-slate-600">
                  <p className="font-medium text-slate-800">Auto-generated on save</p>
                  <p className="mt-1">
                    A unique tracking pixel will be created when you save this campaign. Use it on
                    your thank-you or conversion page to track confirmed sales.
                  </p>
                </div>
              )}
            </div>
          </SectionCard>
        </div>

        <aside className="space-y-5 xl:sticky xl:top-6 xl:self-start">
          <CampaignSummaryPanel
            name={name}
            startMode={startMode}
            startDate={startDate}
            endMode={endMode}
            endDate={endDate}
            vertical={vertical}
            selectedCountries={selectedCountries}
            totalBudgetValue={totalBudgetValue}
            dailyBudgetValue={dailyBudgetValue}
            cplValue={cplValue}
            todayLabel={todayLabel()}
            mode={mode}
            status={campaignStatus}
            onStatusChange={setCampaignStatus}
            autoApprove={autoApprove}
            onAutoApproveChange={setAutoApprove}
          />

          <BidRecommendationPanel cplValue={cplValue} />

          <TierPayoutInfoPanel payoutTiers={payoutTiers} cplValue={cplValue} />

          <div className="rounded-[18px] border border-slate-200/80 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
              <span className="text-xs text-slate-500">
                {isAdmin ? "Advertiser wallet" : "Wallet balance"}
              </span>
              <span className="text-sm font-bold text-[var(--theme-primary)]">
                ${effectiveWalletBalance.toFixed(2)}
              </span>
            </div>

            {isAdmin && advertiserId && effectiveWalletBalance < cplValue && cplValue > 0 && (
              <p className="mb-3 text-sm text-amber-700">
                This advertiser has a low wallet balance. You can still create the campaign as admin.
              </p>
            )}

            {insufficientBalance && (
              <p className="mb-3 text-sm text-red-600">
                You do not have enough balance to create a campaign. Please add funds to your account.
              </p>
            )}
            {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

            <Button
              type="submit"
              disabled={loading || !canSubmit || !!createdPixelToken}
              className="h-10 w-full rounded-lg bg-[var(--theme-primary)] font-semibold hover:opacity-90 disabled:opacity-50"
            >
              {loading
                ? isAdmin
                  ? "Creating..."
                  : "Submitting..."
                : createdPixelToken
                  ? isAdmin
                    ? "Campaign created"
                    : "Campaign submitted"
                  : isAdmin
                    ? "Create Campaign"
                    : "Submit for Review"}
            </Button>
            {createdPixelToken ? (
              <ButtonLink
                href={backHref}
                className="mt-2 h-10 w-full rounded-lg bg-[var(--theme-primary)] font-semibold text-white hover:opacity-90"
              >
                Go to campaigns
              </ButtonLink>
            ) : (
              <ButtonLink href={backHref} variant="outline" className="mt-2 h-10 w-full">
                Cancel
              </ButtonLink>
            )}
            {!canSubmit && !error && (
              <p className="mt-3 text-center text-xs text-slate-500">
                {isAdmin
                  ? "Select an advertiser and fill required fields to continue"
                  : "Fill required fields to submit for review"}
              </p>
            )}
          </div>
        </aside>
      </div>
    </form>
  );
}
