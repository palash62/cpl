"use client";

import { useState } from "react";
import { ArrowRight, Zap } from "lucide-react";
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
import { TRIGGER_LABELS, type Trigger } from "./types";

type Props = {
  onContinue: (values: { name: string; trigger: Trigger }) => void;
};

export function AutomationCreateForm({ onContinue }: Props) {
  const [name, setName] = useState("");
  const [trigger, setTrigger] = useState<Trigger>("LEAD_CAPTURED");
  const [error, setError] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (trimmed.length < 2) {
      setError("Enter a name (at least 2 characters)");
      return;
    }
    setError("");
    onContinue({ name: trimmed, trigger });
  }

  return (
    <div className="mx-auto w-full max-w-lg">
      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
        <div className="border-b border-slate-100 bg-gradient-to-br from-slate-50 via-white to-emerald-50/40 px-6 py-5">
          <div className="mb-3 flex size-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
            <Zap className="size-5" />
          </div>
          <h1 className="text-xl font-semibold tracking-tight text-slate-900">
            Create automation
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Name it, pick a trigger, then build your email sequence on the canvas.
          </p>
        </div>

        <form onSubmit={submit} className="space-y-4 px-6 py-5">
          <div>
            <Label htmlFor="automation-name">Name</Label>
            <Input
              id="automation-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Welcome sequence"
              autoFocus
              className="mt-1.5"
            />
          </div>
          <div>
            <Label>Trigger</Label>
            <Select
              value={trigger}
              onValueChange={(v) => {
                if (v === "LEAD_CAPTURED" || v === "LEAD_APPROVED") setTrigger(v);
              }}
            >
              <SelectTrigger className="mt-1.5 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(TRIGGER_LABELS) as Trigger[]).map((key) => (
                  <SelectItem key={key} value={key}>
                    {TRIGGER_LABELS[key]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <Button type="submit" className="w-full gap-2">
            Continue to builder
            <ArrowRight className="size-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
