"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { AlertTriangle, Banknote, Clock, Loader2 } from "lucide-react";
import { formatCurrency } from "@/components/admin/admin-ui";
import { PageSection } from "@/components/admin/page-section";
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

type PayoutEligibility = {
  canRequest: boolean;
  lastRequestAt?: string | null;
  nextAllowedAt?: string | null;
};

export function PublisherPayoutRequestForm({
  availableBalance,
  minPayoutAmount,
  payoutEligibility,
}: {
  availableBalance: number;
  minPayoutAmount: number;
  payoutEligibility: PayoutEligibility;
}) {
  const router = useRouter();
  const [amount, setAmount] = useState(Math.max(minPayoutAmount, Math.min(availableBalance, 50)));
  const [method, setMethod] = useState("PAYPAL");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [warning, setWarning] = useState(
    payoutEligibility.canRequest
      ? ""
      : buildWeeklyLimitWarning(payoutEligibility.nextAllowedAt),
  );

  const canSubmit =
    payoutEligibility.canRequest && availableBalance >= minPayoutAmount && !loading;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setWarning("");

    const res = await fetch("/api/v1/payouts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount,
        method,
        idempotencyKey: `payout-${Date.now()}`,
      }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      const message = data.error?.message ?? "Request failed";
      if (data.error?.code === "PAYOUT_WEEKLY_LIMIT") {
        setWarning(message);
      } else {
        setError(message);
      }
      return;
    }

    router.push("/publisher/earnings?tab=payouts");
    router.refresh();
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_300px]">
      <PageSection
        title="Payout Details"
        description="Withdraw your available earnings"
        icon={Banknote}
        gradient="revenue"
        contentClassName="p-6"
      >
        <form onSubmit={submit} className="space-y-4">
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
            <p className="text-xs font-medium uppercase tracking-wide text-emerald-700">Available balance</p>
            <p className="mt-1 text-2xl font-bold text-emerald-800">{formatCurrency(availableBalance)}</p>
          </div>

          {warning && (
            <div className="flex gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <p>{warning}</p>
            </div>
          )}

          {error && (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}

          <div className="space-y-2">
            <Label>Amount ($)</Label>
            <Input
              type="number"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              min={minPayoutAmount}
              max={availableBalance}
              required
            />
            <p className="text-xs text-slate-500">
              Minimum payout: {formatCurrency(minPayoutAmount)}
            </p>
          </div>

          <div className="space-y-2">
            <Label>Method</Label>
            <Select value={method} onValueChange={(v) => v && setMethod(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PAYPAL">PayPal</SelectItem>
                <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                <SelectItem value="STRIPE_CONNECT">Stripe Connect</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            type="submit"
            className="h-10 w-full rounded-xl bg-[var(--theme-primary)] hover:opacity-90"
            disabled={!canSubmit}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Request Payout"}
          </Button>
        </form>
      </PageSection>

      <div className="premium-card p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--theme-primary-soft)]">
            <Clock className="h-5 w-5 text-[var(--theme-primary)]" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-900">Payout timeline</h3>
            <p className="text-sm text-slate-500">What to expect after requesting</p>
          </div>
        </div>
        <ul className="mt-4 space-y-3 text-sm text-slate-600">
          <li>1. You can submit one payout request per week</li>
          <li>2. Your request is reviewed by our team (1–3 business days)</li>
          <li>3. Approved payouts are processed to your selected method</li>
          <li>4. You can track status on the Payouts page</li>
        </ul>
      </div>
    </div>
  );
}

function buildWeeklyLimitWarning(nextAllowedAt?: string | null) {
  if (!nextAllowedAt) {
    return "You can only request one payout per week. Please try again later.";
  }

  return `You can only request one payout per week. Your next request will be available on ${format(new Date(nextAllowedAt), "MMM d, yyyy")}.`;
}
