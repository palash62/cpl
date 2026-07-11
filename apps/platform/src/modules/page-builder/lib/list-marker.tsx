import type { CSSProperties } from "react";
import { Check, Circle, Star } from "lucide-react";
import { resolveButtonIcon } from "@/modules/page-builder/lib/button-icons";
import { cn } from "@/lib/utils";

export type ListMarkerStyle = "disc" | "check" | "circle" | "star" | "number" | "none";

export function usesFlexListMarkers(markerStyle: ListMarkerStyle | undefined, ordered: boolean): boolean {
  if (ordered && markerStyle === "number") return true;
  if (!markerStyle || markerStyle === "disc") return false;
  return true;
}

export function listAlignItemsFromTextAlign(
  align?: string,
): NonNullable<CSSProperties["alignItems"]> {
  if (align === "center") return "center";
  if (align === "right" || align === "end") return "flex-end";
  return "flex-start";
}

export function parseMarkerSizePx(markerSize: string | undefined, fontSize?: string): number {
  if (markerSize?.trim()) {
    const match = markerSize.trim().match(/^([\d.]+)/);
    if (match) return Math.max(12, Math.min(32, Math.round(Number(match[1]))));
  }
  const fontMatch = fontSize?.match(/^([\d.]+)/);
  const base = fontMatch ? Number(fontMatch[1]) : 16;
  return Math.max(14, Math.min(28, Math.round(base * 0.95)));
}

type ListMarkerProps = {
  style: ListMarkerStyle;
  icon?: string;
  color?: string;
  sizePx: number;
  index?: number;
  ordered?: boolean;
};

export function ListMarker({ style, icon, color, sizePx, index = 0, ordered }: ListMarkerProps) {
  const resolvedIcon = icon ? resolveButtonIcon(icon) : null;

  if (style === "none") {
    return <span className="inline-block shrink-0" style={{ width: sizePx }} aria-hidden />;
  }

  if (resolvedIcon) {
    const Icon = resolvedIcon;
    return (
      <span
        className="inline-flex shrink-0 items-center justify-center"
        style={{ width: sizePx, height: sizePx, color: color ?? "currentColor" }}
        aria-hidden
      >
        <Icon size={Math.round(sizePx * 0.75)} />
      </span>
    );
  }

  if (style === "check") {
    return (
      <span
        className="inline-flex shrink-0 items-center justify-center rounded-full"
        style={{
          width: sizePx,
          height: sizePx,
          backgroundColor: color ?? "currentColor",
          color: "#fff",
        }}
        aria-hidden
      >
        <Check size={Math.round(sizePx * 0.55)} strokeWidth={3} />
      </span>
    );
  }

  if (style === "circle") {
    return (
      <span
        className="inline-flex shrink-0 items-center justify-center"
        style={{ color: color ?? "currentColor" }}
        aria-hidden
      >
        <Circle size={Math.round(sizePx * 0.45)} fill="currentColor" strokeWidth={0} />
      </span>
    );
  }

  if (style === "star") {
    return (
      <span
        className="inline-flex shrink-0 items-center justify-center"
        style={{ color: color ?? "currentColor" }}
        aria-hidden
      >
        <Star size={Math.round(sizePx * 0.7)} fill="currentColor" strokeWidth={0} />
      </span>
    );
  }

  if (style === "number" || (ordered && style !== "disc")) {
    return (
      <span
        className={cn(
          "inline-flex shrink-0 items-center justify-center rounded-full text-[0.75em] font-semibold",
        )}
        style={{
          width: sizePx,
          height: sizePx,
          backgroundColor: color ?? "currentColor",
          color: "#fff",
        }}
        aria-hidden
      >
        {index + 1}
      </span>
    );
  }

  if (icon && icon.length <= 2) {
    return (
      <span
        className="inline-flex shrink-0 items-center justify-center"
        style={{ width: sizePx, fontSize: Math.round(sizePx * 0.85), color: color ?? "currentColor" }}
        aria-hidden
      >
        {icon}
      </span>
    );
  }

  return (
    <span
      className="inline-block shrink-0 rounded-full"
      style={{
        width: Math.round(sizePx * 0.35),
        height: Math.round(sizePx * 0.35),
        marginTop: Math.round(sizePx * 0.35),
        backgroundColor: color ?? "currentColor",
      }}
      aria-hidden
    />
  );
}
