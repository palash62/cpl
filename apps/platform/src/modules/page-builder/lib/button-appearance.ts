import type { CSSProperties } from "react";
import type { ButtonAppearanceProps } from "@/modules/page-builder/types/block-props";
import type { ThemeJson } from "@/modules/page-builder/lib/theme";
import { buttonStyleFromTheme } from "@/modules/page-builder/lib/theme";

export function hoverEffectClass(effect?: ButtonAppearanceProps["hoverEffect"]): string | undefined {
  if (!effect || effect === "none") return undefined;
  return `pb-btn-hover-${effect}`;
}

export function resolveButtonStyle(
  theme: ThemeJson,
  appearance: ButtonAppearanceProps | undefined,
  fallbackTextColor?: string,
): CSSProperties {
  const base = buttonStyleFromTheme(theme, "primary", appearance?.textColor ?? fallbackTextColor);
  if (!appearance) return base;

  return {
    ...base,
    ...(appearance.backgroundColor ? { backgroundColor: appearance.backgroundColor } : {}),
    ...(appearance.textColor ? { color: appearance.textColor } : {}),
    ...(appearance.border ? { border: appearance.border } : {}),
    ...(appearance.borderRadius ? { borderRadius: appearance.borderRadius } : {}),
    ...(appearance.boxShadow ? { boxShadow: appearance.boxShadow } : {}),
  };
}
