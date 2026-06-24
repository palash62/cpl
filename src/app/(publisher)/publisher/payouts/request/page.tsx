"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function RequestPayoutPage() {
  const router = useRouter();
  const [amount, setAmount] = useState(50);
  const [method, setMethod] = useState("PAYPAL");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

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
      setError(data.error?.message ?? "Request failed");
      return;
    }

    router.push("/publisher/payouts");
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-md space-y-6">
      <h2 className="text-2xl font-bold">Request Payout</h2>
      <Card>
        <CardHeader>
          <CardTitle>Payout Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-4">
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="space-y-2">
              <Label>Amount ($)</Label>
              <Input type="number" value={amount} onChange={(e) => setAmount(Number(e.target.value))} min={50} required />
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
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Submitting..." : "Request Payout"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
