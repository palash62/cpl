import type { CSSProperties } from "react";
import type { BlockProps, Breakpoint, LayoutProps, TypographyProps } from "@/modules/page-builder/types/block-props";

export function normalizeCssLength(value: string): string {
  const trimmed = value.trim();
  if (!trimmed || trimmed === "0") return "0";
  if (/^-?[\d.]+(px|%|rem|em|vh|vw|ch|ex|vmin|vmax|cm|mm|in|pt|pc)$/i.test(trimmed)) return trimmed;
  if (/^auto$/i.test(trimmed)) return "auto";
  if (/^-?[\d.]+$/.test(trimmed)) return `${trimmed}px`;
  return trimmed;
}

export function expandSpacingShorthand(parts: string[]): [string, string, string, string] {
  const [a, b, c, d] = parts;
  if (parts.length === 1) return [a, a, a, a];
  if (parts.length === 2) return [a, b, a, b];
  if (parts.length === 3) return [a, b, c, b];
  return [a, b ?? "0", c ?? "0", d ?? "0"];
}

export function normalizeSpacing(shorthand: string): string {
  const parts = shorthand.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "";
  return expandSpacingShorthand(parts.map(normalizeCssLength)).join(" ");
}

function resolveTextAlign(
  layout?: LayoutProps,
  typography?: TypographyProps,
): CSSProperties["textAlign"] | undefined {
  if (typography?.textAlign) return typography.textAlign;
  if (layout?.textAlign) {
    const align = layout.textAlign;
    if (align === "flex-start") return "left";
    if (align === "flex-end") return "right";
    return align as CSSProperties["textAlign"];
  }
  const justify = layout?.justifyContent;
  if (justify === "flex-start") return "left";
  if (justify === "flex-end") return "right";
  if (justify === "center") return "center";
  return undefined;
}

function resolveBlockAlign(layout?: LayoutProps): "left" | "center" | "right" | undefined {
  if (layout?.blockAlign) return layout.blockAlign;
  if (layout?.justifyContent === "center") return "center";
  if (layout?.justifyContent === "flex-end") return "right";
  if (layout?.justifyContent === "flex-start") return "left";
  if (layout?.textAlign === "center") return "center";
  if (layout?.textAlign === "right" || layout?.textAlign === "end") return "right";
  if (layout?.textAlign === "left" || layout?.textAlign === "start") return "left";
  return undefined;
}

function shouldApplyBlockAlignment(width?: string): boolean {
  if (!width) return false;
  const w = width.trim();
  return w !== "100%" && w !== "auto";
}

function toHorizontalBlockAlign(
  align: CSSProperties["textAlign"] | undefined,
): "left" | "center" | "right" | undefined {
  if (!align) return undefined;
  if (align === "center") return "center";
  if (align === "right" || align === "end") return "right";
  if (align === "left" || align === "start") return "left";
  return undefined;
}

function applyHorizontalBlockAlignment(
  style: CSSProperties,
  align: "left" | "center" | "right",
  marginShorthand: string,
) {
  const [top, right, bottom, left] = expandSpacingShorthand(
    marginShorthand.split(/\s+/).map(normalizeCssLength),
  );

  if (align === "center") {
    style.marginTop = top;
    style.marginRight = "auto";
    style.marginBottom = bottom;
    style.marginLeft = "auto";
  } else if (align === "right") {
    style.marginTop = top;
    style.marginRight = right;
    style.marginBottom = bottom;
    style.marginLeft = "auto";
  } else {
    style.marginTop = top;
    style.marginRight = right;
    style.marginBottom = bottom;
    style.marginLeft = left;
  }
}

export function mergeBlockStyles(
  props: BlockProps,
  breakpoint: Breakpoint = "desktop",
): CSSProperties {
  const base = blockPropsToStyle(props);
  const override = props.responsive?.[breakpoint];
  if (!override) return base;

  if (override.visible === false) {
    return { ...base, display: "none" };
  }

  return {
    ...base,
    ...blockPropsToStyle({
      typography: override.typography,
      layout: override.layout,
      style: override.style,
    }),
  };
}

export function blockPropsToStyle(props: Partial<BlockProps>): CSSProperties {
  const style: CSSProperties = {};
  const t = props.typography;
  const l = props.layout;
  const s = props.style;

  if (t?.fontFamily) style.fontFamily = t.fontFamily;
  if (t?.fontSize) style.fontSize = normalizeCssLength(t.fontSize);
  if (t?.fontWeight) style.fontWeight = t.fontWeight;
  if (t?.color) style.color = t.color;
  if (t?.letterSpacing) {
    const spacing = t.letterSpacing.trim();
    style.letterSpacing = spacing === "normal" ? spacing : normalizeCssLength(spacing);
  }
  if (t?.lineHeight) {
    const lh = t.lineHeight.trim();
    // Unitless multipliers (e.g. 1.5) must stay unitless; lengths get normalized.
    style.lineHeight = /^-?[\d.]+$/.test(lh) ? lh : normalizeCssLength(lh);
  }

  const textAlign = resolveTextAlign(l, t);
  if (textAlign) style.textAlign = textAlign;
  const blockAlign = resolveBlockAlign(l) ?? toHorizontalBlockAlign(textAlign);

  if (l?.width) style.width = l.width;
  if (l?.height) style.height = l.height;
  if (l?.gap) style.gap = normalizeCssLength(l.gap);
  if (l?.flexDirection) style.flexDirection = l.flexDirection;
  if (l?.justifyContent) style.justifyContent = l.justifyContent;
  if (l?.alignItems) style.alignItems = l.alignItems;
  if (l?.display) style.display = l.display;
  if (l?.maxWidth) style.maxWidth = l.maxWidth;
  if (l?.minHeight) style.minHeight = l.minHeight;
  if (l?.gridTemplateColumns) style.gridTemplateColumns = l.gridTemplateColumns;
  if (l?.flexWrap) style.flexWrap = l.flexWrap as CSSProperties["flexWrap"];
  if (l?.aspectRatio) style.aspectRatio = l.aspectRatio;

  const normalizedMargin = l?.margin ? normalizeSpacing(l.margin) : undefined;
  const normalizedPadding = l?.padding ? normalizeSpacing(l.padding) : undefined;

  if (shouldApplyBlockAlignment(l?.width) && blockAlign) {
    applyHorizontalBlockAlignment(style, blockAlign, normalizedMargin ?? "0");
  } else if (normalizedMargin) {
    style.margin = normalizedMargin;
  }

  if (normalizedPadding) style.padding = normalizedPadding;

  if (s?.backgroundColor) style.backgroundColor = s.backgroundColor;
  if (s?.backgroundImage) style.backgroundImage = `url(${s.backgroundImage})`;
  if (s?.backgroundGradient) style.background = s.backgroundGradient;
  if (s?.backgroundSize) style.backgroundSize = s.backgroundSize;
  if (s?.backgroundPosition) style.backgroundPosition = s.backgroundPosition;
  if (s?.backgroundRepeat) style.backgroundRepeat = s.backgroundRepeat;
  if (s?.backdropFilter) style.backdropFilter = s.backdropFilter;
  if (s?.filter) style.filter = s.filter;
  if (s?.border) style.border = s.border;
  if (s?.borderRadius) style.borderRadius = s.borderRadius;
  if (s?.boxShadow) style.boxShadow = s.boxShadow;
  if (s?.opacity !== undefined) style.opacity = s.opacity;

  return style;
}

export const BREAKPOINT_WIDTHS: Record<Breakpoint, number> = {
  desktop: 1280,
  tablet: 768,
  mobile: 375,
};
