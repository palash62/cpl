"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
export default function WalletPageClient({
  initialBalance,
}: {
  initialBalance: { balance: number; availableBalance: number; currency: string };
}) {
  const router = useRouter();
  const [balance, setBalance] = useState(initialBalance);
  const [amount, setAmount] = useState(100);
  const [loading, setLoading] = useState(false);

  async function deposit() {
    setLoading(true);
    const res = await fetch("/api/v1/wallet", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount }),
    });
    const data = await res.json();
    if (res.ok) setBalance(data.balance);
    setLoading(false);
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <h2 className="text-2xl font-bold">Wallet</h2>
      <Card>
        <CardHeader>
          <CardTitle>Balance</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold">${balance.balance.toFixed(2)}</p>
          <p className="text-sm text-muted-foreground">
            Available: ${balance.availableBalance.toFixed(2)} {balance.currency}
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Add Funds</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Amount ($)</Label>
            <Input type="number" value={amount} onChange={(e) => setAmount(Number(e.target.value))} min={10} />
          </div>
          <Button onClick={deposit} disabled={loading} className="w-full">
            {loading ? "Processing..." : "Add Funds"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
