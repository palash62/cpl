"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CreditCard, Landmark, Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const QUICK_AMOUNTS = [50, 100, 250, 500, 1000];

type PaymentMethod = "CREDIT_CARD" | "WISE";

function CurrencyInput({
  id,
  value,
  onChange,
  min,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  min?: number;
}) {
  return (
    <div
      className={cn(
        "flex h-11 w-full items-stretch overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm",
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
        step="0.01"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="0.00"
        className="min-w-0 flex-1 border-0 bg-white px-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      />
      <span className="flex w-12 shrink-0 items-center justify-center border-l border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
        USD
      </span>
    </div>
  );
}

export function WalletRechargePanel({
  initialBalance,
}: {
  initialBalance: { balance: number; availableBalance: number; currency: string };
}) {
  const router = useRouter();
  const [balance, setBalance] = useState(initialBalance);
  const [method, setMethod] = useState<PaymentMethod>("CREDIT_CARD");
  const [amount, setAmount] = useState("100");
  const [wiseReference, setWiseReference] = useState("");
  const [payerName, setPayerName] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const numericAmount = Number(amount);
  const canSubmit =
    !loading &&
    numericAmount >= 10 &&
    (method === "CREDIT_CARD" || wiseReference.trim().length > 0);

  async function deposit() {
    if (!canSubmit) {
      setError(method === "WISE" ? "Enter amount (min $10) and Wise transfer reference" : "Minimum deposit is $10.00");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    const body: Record<string, unknown> = {
      amount: numericAmount,
      method,
    };

    if (method === "WISE") {
      body.wiseReference = wiseReference.trim();
      if (payerName.trim()) body.payerName = payerName.trim();
      if (note.trim()) body.note = note.trim();
    }

    const res = await fetch("/api/v1/wallet", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();

    if (res.ok) {
      setBalance(data.balance);
      if (method === "CREDIT_CARD") {
        setSuccess(`$${numericAmount.toFixed(2)} added and approved instantly.`);
      } else {
        setSuccess(`Wise deposit submitted for $${numericAmount.toFixed(2)}. Pending admin approval.`);
        setWiseReference("");
        setPayerName("");
        setNote("");
      }
      router.refresh();
    } else {
      setError(data?.error?.message ?? "Unable to add funds. Please try again.");
    }

    setLoading(false);
  }

  return (
    <div id="add-funds" className="scroll-mt-24 space-y-5">
      <div
        className="rounded-xl border px-4 py-4"
        style={{
          borderColor: "color-mix(in srgb, var(--theme-primary) 20%, transparent)",
          background: "var(--theme-primary-soft)",
        }}
      >
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Available balance</p>
        <p className="mt-1 text-3xl font-bold tracking-tight text-[var(--theme-primary)]">
          ${balance.availableBalance.toFixed(2)}
        </p>
        <p className="mt-1 text-sm text-slate-500">
          Total: ${balance.balance.toFixed(2)} {balance.currency}
        </p>
      </div>

      <div className="space-y-2">
        <Label>Payment method</Label>
        <div className="grid gap-2 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => setMethod("CREDIT_CARD")}
            className={cn(
              "flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition-colors",
              method === "CREDIT_CARD"
                ? "border-[var(--theme-primary)] bg-[var(--theme-primary-soft)]"
                : "border-slate-200 bg-white hover:border-slate-300",
            )}
          >
            <CreditCard className="h-5 w-5 text-[var(--theme-primary)]" />
            <div>
              <p className="text-sm font-semibold text-slate-900">Credit Card</p>
              <p className="text-xs text-slate-500">Instant approval</p>
            </div>
          </button>
          <button
            type="button"
            onClick={() => setMethod("WISE")}
            className={cn(
              "flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition-colors",
              method === "WISE"
                ? "border-[var(--theme-primary)] bg-[var(--theme-primary-soft)]"
                : "border-slate-200 bg-white hover:border-slate-300",
            )}
          >
            <Landmark className="h-5 w-5 text-[var(--theme-primary)]" />
            <div>
              <p className="text-sm font-semibold text-slate-900">Wise</p>
              <p className="text-xs text-slate-500">Admin reviews transfer</p>
            </div>
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="add-funds-amount">Amount</Label>
        <CurrencyInput id="add-funds-amount" value={amount} onChange={setAmount} min={10} />
        <div className="flex flex-wrap gap-2 pt-1">
          {QUICK_AMOUNTS.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => setAmount(String(preset))}
              className={cn(
                "rounded-lg border px-3 py-1 text-xs font-medium transition-colors",
                Number(amount) === preset
                  ? "border-[var(--theme-primary)] bg-[var(--theme-primary-soft)] text-[var(--theme-primary)]"
                  : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
              )}
            >
              ${preset}
            </button>
          ))}
        </div>
      </div>

      {method === "WISE" && (
        <div className="space-y-4 rounded-xl border border-slate-200 bg-slate-50/60 p-4">
          <p className="text-sm text-slate-600">
            Send your transfer via Wise, then enter the reference and payer details below. Funds are
            credited after admin approval.
          </p>
          <div className="space-y-2">
            <Label htmlFor="wise-reference">Wise transfer reference *</Label>
            <input
              id="wise-reference"
              value={wiseReference}
              onChange={(e) => setWiseReference(e.target.value)}
              placeholder="e.g. WISE-123456789"
              className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-[var(--theme-primary)] focus:ring-2 focus:ring-[var(--theme-primary)]/15"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="wise-payer">Payer / company name</Label>
            <input
              id="wise-payer"
              value={payerName}
              onChange={(e) => setPayerName(e.target.value)}
              placeholder="Name on the Wise transfer"
              className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-[var(--theme-primary)] focus:ring-2 focus:ring-[var(--theme-primary)]/15"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="wise-note">Note (optional)</Label>
            <textarea
              id="wise-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              placeholder="Any extra details for admin review"
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-[var(--theme-primary)] focus:ring-2 focus:ring-[var(--theme-primary)]/15"
            />
          </div>
        </div>
      )}

      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}
      {success && (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {success}
        </p>
      )}

      <Button
        type="button"
        onClick={deposit}
        disabled={!canSubmit}
        size="lg"
        className="h-12 w-full rounded-xl bg-[var(--theme-primary)] text-base font-semibold text-white shadow-md hover:opacity-90 sm:w-auto sm:min-w-[200px]"
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <Plus className="mr-2 h-5 w-5" />
            {method === "CREDIT_CARD" ? "Pay with Card" : "Submit Wise Deposit"}
          </>
        )}
      </Button>
    </div>
  );
}
