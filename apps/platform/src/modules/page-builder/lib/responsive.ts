import type { CSSProperties } from "react";
import type { BlockProps, Breakpoint, LayoutProps, TypographyProps } from "@/modules/page-builder/types/block-props";
import { getCanvasViewportFill } from "@/modules/page-builder/lib/editor-canvas";

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

export function isFullWidthLayout(width?: string): boolean {
  if (!width) return true;
  const w = width.trim();
  return w === "100%" || w === "auto";
}

function shouldApplyBlockAlignment(width?: string): boolean {
  return !isFullWidthLayout(width);
}

/** Whether GHL Align should drive typography.textAlign (full-width text blocks). */
export function shouldUseTextAlignForGhlAlign(
  displayName: string,
  width?: string,
  textBlockNames?: ReadonlySet<string>,
): boolean {
  const names = textBlockNames ?? new Set(["Heading", "Paragraph", "List"]);
  return names.has(displayName) && isFullWidthLayout(width);
}

export function resolveGhlAlignDisplay(
  typography?: TypographyProps,
  layout?: LayoutProps,
  width?: string,
): "left" | "center" | "right" {
  if (isFullWidthLayout(width)) {
    const textAlign = typography?.textAlign ?? resolveTextAlign(layout, typography);
    if (textAlign === "center") return "center";
    if (textAlign === "right" || textAlign === "end") return "right";
    return "left";
  }
  return (
    layout?.blockAlign
    ?? toHorizontalBlockAlign(resolveTextAlign(layout, typography))
    ?? "left"
  );
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
  const scaledProps = applyBreakpointTypographyScale(props, breakpoint);
  const base = blockPropsToStyle(scaledProps);
  const override = scaledProps.responsive?.[breakpoint];
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

const STRETCH_LAYOUT_VALUES = new Set([
  "100%",
  "100vh",
  "100dvh",
  "720px",
  "400px",
  "600px",
  "640px",
]);

export function isStretchLayoutValue(value: string): boolean {
  const normalized = value.trim().toLowerCase();
  if (STRETCH_LAYOUT_VALUES.has(normalized)) return true;
  return normalized.includes("calc(100");
}

export function shouldStretchPublishedWrapper(layout?: LayoutProps): boolean {
  const width = layout?.width?.trim();
  return width === "100%";
}

type ResponsiveBucket = "typography" | "layout" | "style";

export function seedBreakpointOverridesBeforeDesktopEdit(
  props: BlockProps,
  bucket: ResponsiveBucket,
  key: PropertyKey,
): void {
  const keyStr = String(key);
  const baseValue = (props[bucket] as Record<string, unknown> | undefined)?.[keyStr];
  if (baseValue === undefined) return;

  for (const bp of ["tablet", "mobile"] as const) {
    const existing = props.responsive?.[bp]?.[bucket] as Record<string, unknown> | undefined;
    if (existing?.[keyStr] !== undefined) continue;

    props.responsive = {
      ...(props.responsive ?? {}),
      [bp]: {
        ...(props.responsive?.[bp] ?? {}),
        [bucket]: { ...(existing ?? {}), [keyStr]: baseValue },
      },
    };
  }
}

export function resolveTypographyForBreakpoint(
  props: BlockProps,
  breakpoint: Breakpoint,
): TypographyProps {
  const scaled = applyBreakpointTypographyScale(props, breakpoint);
  const base = scaled.typography ?? {};
  if (breakpoint === "desktop") return base;
  return { ...base, ...(scaled.responsive?.[breakpoint]?.typography ?? {}) };
}

export function resolveFullWidthForBreakpoint(
  props: { fullWidth?: boolean; responsive?: BlockProps["responsive"] },
  breakpoint: Breakpoint,
): boolean {
  if (breakpoint !== "desktop") {
    const override = props.responsive?.[breakpoint]?.fullWidth;
    if (override !== undefined) return Boolean(override);
  }
  return Boolean(props.fullWidth);
}

function seedFullWidthBeforeDesktopEdit(props: BlockProps & { fullWidth?: boolean }): void {
  if (props.fullWidth === undefined) return;

  for (const bp of ["tablet", "mobile"] as const) {
    const existing = props.responsive?.[bp];
    if (existing?.fullWidth !== undefined) continue;

    props.responsive = {
      ...(props.responsive ?? {}),
      [bp]: { ...(existing ?? {}), fullWidth: props.fullWidth },
    };
  }
}

export function setFullWidthAtBreakpoint(
  setProp: (cb: (props: BlockProps & { fullWidth?: boolean }) => void) => void,
  value: boolean,
  breakpoint: Breakpoint,
): void {
  setProp((props) => {
    if (breakpoint === "desktop") {
      seedFullWidthBeforeDesktopEdit(props);
      props.fullWidth = value;
      return;
    }
    props.responsive = {
      ...(props.responsive ?? {}),
      [breakpoint]: {
        ...(props.responsive?.[breakpoint] ?? {}),
        fullWidth: value,
      },
    };
  });
}

export function withoutStretchLayout(layout?: LayoutProps): LayoutProps | undefined {
  if (!layout) return undefined;

  const next = { ...layout };
  if (next.minHeight && isStretchLayoutValue(next.minHeight)) {
    delete next.minHeight;
  }
  if (next.height && isStretchLayoutValue(next.height)) {
    delete next.height;
  }

  return Object.keys(next).length > 0 ? next : undefined;
}

/** @deprecated Use getCanvasViewportFill from editor-canvas.ts */
export function getEditorViewportFill(isGhl: boolean, breakpoint: Breakpoint): string {
  return getCanvasViewportFill(breakpoint, isGhl);
}

export function resolveColumnsGrid(
  columns: number,
  breakpoint: Breakpoint,
  responsive?: BlockProps["responsive"],
): string {
  const override = responsive?.[breakpoint]?.layout?.gridTemplateColumns;
  if (override) return override;
  if (breakpoint === "mobile") return "1fr";
  if (breakpoint === "tablet" && columns > 2) return "repeat(2, 1fr)";
  return `repeat(${columns}, 1fr)`;
}

const DEFAULT_SECTION_PADDING = "40px 20px";

/** Published section shell — top-aligned, no duplicate viewport min-height. */
export function publishedSectionLayout(sanitizedLayout: LayoutProps): LayoutProps {
  return {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "flex-start",
    width: "100%",
    boxSizing: "border-box",
    ...sanitizedLayout,
  };
}

export function resolveSectionPadding(
  layout: LayoutProps | undefined,
  breakpoint: Breakpoint,
  responsive?: BlockProps["responsive"],
): LayoutProps | undefined {
  if (responsive?.[breakpoint]?.layout?.padding) return layout;
  const padding = layout?.padding ?? DEFAULT_SECTION_PADDING;
  if (padding !== DEFAULT_SECTION_PADDING) return layout;
  const inline =
    breakpoint === "mobile" ? "12px" : breakpoint === "tablet" ? "16px" : "20px";
  return { ...layout, padding: `40px ${inline}` };
}

function parseFontSizePx(fontSize: string): number | null {
  const normalized = fontSize.trim().toLowerCase();
  const pxMatch = normalized.match(/^([\d.]+)px$/);
  if (pxMatch) return Number(pxMatch[1]);
  const remMatch = normalized.match(/^([\d.]+)rem$/);
  if (remMatch) return Number(remMatch[1]) * 16;
  const bareMatch = normalized.match(/^([\d.]+)$/);
  if (bareMatch) return Number(bareMatch[1]);
  return null;
}

function scaleFontSizeForBreakpoint(fontSize: string, breakpoint: Breakpoint): string {
  if (breakpoint !== "mobile" && breakpoint !== "tablet") return fontSize;
  const px = parseFontSizePx(fontSize);
  if (px === null) return fontSize;
  const factor = breakpoint === "mobile" ? 0.75 : 0.88;
  return `${Math.round(px * factor)}px`;
}

function applyBreakpointTypographyScale(
  props: BlockProps,
  breakpoint: Breakpoint,
): BlockProps {
  if (breakpoint === "desktop" || props.responsive?.[breakpoint]?.typography?.fontSize) {
    return props;
  }

  const fontSize = props.typography?.fontSize;
  if (!fontSize) return props;

  return {
    ...props,
    typography: {
      ...props.typography,
      fontSize: scaleFontSizeForBreakpoint(fontSize, breakpoint),
    },
  };
}
