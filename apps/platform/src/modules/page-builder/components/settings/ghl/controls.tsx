"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { normalizeCssLength, normalizeSpacing } from "@/modules/page-builder/lib/responsive";

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
  const percent = Number.isFinite(numeric) ? Math.min(100, Math.max(0, numeric)) : 100;
  const unit = value.includes("px") ? "px" : value === "auto" ? "auto" : "%";

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-slate-600">{label}</label>
        <div className="flex gap-1">
          {(["%", "px", "auto"] as const).map((u) => (
            <button
              key={u}
              type="button"
              onClick={() => {
                if (u === "auto") onChange("auto");
                else if (u === "%") onChange(`${percent}%`);
                else onChange(`${percent}px`);
              }}
              className={cn(
                "rounded px-1.5 py-0.5 text-[10px] font-medium",
                unit === u ? "bg-blue-100 text-blue-700" : "text-slate-500 hover:bg-slate-100",
              )}
            >
              {u}
            </button>
          ))}
        </div>
      </div>
      {unit !== "auto" && (
        <div className="flex items-center gap-2">
          <input
            type="range"
            min={0}
            max={100}
            value={unit === "%" ? percent : Math.min(percent, 1200)}
            onChange={(e) => onChange(`${e.target.value}${unit}`)}
            className="flex-1 accent-blue-600"
          />
          <input
            type="number"
            value={percent}
            onChange={(e) => onChange(`${e.target.value}${unit}`)}
            className="h-8 w-14 rounded-md border border-slate-200 px-1 text-center text-xs"
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
    <div className="space-y-2">
      <label className="text-xs font-medium text-slate-600">{label}</label>
      <div className="grid grid-cols-3 gap-1">
        {options.map((opt) => (
          <button
            key={opt.id}
            type="button"
            onClick={() => onChange(opt.id)}
            className={cn(
              "h-9 rounded-md border text-xs font-medium transition",
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
    <div className="space-y-2">
      <label className="text-xs font-medium text-slate-600">{label}</label>
      <div className="grid grid-cols-2 gap-2">
        {[
          ["Top", 0],
          ["Right", 1],
          ["Bottom", 2],
          ["Left", 3],
        ].map(([side, idx]) => (
          <div key={side as string} className="space-y-1">
            <span className="text-[10px] text-slate-500">{side as string}</span>
            <input
              value={[top, right, bottom, left][idx as number]}
              onChange={(e) => update(idx as number, e.target.value)}
              placeholder="0"
              className="h-8 w-full rounded-md border border-slate-200 px-2 text-xs"
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
    <div className="space-y-3">
      <div className="flex gap-1 rounded-lg bg-slate-100 p-1">
        {(["color", "image", "video"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={cn(
              "flex-1 rounded-md py-1.5 text-xs font-medium capitalize transition",
              tab === t ? "bg-white text-slate-900 shadow-sm" : "text-slate-500",
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "color" && (
        <div className="space-y-3">
          <label className="flex items-center justify-between text-xs text-slate-600">
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
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={String(style.backgroundColor ?? "#ffffff")}
                onChange={(e) => onChange("backgroundColor", e.target.value)}
                className="h-9 w-9 cursor-pointer rounded border border-slate-200"
              />
              <input
                value={String(style.backgroundColor ?? "")}
                onChange={(e) => onChange("backgroundColor", e.target.value)}
                placeholder="#ffffff"
                className="h-9 flex-1 rounded-md border border-slate-200 px-2 text-xs"
              />
            </div>
          )}
        </div>
      )}

      {tab === "image" && (
        <div className="space-y-2">
          <input
            value={String(style.backgroundImage ?? "")}
            onChange={(e) => onChange("backgroundImage", e.target.value)}
            placeholder="Image URL"
            className="h-9 w-full rounded-md border border-slate-200 px-2 text-xs"
          />
          <select
            value={String(style.backgroundSize ?? "cover")}
            onChange={(e) => onChange("backgroundSize", e.target.value)}
            className="h-9 w-full rounded-md border border-slate-200 px-2 text-xs"
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
          className="h-9 w-full rounded-md border border-slate-200 px-2 text-xs"
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
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <span className="text-xs text-slate-500">Angle</span>
        <input
          type="range"
          min={0}
          max={360}
          value={angle}
          onChange={(ev) => update(ev.target.value, start, end)}
          className="flex-1 accent-blue-600"
        />
        <span className="text-xs text-slate-600">{angle}°</span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <input type="color" value={start} onChange={(e) => update(angle, e.target.value, end)} className="h-9 w-full rounded border" />
        <input type="color" value={end} onChange={(e) => update(angle, start, e.target.value)} className="h-9 w-full rounded border" />
      </div>
      <div className="h-8 rounded-md border border-slate-200" style={{ background: value }} />
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
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-slate-600">Background blur</label>
        <span className="text-xs text-slate-500">{px}px</span>
      </div>
      <input
        type="range"
        min={0}
        max={40}
        value={px}
        onChange={(e) => onChange(`${e.target.value}px`)}
        className="w-full accent-blue-600"
      />
    </div>
  );
}
