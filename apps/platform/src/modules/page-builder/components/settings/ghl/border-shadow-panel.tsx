"use client";

import { GHL_FIELD_LABEL } from "@/modules/page-builder/lib/builder-panel-styles";
import { cn } from "@/lib/utils";

const SHADOW_PRESETS: { label: string; value: string }[] = [
  { label: "None", value: "" },
  { label: "Soft", value: "0 2px 8px rgba(15, 23, 42, 0.08)" },
  { label: "Medium", value: "0 4px 16px rgba(15, 23, 42, 0.12)" },
  { label: "Strong", value: "0 8px 24px rgba(15, 23, 42, 0.18)" },
];

const RADIUS_PRESETS = ["0", "4px", "8px", "12px", "16px"];

function normalizeHex(value: string, fallback: string): string {
  const t = value.trim();
  if (/^#[0-9a-fA-F]{6}$/.test(t)) return t;
  if (/^#[0-9a-fA-F]{3}$/.test(t)) {
    const [, r, g, b] = t;
    return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
  }
  return fallback;
}

type BorderShadowPanelProps = {
  style: Record<string, string | number | undefined>;
  onChange: (key: string, value: string) => void;
};

export function BorderShadowPanel({ style, onChange }: BorderShadowPanelProps) {
  const borderMatch = String(style.border ?? "").match(/^(\d+)px\s+(\w+)\s+(.+)$/i);
  const borderWidth = borderMatch?.[1] ?? "0";
  const borderStyle = borderMatch?.[2] ?? "solid";
  const borderColor = borderMatch?.[3] ?? "#cbd5e1";

  function setBorder(width: string, bStyle: string, color: string) {
    if (!width || width === "0") {
      onChange("border", "");
      return;
    }
    onChange("border", `${width}px ${bStyle} ${color}`);
  }

  const shadowValue = String(style.boxShadow ?? "");
  const matchedPreset = SHADOW_PRESETS.find((p) => p.value === shadowValue);

  return (
    <div className="space-y-2.5">
      <div className="space-y-1.5">
        <label className={GHL_FIELD_LABEL}>Border</label>
        <div className="flex gap-1.5">
          <input
            type="number"
            min={0}
            max={12}
            value={borderWidth}
            onChange={(e) => setBorder(e.target.value, borderStyle, borderColor)}
            className="h-8 w-14 rounded-md border border-slate-200 px-2 text-xs"
          />
          <select
            value={borderStyle}
            onChange={(e) => setBorder(borderWidth, e.target.value, borderColor)}
            className="h-8 flex-1 rounded-md border border-slate-200 px-2 text-xs"
          >
            <option value="solid">Solid</option>
            <option value="dashed">Dashed</option>
            <option value="dotted">Dotted</option>
          </select>
          <input
            type="color"
            value={normalizeHex(borderColor, "#cbd5e1")}
            onChange={(e) => setBorder(borderWidth, borderStyle, e.target.value)}
            className="h-8 w-10 cursor-pointer rounded border border-slate-200"
          />
        </div>
      </div>

      <div className="space-y-1">
        <label className={GHL_FIELD_LABEL}>Border radius</label>
        <div className="flex flex-wrap gap-1">
          {RADIUS_PRESETS.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => onChange("borderRadius", r)}
              className={cn(
                "rounded px-2 py-1 text-[10px] font-medium",
                String(style.borderRadius ?? "") === r
                  ? "bg-blue-100 text-blue-700"
                  : "bg-slate-100 text-slate-600",
              )}
            >
              {r}
            </button>
          ))}
        </div>
        <input
          type="text"
          placeholder="Custom radius"
          value={String(style.borderRadius ?? "")}
          onChange={(e) => onChange("borderRadius", e.target.value)}
          className="h-8 w-full rounded-md border border-slate-200 px-2 text-xs"
        />
      </div>

      <div className="space-y-1">
        <label className={GHL_FIELD_LABEL}>Shadow</label>
        <div className="flex flex-wrap gap-1">
          {SHADOW_PRESETS.map((p) => (
            <button
              key={p.label}
              type="button"
              onClick={() => onChange("boxShadow", p.value)}
              className={cn(
                "rounded px-2 py-1 text-[10px] font-medium",
                (matchedPreset?.value ?? shadowValue) === p.value
                  ? "bg-blue-100 text-blue-700"
                  : "bg-slate-100 text-slate-600",
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
        <input
          type="text"
          placeholder="Custom box-shadow"
          value={shadowValue}
          onChange={(e) => onChange("boxShadow", e.target.value)}
          className="h-8 w-full rounded-md border border-slate-200 px-2 text-xs"
        />
      </div>

      <div className="space-y-1">
        <label className={GHL_FIELD_LABEL}>Opacity</label>
        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={typeof style.opacity === "number" ? style.opacity : 1}
          onChange={(e) => onChange("opacity", e.target.value)}
          className="h-1.5 w-full accent-blue-600"
        />
      </div>
    </div>
  );
}
