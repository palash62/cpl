"use client";

import { useNode } from "@craftjs/core";
import { GHL_FIELD_LABEL, GHL_SECTION_CARD, GHL_SECTION_TITLE } from "@/modules/page-builder/lib/builder-panel-styles";
import { BUTTON_ICON_OPTIONS } from "@/modules/page-builder/lib/button-icons";
import { ColorField } from "@/modules/page-builder/components/settings/ghl/controls";
import type { ButtonAppearanceProps, BlockProps } from "@/modules/page-builder/types/block-props";
import { cn } from "@/lib/utils";

const SHADOW_PRESETS: { label: string; value: string }[] = [
  { label: "None", value: "" },
  { label: "Soft", value: "0 2px 8px rgba(15, 23, 42, 0.08)" },
  { label: "Medium", value: "0 4px 16px rgba(15, 23, 42, 0.12)" },
  { label: "Strong", value: "0 8px 24px rgba(15, 23, 42, 0.18)" },
];

const RADIUS_PRESETS = ["0", "4px", "8px", "12px", "999px"];

function normalizeHex(value: string | undefined, fallback: string): string {
  if (!value) return fallback;
  const t = value.trim();
  if (/^#[0-9a-fA-F]{6}$/.test(t)) return t;
  if (/^#[0-9a-fA-F]{3}$/.test(t)) {
    const [, r, g, b] = t;
    return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
  }
  return fallback;
}

export function ButtonAppearancePanel() {
  const { appearance, actions: { setProp } } = useNode((node) => ({
    appearance: (node.data.props.buttonAppearance ?? {}) as ButtonAppearanceProps,
  }));

  const a = appearance ?? {};

  function patch(partial: Partial<ButtonAppearanceProps>) {
    setProp((props: BlockProps) => {
      props.buttonAppearance = { ...(props.buttonAppearance as ButtonAppearanceProps ?? {}), ...partial };
    });
  }

  function clearAppearanceKey(key: keyof ButtonAppearanceProps) {
    setProp((props: BlockProps) => {
      const next = { ...(props.buttonAppearance as ButtonAppearanceProps ?? {}) };
      delete next[key];
      props.buttonAppearance = next;
    });
  }

  function setBorder(width: string, style: string, color: string) {
    if (!width || width === "0") {
      clearAppearanceKey("border");
      return;
    }
    patch({ border: `${width}px ${style} ${color}` });
  }

  const borderMatch = (a.border ?? "").match(/^(\d+)px\s+(\w+)\s+(#.+|rgb.+|[a-z]+)$/i);
  const borderWidth = borderMatch?.[1] ?? "0";
  const borderStyle = borderMatch?.[2] ?? "solid";
  const borderColor = borderMatch?.[3] ?? "#6366f1";

  return (
    <div className={cn(GHL_SECTION_CARD, "space-y-3")}>
      <p className={GHL_SECTION_TITLE}>Button appearance</p>

      <div className="space-y-2">
        <ColorField
          label="Background"
          value={a.backgroundColor ?? ""}
          onChange={(v) => (v.trim() ? patch({ backgroundColor: v }) : clearAppearanceKey("backgroundColor"))}
          onClear={() => clearAppearanceKey("backgroundColor")}
          placeholder="#6366f1"
          fallbackHex="#6366f1"
        />
        <ColorField
          label="Text color"
          value={a.textColor ?? ""}
          onChange={(v) => (v.trim() ? patch({ textColor: v }) : clearAppearanceKey("textColor"))}
          onClear={() => clearAppearanceKey("textColor")}
          placeholder="#ffffff"
          fallbackHex="#ffffff"
        />
      </div>

      <div className="space-y-1.5">
        <label className={GHL_FIELD_LABEL}>Border</label>
        <div className="flex gap-1.5">
          <input
            type="number"
            min={0}
            max={8}
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
            value={normalizeHex(borderColor, "#6366f1")}
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
              onClick={() => patch({ borderRadius: r === "0" ? "0" : r })}
              className={cn(
                "rounded px-2 py-1 text-[10px] font-medium",
                (a.borderRadius ?? "") === r || (!a.borderRadius && r === "8px")
                  ? "bg-blue-100 text-blue-700"
                  : "bg-slate-100 text-slate-600",
              )}
            >
              {r === "999px" ? "Pill" : r}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-1">
        <label className={GHL_FIELD_LABEL}>Shadow</label>
        <div className="flex flex-wrap gap-1">
          {SHADOW_PRESETS.map((p) => (
            <button
              key={p.label}
              type="button"
              onClick={() => patch({ boxShadow: p.value || undefined })}
              className={cn(
                "rounded px-2 py-1 text-[10px] font-medium",
                (a.boxShadow ?? "") === p.value ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-600",
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
        <input
          type="text"
          placeholder="Custom shadow CSS"
          value={a.boxShadow ?? ""}
          onChange={(e) => patch({ boxShadow: e.target.value || undefined })}
          className="h-8 w-full rounded-md border border-slate-200 px-2 text-xs"
        />
      </div>

      <div className="space-y-1">
        <label className={GHL_FIELD_LABEL}>Icon</label>
        <select
          value={a.icon ?? ""}
          onChange={(e) => patch({ icon: e.target.value || undefined })}
          className="h-8 w-full rounded-md border border-slate-200 px-2 text-xs"
        >
          {BUTTON_ICON_OPTIONS.map((opt) => (
            <option key={opt.name || "none"} value={opt.name}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {a.icon ? (
        <div className="space-y-1">
          <label className={GHL_FIELD_LABEL}>Icon position</label>
          <div className="flex gap-1">
            {(["left", "right"] as const).map((pos) => (
              <button
                key={pos}
                type="button"
                onClick={() => patch({ iconPosition: pos })}
                className={cn(
                  "flex-1 rounded-md border py-1.5 text-[11px] font-medium capitalize",
                  (a.iconPosition ?? "left") === pos
                    ? "border-blue-200 bg-blue-50 text-blue-700"
                    : "border-slate-200 text-slate-600",
                )}
              >
                {pos}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <div className="space-y-1">
        <label className={GHL_FIELD_LABEL}>Hover animation</label>
        <select
          value={a.hoverEffect ?? "none"}
          onChange={(e) =>
            patch({ hoverEffect: e.target.value as ButtonAppearanceProps["hoverEffect"] })
          }
          className="h-8 w-full rounded-md border border-slate-200 px-2 text-xs"
        >
          <option value="none">None</option>
          <option value="pulse">Pulse</option>
          <option value="lift">Lift</option>
          <option value="glow">Glow</option>
          <option value="shimmer">Shimmer</option>
        </select>
      </div>
    </div>
  );
}
