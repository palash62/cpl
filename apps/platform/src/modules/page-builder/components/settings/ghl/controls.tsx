"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { BuilderImageUpload } from "@/modules/page-builder/components/editor/builder-image-upload";
import { normalizeCssLength, normalizeSpacing } from "@/modules/page-builder/lib/responsive";
import { GHL_FIELD_LABEL } from "@/modules/page-builder/lib/builder-panel-styles";

export function WidthControl({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const numeric = parseInt(value.replace(/[^\d]/g, ""), 10);
  const parsed = Number.isFinite(numeric) ? Math.max(0, numeric) : 0;
  const unit = value === "auto" ? "auto" : "px";
  const sliderMax = 1200;
  const sliderValue = Math.min(parsed, sliderMax);

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <label className={GHL_FIELD_LABEL}>{label}</label>
        <div className="flex gap-0.5">
          {(["px", "auto"] as const).map((u) => (
            <button
              key={u}
              type="button"
              onClick={() => {
                if (u === "auto") onChange("auto");
                else onChange(`${Math.min(parsed, sliderMax)}px`);
              }}
              className={cn(
                "rounded px-1.5 py-0.5 text-[10px] font-medium leading-none",
                unit === u ? "bg-blue-100 text-blue-700" : "text-slate-500 hover:bg-slate-100",
              )}
            >
              {u}
            </button>
          ))}
        </div>
      </div>
      {unit !== "auto" && (
        <div className="flex items-center gap-1.5">
          <input
            type="range"
            min={0}
            max={sliderMax}
            value={sliderValue}
            onChange={(e) => onChange(`${e.target.value}${unit}`)}
            className="h-1.5 flex-1 accent-blue-600"
          />
          <input
            type="number"
            value={parsed}
            onChange={(e) => onChange(`${e.target.value}${unit}`)}
            className="h-7 w-12 rounded-md border border-slate-200 px-1 text-center text-[11px]"
          />
        </div>
      )}
    </div>
  );
}

export function normalizeAlignValue(value: string): string {
  if (value === "flex-start") return "left";
  if (value === "flex-end") return "right";
  return value || "left";
}

export function AlignControl({
  label,
  value,
  onChange,
  mode = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  mode?: "text" | "flex";
}) {
  const normalized = mode === "text" ? normalizeAlignValue(value) : value;
  const options =
    mode === "flex"
      ? [
          { id: "flex-start", label: "Left" },
          { id: "center", label: "Center" },
          { id: "flex-end", label: "Right" },
        ]
      : [
          { id: "left", label: "Left" },
          { id: "center", label: "Center" },
          { id: "right", label: "Right" },
        ];
  return (
    <div className="space-y-1.5">
      <label className={GHL_FIELD_LABEL}>{label}</label>
      <div className="grid grid-cols-3 gap-1">
        {options.map((opt) => (
          <button
            key={opt.id}
            type="button"
            onClick={() => onChange(opt.id)}
            className={cn(
              "h-7 rounded-md border text-[11px] font-medium transition",
              normalized === opt.id
                ? "border-blue-200 bg-blue-50 text-blue-700"
                : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function SpacingControl({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const parts = value.split(" ").filter(Boolean);
  const [top, right, bottom, left] = [
    parts[0] ?? "0",
    parts[1] ?? parts[0] ?? "0",
    parts[2] ?? parts[0] ?? "0",
    parts[3] ?? parts[1] ?? parts[0] ?? "0",
  ];

  function update(side: number, val: string) {
    const next = [top, right, bottom, left];
    next[side] = normalizeCssLength(val);
    onChange(normalizeSpacing(next.join(" ")));
  }

  return (
    <div className="space-y-1.5">
      <label className={GHL_FIELD_LABEL}>{label}</label>
      <div className="grid grid-cols-2 gap-1.5">
        {[
          ["Top", 0],
          ["Right", 1],
          ["Bottom", 2],
          ["Left", 3],
        ].map(([side, idx]) => (
          <div key={side as string} className="space-y-0.5">
            <span className="text-[10px] leading-none text-slate-500">{side as string}</span>
            <input
              value={[top, right, bottom, left][idx as number]}
              onChange={(e) => update(idx as number, e.target.value)}
              placeholder="0"
              className="h-7 w-full rounded-md border border-slate-200 px-1.5 text-[11px]"
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export function BackgroundPanel({
  style,
  onChange,
}: {
  style: Record<string, string | number | undefined>;
  onChange: (key: string, value: string) => void;
}) {
  const [tab, setTab] = useState<"color" | "image" | "video">("color");
  const gradientEnabled = Boolean(style.backgroundGradient);

  return (
    <div className="space-y-2.5">
      <div className="flex gap-0.5 rounded-md bg-slate-100 p-0.5">
        {(["color", "image", "video"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={cn(
              "flex-1 rounded py-1 text-[11px] font-medium capitalize transition",
              tab === t ? "bg-white text-slate-900 shadow-sm" : "text-slate-500",
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "color" && (
        <div className="space-y-2">
          <label className="flex items-center justify-between text-[11px] text-slate-600">
            <span>Gradient</span>
            <input
              type="checkbox"
              checked={gradientEnabled}
              onChange={(e) => {
                if (e.target.checked) {
                  onChange("backgroundGradient", "linear-gradient(135deg, #667eea 0%, #764ba2 100%)");
                } else {
                  onChange("backgroundGradient", "");
                }
              }}
              className="accent-blue-600"
            />
          </label>
          {gradientEnabled ? (
            <GradientBuilder
              value={String(style.backgroundGradient ?? "")}
              onChange={(v) => onChange("backgroundGradient", v)}
            />
          ) : (
            <div className="flex items-center gap-1.5">
              <input
                type="color"
                value={String(style.backgroundColor ?? "#ffffff")}
                onChange={(e) => onChange("backgroundColor", e.target.value)}
                className="h-8 w-8 cursor-pointer rounded border border-slate-200"
              />
              <input
                value={String(style.backgroundColor ?? "")}
                onChange={(e) => onChange("backgroundColor", e.target.value)}
                placeholder="#ffffff"
                className="h-8 flex-1 rounded-md border border-slate-200 px-2 text-[11px]"
              />
            </div>
          )}
        </div>
      )}

      {tab === "image" && (
        <div className="space-y-1.5">
          <BuilderImageUpload
            value={String(style.backgroundImage ?? "")}
            onChange={(url) => onChange("backgroundImage", url)}
            onClear={() => onChange("backgroundImage", "")}
            urlPlaceholder="Or paste background image URL"
          />
          <select
            value={String(style.backgroundSize ?? "cover")}
            onChange={(e) => onChange("backgroundSize", e.target.value)}
            className="h-8 w-full rounded-md border border-slate-200 px-2 text-[11px]"
          >
            <option value="cover">Cover</option>
            <option value="contain">Contain</option>
            <option value="auto">Auto</option>
          </select>
        </div>
      )}

      {tab === "video" && (
        <input
          value={String(style.backgroundVideo ?? "")}
          onChange={(e) => onChange("backgroundVideo", e.target.value)}
          placeholder="Video URL (mp4)"
          className="h-8 w-full rounded-md border border-slate-200 px-2 text-[11px]"
        />
      )}
    </div>
  );
}

function GradientBuilder({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const match = value.match(/(\d+)deg,\s*([^,]+)\s*0%,\s*([^)]+)\s*100%/);
  const angle = match?.[1] ?? "135";
  const start = match?.[2]?.trim() ?? "#667eea";
  const end = match?.[3]?.trim() ?? "#764ba2";

  function update(a: string, s: string, e: string) {
    onChange(`linear-gradient(${a}deg, ${s} 0%, ${e} 100%)`);
  }

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5">
        <span className="text-[11px] text-slate-500">Angle</span>
        <input
          type="range"
          min={0}
          max={360}
          value={angle}
          onChange={(ev) => update(ev.target.value, start, end)}
          className="h-1.5 flex-1 accent-blue-600"
        />
        <span className="text-[11px] tabular-nums text-slate-600">{angle}°</span>
      </div>
      <div className="grid grid-cols-2 gap-1.5">
        <input type="color" value={start} onChange={(e) => update(angle, e.target.value, end)} className="h-8 w-full rounded border border-slate-200" />
        <input type="color" value={end} onChange={(e) => update(angle, start, e.target.value)} className="h-8 w-full rounded border border-slate-200" />
      </div>
      <div className="h-7 rounded-md border border-slate-200" style={{ background: value }} />
    </div>
  );
}

export function BlurControl({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const px = parseInt(value.replace(/[^\d]/g, ""), 10) || 0;
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className={GHL_FIELD_LABEL}>Background blur</label>
        <span className="text-[11px] tabular-nums text-slate-500">{px}px</span>
      </div>
      <input
        type="range"
        min={0}
        max={40}
        value={px}
        onChange={(e) => onChange(`${e.target.value}px`)}
        className="h-1.5 w-full accent-blue-600"
      />
    </div>
  );
}
