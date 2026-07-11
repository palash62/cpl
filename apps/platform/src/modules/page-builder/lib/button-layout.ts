import type { CSSProperties } from "react";

export type ButtonLegacySize = "small" | "medium" | "large" | "full";

export function parseButtonFontSizePx(
  value: string | undefined,
  legacySize?: ButtonLegacySize,
): number {
  if (value) {
    const trimmed = value.trim();
    if (trimmed.endsWith("rem")) {
      const n = parseFloat(trimmed);
      if (Number.isFinite(n)) return Math.min(48, Math.max(12, Math.round(n * 16)));
    }
    const n = parseFloat(trimmed);
    if (Number.isFinite(n)) return Math.min(48, Math.max(12, Math.round(n)));
  }
  if (legacySize === "small") return 14;
  if (legacySize === "large") return 20;
  return 16;
}

export function buttonIconSizePx(fontSizePx: number): number {
  return Math.max(14, Math.round(fontSizePx * 0.95));
}

type BuildButtonLayoutStyleOptions = {
  fontSizePx: number;
  fullWidth?: boolean;
  baseStyle?: CSSProperties;
  /** When true, sets cursor: default (editor canvas). */
  editorMode?: boolean;
  /** When true, sets textDecoration: none (CTA links). */
  asLink?: boolean;
};

export function buildButtonLayoutStyle({
  fontSizePx,
  fullWidth = false,
  baseStyle,
  editorMode = false,
  asLink = false,
}: BuildButtonLayoutStyleOptions): CSSProperties {
  const padY = Math.max(8, Math.round(fontSizePx * 0.55));
  const padX = Math.max(12, Math.round(fontSizePx * 1.35));

  return {
    ...baseStyle,
    fontSize: `${fontSizePx}px`,
    lineHeight: 1.25,
    padding: `${padY}px ${padX}px`,
    display: fullWidth ? "flex" : "inline-flex",
    width: fullWidth ? "100%" : "auto",
    maxWidth: "100%",
    alignItems: "center",
    justifyContent: "center",
    boxSizing: "border-box",
    ...(asLink ? { textDecoration: "none" } : {}),
    ...(editorMode ? { cursor: "default" } : {}),
  };
}
