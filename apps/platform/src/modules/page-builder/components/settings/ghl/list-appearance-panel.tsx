"use client";

import { useNode } from "@craftjs/core";
import { GHL_FIELD_LABEL, GHL_SECTION_CARD, GHL_SECTION_TITLE } from "@/modules/page-builder/lib/builder-panel-styles";
import { BUTTON_ICON_OPTIONS } from "@/modules/page-builder/lib/button-icons";
import type { ListMarkerStyle } from "@/modules/page-builder/lib/list-marker";
import type { BlockProps } from "@/modules/page-builder/types/block-props";
import { cn } from "@/lib/utils";

const MARKER_STYLE_OPTIONS: { value: ListMarkerStyle; label: string }[] = [
  { value: "disc", label: "Disc (default)" },
  { value: "check", label: "Check circle" },
  { value: "circle", label: "Circle" },
  { value: "star", label: "Star" },
  { value: "number", label: "Numbered" },
  { value: "none", label: "No marker" },
];

type ListAppearanceProps = BlockProps & {
  markerStyle?: ListMarkerStyle;
  markerIcon?: string;
  markerColor?: string;
  markerSize?: string;
  itemGap?: string;
};

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

export function ListAppearancePanel({ compact = false }: { compact?: boolean }) {
  const { markerStyle, markerIcon, markerColor, markerSize, itemGap, actions: { setProp } } = useNode(
    (node) => ({
      markerStyle: node.data.props.markerStyle as ListMarkerStyle | undefined,
      markerIcon: node.data.props.markerIcon as string | undefined,
      markerColor: node.data.props.markerColor as string | undefined,
      markerSize: node.data.props.markerSize as string | undefined,
      itemGap: node.data.props.itemGap as string | undefined,
    }),
  );

  function patch(partial: Partial<ListAppearanceProps>) {
    setProp((props: ListAppearanceProps) => {
      Object.assign(props, partial);
    });
  }

  return (
    <div className={cn(compact ? "space-y-2.5" : GHL_SECTION_CARD, !compact && "space-y-3")}>
      {!compact ? <p className={GHL_SECTION_TITLE}>Bullet list</p> : null}

      <div className="space-y-1">
        <label className={GHL_FIELD_LABEL}>Bullet style</label>
        <select
          className="h-8 w-full rounded-md border border-slate-200 bg-white px-2 text-[11px] text-slate-700"
          value={markerStyle ?? "disc"}
          onChange={(e) => patch({ markerStyle: e.target.value as ListMarkerStyle })}
        >
          {MARKER_STYLE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1">
        <label className={GHL_FIELD_LABEL}>Icon (Lucide or emoji)</label>
        <select
          className="h-8 w-full rounded-md border border-slate-200 bg-white px-2 text-[11px] text-slate-700"
          value={markerIcon ?? ""}
          onChange={(e) => patch({ markerIcon: e.target.value || undefined })}
        >
          <option value="">Default for style</option>
          {BUTTON_ICON_OPTIONS.filter((o) => o.name).map((opt) => (
            <option key={opt.name} value={opt.name}>
              {opt.label}
            </option>
          ))}
        </select>
        <input
          type="text"
          placeholder="Or emoji e.g. ✓"
          className="h-8 w-full rounded-md border border-slate-200 px-2 text-[11px]"
          value={markerIcon && !BUTTON_ICON_OPTIONS.some((o) => o.name === markerIcon) ? markerIcon : ""}
          onChange={(e) => patch({ markerIcon: e.target.value || undefined })}
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <label className={GHL_FIELD_LABEL}>Marker color</label>
          <input
            type="color"
            className="h-8 w-full cursor-pointer rounded border border-slate-200"
            value={normalizeHex(markerColor, "#22c55e")}
            onChange={(e) => patch({ markerColor: e.target.value })}
          />
        </div>
        <div className="space-y-1">
          <label className={GHL_FIELD_LABEL}>Marker size (px)</label>
          <input
            type="number"
            min={12}
            max={32}
            className="h-8 w-full rounded-md border border-slate-200 px-2 text-[11px]"
            value={markerSize?.replace("px", "") ?? ""}
            placeholder="Auto"
            onChange={(e) => patch({ markerSize: e.target.value ? `${e.target.value}px` : undefined })}
          />
        </div>
      </div>

      <div className="space-y-1">
        <label className={GHL_FIELD_LABEL}>Item spacing (px)</label>
        <input
          type="number"
          min={0}
          max={48}
          className="h-8 w-full rounded-md border border-slate-200 px-2 text-[11px]"
          value={itemGap?.replace("px", "") ?? "12"}
          onChange={(e) => patch({ itemGap: e.target.value ? `${e.target.value}px` : "12px" })}
        />
      </div>
    </div>
  );
}
