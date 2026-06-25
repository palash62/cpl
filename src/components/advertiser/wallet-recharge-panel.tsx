"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const QUICK_AMOUNTS = [50, 100, 250, 500, 1000];

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
  const [amount, setAmount] = useState("100");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const numericAmount = Number(amount);
  const canSubmit = !loading && numericAmount >= 10;

  async function deposit() {
    if (!canSubmit) {
      setError("Minimum deposit is $10.00");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    const res = await fetch("/api/v1/wallet", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: numericAmount }),
    });
    const data = await res.json();

    if (res.ok) {
      setBalance(data.balance);
      setSuccess(`$${numericAmount.toFixed(2)} added to your wallet.`);
      router.refresh();
    } else {
      setError(data?.error?.message ?? "Unable to add funds. Please try again.");
    }

    setLoading(false);
  }

  return (
    <div id="add-funds" className="scroll-mt-24">
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-5">
          <div
            className="rounded-xl border px-4 py-4"
            style={{
              borderColor: "color-mix(in srgb, var(--theme-primary) 20%, transparent)",
              background: "var(--theme-primary-soft)",
            }}
          >
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Current balance</p>
            <p className="mt-1 text-3xl font-bold tracking-tight text-[var(--theme-primary)]">
              ${balance.balance.toFixed(2)}
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Available: ${balance.availableBalance.toFixed(2)} {balance.currency}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="add-funds-amount">Amount to add</Label>
            <CurrencyInput id="add-funds-amount" value={amount} onChange={setAmount} min={10} />
            <p className="text-xs text-slate-500">Minimum deposit: $10.00</p>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Quick amounts</p>
            <div className="flex flex-wrap gap-2">
              {QUICK_AMOUNTS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setAmount(String(preset))}
                  className={cn(
                    "rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors",
                    Number(amount) === preset
                      ? "border-[var(--theme-primary)] bg-[var(--theme-primary-soft)] text-[var(--theme-primary)]"
                      : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50",
                  )}
                >
                  ${preset}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col justify-between gap-5 rounded-xl border border-slate-200 bg-slate-50/60 p-5">
          <div className="space-y-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white shadow-sm">
              <Wallet className="h-6 w-6 text-[var(--theme-primary)]" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Top up your wallet</h3>
              <p className="mt-1 text-sm text-slate-500">
                Funds are added instantly in demo mode. Use your balance to pay for approved leads on
                active campaigns.
              </p>
            </div>
          </div>

          {error && (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
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
            className="h-12 w-full rounded-xl bg-[var(--theme-primary)] text-base font-semibold text-white shadow-md hover:opacity-90"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Plus className="mr-2 h-5 w-5" />
                Add Funds
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
