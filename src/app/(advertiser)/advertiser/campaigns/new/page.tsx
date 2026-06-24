"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

export default function CreateCampaignPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    category: "GENERIC",
    cpl: 25,
    budget: 1000,
    autoApprove: false,
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const res = await fetch("/api/v1/campaigns", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        fields: [
          { fieldName: "first_name", label: "First Name", fieldType: "text", required: true },
          { fieldName: "email", label: "Email", fieldType: "email", required: true },
          { fieldName: "phone", label: "Phone", fieldType: "phone", required: true },
        ],
      }),
    });

    setLoading(false);
    if (res.ok) router.push("/advertiser/campaigns");
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h2 className="text-2xl font-bold">Create Campaign</h2>
      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Campaign Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Campaign Name</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Finance Leads Q2"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={form.category} onValueChange={(v) => v && setForm({ ...form, category: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["FINANCE", "INSURANCE", "EDUCATION", "REAL_ESTATE", "GENERIC"].map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>CPL ($)</Label>
                <Input
                  type="number"
                  value={form.cpl}
                  onChange={(e) => setForm({ ...form, cpl: Number(e.target.value) })}
                  min={1}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Budget ($)</Label>
                <Input
                  type="number"
                  value={form.budget}
                  onChange={(e) => setForm({ ...form, budget: Number(e.target.value) })}
                  min={1}
                  required
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="autoApprove"
                checked={form.autoApprove}
                onCheckedChange={(c) => setForm({ ...form, autoApprove: !!c })}
              />
              <Label htmlFor="autoApprove">Auto-approve leads</Label>
            </div>
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Creating..." : "Create Campaign"}
            </Button>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
