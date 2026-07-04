import type { CSSProperties } from "react";
import type { BlockProps, Breakpoint } from "@/modules/page-builder/types/block-props";

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
  if (t?.fontSize) style.fontSize = t.fontSize;
  if (t?.fontWeight) style.fontWeight = t.fontWeight;
  if (t?.color) style.color = t.color;
  if (t?.textAlign) style.textAlign = t.textAlign;
  if (t?.letterSpacing) style.letterSpacing = t.letterSpacing;
  if (t?.lineHeight) style.lineHeight = t.lineHeight;

  if (l?.width) style.width = l.width;
  if (l?.height) style.height = l.height;
  if (l?.margin) style.margin = l.margin;
  if (l?.padding) style.padding = l.padding;
  if (l?.gap) style.gap = l.gap;
  if (l?.flexDirection) style.flexDirection = l.flexDirection;
  if (l?.justifyContent) style.justifyContent = l.justifyContent;
  if (l?.alignItems) style.alignItems = l.alignItems;
  if (l?.display) style.display = l.display;

  if (s?.backgroundColor) style.backgroundColor = s.backgroundColor;
  if (s?.backgroundImage) style.backgroundImage = `url(${s.backgroundImage})`;
  if (s?.backgroundGradient) style.background = s.backgroundGradient;
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
