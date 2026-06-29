"use client";

import { useMemo, useState } from "react";
import { X } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  ALL_TIER_COUNTRY_CODES,
  TIER_COUNTRIES,
  TIER_META,
  getCountryName,
  type CountryTier,
} from "@/lib/campaign-form";

type CampaignCountryFieldProps = {
  label: string;
  hint?: string;
  selected: string[];
  onChange: (codes: string[]) => void;
  showTierButtons?: boolean;
  searchPlaceholder?: string;
};

export function CampaignCountryField({
  label,
  hint,
  selected,
  onChange,
  showTierButtons = true,
  searchPlaceholder = "Search Countries...",
}: CampaignCountryFieldProps) {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);

  const suggestions = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return [];
    return ALL_TIER_COUNTRY_CODES.filter(
      (code) =>
        !selected.includes(code) &&
        (code.toLowerCase().includes(term) || getCountryName(code).toLowerCase().includes(term)),
    ).slice(0, 8);
  }, [search, selected]);

  function addCountry(code: string) {
    if (!selected.includes(code)) {
      onChange([...selected, code]);
    }
    setSearch("");
    setOpen(false);
  }

  function removeCountry(code: string) {
    onChange(selected.filter((item) => item !== code));
  }

  function addTier(tier: CountryTier) {
    onChange(Array.from(new Set([...selected, ...TIER_COUNTRIES[tier]])));
  }

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {hint && <p className="text-xs text-slate-500">{hint}</p>}

      <div className="relative">
        <div
          className={cn(
            "flex min-h-10 flex-wrap items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2 py-1.5",
            open && "ring-2 ring-[var(--theme-primary)]/15",
          )}
        >
          {selected.map((code) => (
            <Badge
              key={code}
              variant="outline"
              className="gap-1 border-slate-200 bg-slate-50 pr-1 text-xs font-normal text-slate-700"
            >
              {getCountryName(code)} ({code})
              <button
                type="button"
                onClick={() => removeCountry(code)}
                className="rounded p-0.5 hover:bg-slate-200"
                aria-label={`Remove ${getCountryName(code)}`}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onBlur={() => setTimeout(() => setOpen(false), 150)}
            placeholder={selected.length === 0 ? searchPlaceholder : ""}
            className="min-w-[140px] flex-1 border-0 bg-transparent px-1 py-1 text-sm outline-none placeholder:text-slate-400"
          />
        </div>

        {open && suggestions.length > 0 && (
          <div className="absolute z-20 mt-1 max-h-48 w-full overflow-y-auto rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
            {suggestions.map((code) => (
              <button
                key={code}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => addCountry(code)}
                className="flex w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
              >
                {getCountryName(code)} ({code})
              </button>
            ))}
          </div>
        )}
      </div>

      {showTierButtons && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-500">Add Tier Countries</span>
          {(Object.keys(TIER_META) as CountryTier[]).map((tier) => (
            <button
              key={tier}
              type="button"
              onClick={() => addTier(tier)}
              className="text-xs font-medium text-[var(--theme-primary)] hover:underline"
            >
              {TIER_META[tier].label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
