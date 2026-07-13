import type { CSSProperties } from "react";
import type {
  BlockProps,
  Breakpoint,
  LayoutProps,
  StyleProps,
  TypographyProps,
} from "@/modules/page-builder/types/block-props";
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

export type EffectiveBlockPropsContext = {
  blockType?: string;
};

export type EffectiveBlockProps = {
  typography?: TypographyProps;
  layout?: LayoutProps;
  style?: StyleProps;
  visible?: boolean;
  fullWidth?: boolean;
};

const SPACING_SCALE: Record<Breakpoint, number> = {
  desktop: 1,
  tablet: 0.85,
  mobile: 0.7,
};

const FULL_WIDTH_MOBILE_BLOCKS = new Set([
  "CTA Button",
  "Submit Button",
  "Lead Form",
]);


function scaleSpacingValue(value: string, factor: number): string {
  const trimmed = value.trim();
  if (!trimmed || trimmed === "0" || trimmed === "auto") return trimmed;
  const px = parseFontSizePx(trimmed);
  if (px === null) return trimmed;
  if (!/^-?[\d.]+px$/i.test(normalizeCssLength(trimmed)) && !/^-?[\d.]+$/.test(trimmed)) {
    return trimmed;
  }
  return `${Math.max(0, Math.round(px * factor))}px`;
}

function scaleSpacingShorthand(shorthand: string, factor: number): string {
  const parts = shorthand.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return shorthand;
  return expandSpacingShorthand(parts.map((part) => scaleSpacingValue(part, factor))).join(" ");
}

function autoWidthForBreakpoint(
  width: string | undefined,
  breakpoint: Breakpoint,
): Pick<LayoutProps, "width" | "maxWidth"> {
  if (breakpoint === "desktop" || !width) return {};
  const normalized = width.trim();
  if (normalized === "100%" || normalized === "auto") return {};
  const pxMatch = normalized.match(/^([\d.]+)px$/i);
  if (pxMatch) return { width: "100%", maxWidth: "100%" };
  const pctMatch = normalized.match(/^([\d.]+)%$/);
  if (pctMatch && Number(pctMatch[1]) < 100) return { width: "100%", maxWidth: "100%" };
  return {};
}

function computeAutoTypography(
  typography: TypographyProps | undefined,
  breakpoint: Breakpoint,
): TypographyProps | undefined {
  if (!typography || breakpoint === "desktop") return typography;
  const fontSize = typography.fontSize;
  if (!fontSize) return typography;
  return { ...typography, fontSize: scaleFontSizeForBreakpoint(fontSize, breakpoint) };
}

function computeAutoLayout(
  layout: LayoutProps | undefined,
  breakpoint: Breakpoint,
  context?: EffectiveBlockPropsContext,
): LayoutProps | undefined {
  if (!layout || breakpoint === "desktop") return layout;

  const factor = SPACING_SCALE[breakpoint];
  const next: LayoutProps = { ...layout };

  if (next.padding) next.padding = scaleSpacingShorthand(next.padding, factor);
  if (next.margin) next.margin = scaleSpacingShorthand(next.margin, factor);
  if (next.gap) next.gap = scaleSpacingValue(next.gap, factor);

  Object.assign(next, autoWidthForBreakpoint(next.width, breakpoint));

  if (breakpoint === "mobile" && next.flexDirection === "row") {
    next.flexDirection = "column";
  }

  if (context?.blockType === "Section") {
    return resolveSectionPadding(next, breakpoint, undefined) ?? next;
  }

  if (context?.blockType === "Image") {
    next.maxWidth = next.maxWidth ?? "100%";
    if (next.width && next.width !== "100%") next.width = "100%";
    if (next.height?.trim().endsWith("px")) next.height = "auto";
  }

  return next;
}

function computeAutoFullWidth(
  props: BlockProps & { fullWidth?: boolean },
  breakpoint: Breakpoint,
  context?: EffectiveBlockPropsContext,
): boolean | undefined {
  if (breakpoint === "mobile" && context?.blockType && FULL_WIDTH_MOBILE_BLOCKS.has(context.blockType)) {
    return true;
  }
  return props.fullWidth;
}

export function computeAutoEffectiveBlockProps(
  props: BlockProps & { fullWidth?: boolean },
  breakpoint: Breakpoint,
  context?: EffectiveBlockPropsContext,
): EffectiveBlockProps {
  if (breakpoint === "desktop") {
    return {
      typography: props.typography,
      layout: props.layout,
      style: props.style,
      visible: props.visible,
      fullWidth: props.fullWidth,
    };
  }

  return {
    typography: computeAutoTypography(props.typography, breakpoint),
    layout: computeAutoLayout(props.layout, breakpoint, context),
    style: props.style,
    visible: props.visible,
    fullWidth: computeAutoFullWidth(props, breakpoint, context),
  };
}

export function resolveEffectiveBlockProps(
  props: BlockProps & { fullWidth?: boolean },
  breakpoint: Breakpoint,
  context?: EffectiveBlockPropsContext,
): EffectiveBlockProps {
  const auto = computeAutoEffectiveBlockProps(props, breakpoint, context);
  const override = props.responsive?.[breakpoint];
  if (!override) return auto;

  return {
    typography: { ...(auto.typography ?? {}), ...(override.typography ?? {}) },
    layout: { ...(auto.layout ?? {}), ...(override.layout ?? {}) },
    style: { ...(auto.style ?? {}), ...(override.style ?? {}) },
    visible: override.visible !== undefined ? override.visible : auto.visible,
    fullWidth: override.fullWidth !== undefined ? override.fullWidth : auto.fullWidth,
  };
}

export function resolveEffectiveLayout(
  props: BlockProps,
  breakpoint: Breakpoint,
  context?: EffectiveBlockPropsContext,
): LayoutProps | undefined {
  return resolveEffectiveBlockProps(props, breakpoint, context).layout;
}

export function resolveEffectiveTypography(
  props: BlockProps,
  breakpoint: Breakpoint,
  context?: EffectiveBlockPropsContext,
): TypographyProps | undefined {
  return resolveEffectiveBlockProps(props, breakpoint, context).typography;
}

export function resolveEffectiveStyle(
  props: BlockProps,
  breakpoint: Breakpoint,
  context?: EffectiveBlockPropsContext,
): StyleProps | undefined {
  return resolveEffectiveBlockProps(props, breakpoint, context).style;
}

export function hasResponsiveOverrides(
  props: BlockProps,
  breakpoint: Breakpoint,
): boolean {
  const override = props.responsive?.[breakpoint];
  if (!override) return false;
  return Boolean(
    override.typography && Object.keys(override.typography).length > 0
    || override.layout && Object.keys(override.layout).length > 0
    || override.style && Object.keys(override.style).length > 0
    || override.visible !== undefined
    || override.fullWidth !== undefined,
  );
}

export function clearResponsiveOverridesAtBreakpoint(
  props: BlockProps,
  breakpoint: Breakpoint,
): void {
  if (!props.responsive?.[breakpoint]) return;
  const next = { ...props.responsive };
  delete next[breakpoint];
  props.responsive = Object.keys(next).length > 0 ? next : undefined;
}

function valuesEqual(a: unknown, b: unknown): boolean {
  return JSON.stringify(a ?? null) === JSON.stringify(b ?? null);
}

function stripBucketOverrides<T extends Record<string, unknown>>(
  overrideBucket: T | undefined,
  autoBucket: T | undefined,
): T | undefined {
  if (!overrideBucket) return undefined;
  const next = { ...overrideBucket };
  for (const key of Object.keys(next)) {
    if (valuesEqual(next[key], autoBucket?.[key])) {
      delete next[key];
    }
  }
  return Object.keys(next).length > 0 ? next : undefined;
}

export function stripRedundantResponsiveOverrides(
  props: BlockProps & { fullWidth?: boolean },
  blockType?: string,
): BlockProps & { fullWidth?: boolean } {
  if (!props.responsive) return props;

  const next: BlockProps & { fullWidth?: boolean } = { ...props, responsive: { ...props.responsive } };
  const context = blockType ? { blockType } : undefined;

  for (const breakpoint of ["tablet", "mobile"] as const) {
    const override = next.responsive?.[breakpoint];
    if (!override) continue;

    const auto = computeAutoEffectiveBlockProps(
      { ...props, responsive: undefined },
      breakpoint,
      context,
    );

    const strippedTypography = stripBucketOverrides(override.typography, auto.typography);
    const strippedLayout = stripBucketOverrides(override.layout, auto.layout);
    const strippedStyle = stripBucketOverrides(override.style, auto.style);

    const strippedOverride = {
      ...(strippedTypography ? { typography: strippedTypography } : {}),
      ...(strippedLayout ? { layout: strippedLayout } : {}),
      ...(strippedStyle ? { style: strippedStyle } : {}),
      ...(override.visible !== undefined && !valuesEqual(override.visible, auto.visible)
        ? { visible: override.visible }
        : {}),
      ...(override.fullWidth !== undefined && !valuesEqual(override.fullWidth, auto.fullWidth)
        ? { fullWidth: override.fullWidth }
        : {}),
    };

    if (Object.keys(strippedOverride).length === 0) {
      delete next.responsive![breakpoint];
    } else {
      next.responsive![breakpoint] = strippedOverride;
    }
  }

  if (next.responsive && Object.keys(next.responsive).length === 0) {
    delete next.responsive;
  }

  return next;
}

export function mergeBlockStyles(
  props: BlockProps,
  breakpoint: Breakpoint = "desktop",
  context?: EffectiveBlockPropsContext,
): CSSProperties {
  const effective = resolveEffectiveBlockProps(props, breakpoint, context);

  if (effective.visible === false) {
    return { display: "none" };
  }

  return blockPropsToStyle({
    typography: effective.typography,
    layout: effective.layout,
    style: effective.style,
  });
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

export function parseBackdropBlurPx(backdropFilter?: string): number {
  if (!backdropFilter) return 0;
  const match = backdropFilter.match(/blur\(\s*(\d+(?:\.\d+)?)\s*px\s*\)/i);
  return match ? parseFloat(match[1]) : 0;
}

function parseBackgroundColorRgb(color: string): { r: number; g: number; b: number; a?: number } | null {
  const trimmed = color.trim();
  const hexMatch = trimmed.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (hexMatch) {
    let hex = hexMatch[1];
    if (hex.length === 3) {
      hex = hex
        .split("")
        .map((ch) => ch + ch)
        .join("");
    }
    return {
      r: parseInt(hex.slice(0, 2), 16),
      g: parseInt(hex.slice(2, 4), 16),
      b: parseInt(hex.slice(4, 6), 16),
    };
  }

  const rgbMatch = trimmed.match(
    /^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*([\d.]+))?\s*\)$/i,
  );
  if (rgbMatch) {
    return {
      r: Number(rgbMatch[1]),
      g: Number(rgbMatch[2]),
      b: Number(rgbMatch[3]),
      a: rgbMatch[4] !== undefined ? Number(rgbMatch[4]) : undefined,
    };
  }

  return null;
}

export function toTranslucentBackgroundColor(color: string, alpha = 0.72): string {
  const rgb = parseBackgroundColorRgb(color);
  if (!rgb) return color;
  const finalAlpha = rgb.a !== undefined && rgb.a < 1 ? rgb.a : alpha;
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${finalAlpha})`;
}

export function backdropBlurStyle(blurPx: number): CSSProperties {
  const blur = `blur(${blurPx}px)`;
  return {
    backdropFilter: blur,
    WebkitBackdropFilter: blur,
  };
}

export function hasMediaBackground(style?: StyleProps): boolean {
  if (!style) return false;
  return Boolean(
    style.backgroundImage?.trim() ||
      style.backgroundGradient?.trim() ||
      style.backgroundVideo?.trim(),
  );
}

export function splitStylesForBackgroundBlur(
  baseStyle: CSSProperties,
  styleProps?: StyleProps,
): {
  wrapperStyle: CSSProperties;
  backgroundLayerStyle?: CSSProperties;
  blurPx: number;
} {
  const blurPx = parseBackdropBlurPx(styleProps?.backdropFilter);
  if (blurPx <= 0) {
    return { wrapperStyle: baseStyle, blurPx: 0 };
  }

  const hasStaticMedia = Boolean(
    styleProps?.backgroundImage?.trim() || styleProps?.backgroundGradient?.trim(),
  );
  const hasVideo = Boolean(styleProps?.backgroundVideo?.trim());

  if (hasStaticMedia) {
    const wrapperStyle = { ...baseStyle };
    const backgroundLayerStyle: CSSProperties = {};

    if (wrapperStyle.backgroundImage) {
      backgroundLayerStyle.backgroundImage = wrapperStyle.backgroundImage;
      delete wrapperStyle.backgroundImage;
    }
    if (wrapperStyle.background) {
      backgroundLayerStyle.background = wrapperStyle.background;
      delete wrapperStyle.background;
    }
    if (wrapperStyle.backgroundSize) {
      backgroundLayerStyle.backgroundSize = wrapperStyle.backgroundSize;
      delete wrapperStyle.backgroundSize;
    }
    if (wrapperStyle.backgroundPosition) {
      backgroundLayerStyle.backgroundPosition = wrapperStyle.backgroundPosition;
      delete wrapperStyle.backgroundPosition;
    }
    if (wrapperStyle.backgroundRepeat) {
      backgroundLayerStyle.backgroundRepeat = wrapperStyle.backgroundRepeat;
      delete wrapperStyle.backgroundRepeat;
    }

    delete wrapperStyle.backdropFilter;

    backgroundLayerStyle.filter = `blur(${blurPx}px)`;
    backgroundLayerStyle.transform = "scale(1.08)";

    return { wrapperStyle, backgroundLayerStyle, blurPx };
  }

  if (hasVideo) {
    const wrapperStyle = { ...baseStyle };
    delete wrapperStyle.backdropFilter;
    return { wrapperStyle, blurPx };
  }

  const backgroundColor = styleProps?.backgroundColor?.trim();
  if (backgroundColor) {
    const wrapperStyle = { ...baseStyle };
    const backgroundLayerStyle: CSSProperties = {
      backgroundColor: toTranslucentBackgroundColor(
        String(wrapperStyle.backgroundColor ?? backgroundColor),
      ),
      ...backdropBlurStyle(blurPx),
    };

    if (wrapperStyle.borderRadius) {
      backgroundLayerStyle.borderRadius = wrapperStyle.borderRadius;
    }

    delete wrapperStyle.backgroundColor;
    delete wrapperStyle.backdropFilter;

    return { wrapperStyle, backgroundLayerStyle, blurPx };
  }

  return {
    wrapperStyle: { ...baseStyle, ...backdropBlurStyle(blurPx) },
    blurPx,
  };
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

/** Layout shells that force width:100% at render but may omit it from stored craft props. */
const EDITOR_CHROME_STRETCH_NAMES = new Set([
  "Section",
  "Container",
  "Columns",
  "Custom Code",
  "Lead Form",
  "Page",
]);

/**
 * Whether Craft editor chrome should `w-full` so it doesn't shrink-wrap under
 * Section's `alignItems: center` (preview has no chrome and stretches correctly).
 */
export function shouldStretchEditorChrome(
  displayName: string,
  layout?: LayoutProps,
): boolean {
  if (shouldStretchPublishedWrapper(layout)) return true;
  if (EDITOR_CHROME_STRETCH_NAMES.has(displayName)) return true;
  if (/Column Row$/.test(displayName)) return true;
  if (/^\d+(st|nd|rd|th) Column$/.test(displayName)) return true;
  return false;
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
  context?: EffectiveBlockPropsContext,
): TypographyProps {
  return resolveEffectiveBlockProps(props, breakpoint, context).typography ?? {};
}

export function resolveFullWidthForBreakpoint(
  props: { fullWidth?: boolean; responsive?: BlockProps["responsive"] },
  breakpoint: Breakpoint,
  context?: EffectiveBlockPropsContext,
): boolean {
  return Boolean(
    resolveEffectiveBlockProps(props as BlockProps, breakpoint, context).fullWidth,
  );
}


export function setFullWidthAtBreakpoint(
  setProp: (cb: (props: BlockProps & { fullWidth?: boolean }) => void) => void,
  value: boolean,
  breakpoint: Breakpoint,
): void {
  setProp((props) => {
    if (breakpoint === "desktop") {
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
