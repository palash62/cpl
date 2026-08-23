"use client";

import { useRouter, useSearchParams } from "next/navigation";

const LEVELS = [
  { value: "", label: "All contextual levels" },
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "critical", label: "Critical" },
];

const SIGNALS = [
  { value: "", label: "All signals" },
  { value: "MULTIPLE_EMAILS_SAME_DEVICE", label: "Multiple emails same device" },
  { value: "RAPID_IDENTITY_ROTATION", label: "Identity rotation" },
  { value: "HIGH_IP_VELOCITY", label: "High IP velocity" },
  { value: "HIGH_DEVICE_VELOCITY", label: "High device velocity" },
  { value: "SHARED_IP_PATTERN", label: "Shared IP pattern" },
  { value: "SAME_DEVICE_MULTIPLE_IDENTITIES", label: "Device multiple identities" },
];

export function FraudQueueFilters() {
  const router = useRouter();
  const params = useSearchParams();
  const level = params.get("contextualRiskLevel") ?? "";
  const signal = params.get("signal") ?? "";

  function update(key: string, value: string) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    router.push(`/admin/fraud?${next.toString()}`);
  }

  return (
    <div className="flex flex-wrap gap-3 border-b border-slate-100 px-6 py-4">
      <select
        className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm"
        value={level}
        onChange={(e) => update("contextualRiskLevel", e.target.value)}
      >
        {LEVELS.map((opt) => (
          <option key={opt.value || "all"} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <select
        className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm"
        value={signal}
        onChange={(e) => update("signal", e.target.value)}
      >
        {SIGNALS.map((opt) => (
          <option key={opt.value || "all-signals"} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
