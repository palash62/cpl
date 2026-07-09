import type { CSSProperties } from "react";

export type ThemeJson = {
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  backgroundImage?: string;
  backgroundSize?: "cover" | "contain" | "auto";
  backgroundPosition?: string;
  backgroundRepeat?: string;
  fontFamily: string;
  buttonStyle: "solid" | "outline" | "ghost";
  borderRadius: string;
  spacingScale: "compact" | "normal" | "relaxed";
};

export const DEFAULT_THEME: ThemeJson = {
  primaryColor: "#6366f1",
  secondaryColor: "#a855f7",
  backgroundColor: "#ffffff",
  backgroundImage: "",
  backgroundSize: "cover",
  backgroundPosition: "center",
  backgroundRepeat: "no-repeat",
  fontFamily: "Inter, system-ui, sans-serif",
  buttonStyle: "solid",
  borderRadius: "8px",
  spacingScale: "normal",
};

export function themePageBackgroundStyle(theme: ThemeJson): CSSProperties {
  const style: CSSProperties = {
    backgroundColor: theme.backgroundColor,
  };
  if (theme.backgroundImage?.trim()) {
    style.backgroundImage = `url(${theme.backgroundImage.trim()})`;
    style.backgroundSize = theme.backgroundSize ?? "cover";
    style.backgroundPosition = theme.backgroundPosition ?? "center";
    style.backgroundRepeat = theme.backgroundRepeat ?? "no-repeat";
  }
  return style;
}

export function normalizeThemeJson(input: unknown): ThemeJson {
  if (!input || typeof input !== "object") return { ...DEFAULT_THEME };
  return { ...DEFAULT_THEME, ...(input as Partial<ThemeJson>) };
}

export function themeToCssVars(theme: ThemeJson): CSSProperties {
  const spacing =
    theme.spacingScale === "compact" ? "0.75rem" : theme.spacingScale === "relaxed" ? "1.5rem" : "1rem";
  return {
    ["--pb-primary" as string]: theme.primaryColor,
    ["--pb-secondary" as string]: theme.secondaryColor,
    ["--pb-bg" as string]: theme.backgroundColor,
    ["--pb-font" as string]: theme.fontFamily,
    ["--pb-radius" as string]: theme.borderRadius,
    ["--pb-spacing" as string]: spacing,
  };
}

export function buttonStyleFromTheme(
  theme: ThemeJson,
  variant: "primary" | "secondary" = "primary",
  textColor?: string,
): CSSProperties {
  const color = variant === "primary" ? theme.primaryColor : theme.secondaryColor;
  if (theme.buttonStyle === "outline") {
    return {
      backgroundColor: "transparent",
      color: textColor ?? color,
      border: `2px solid ${color}`,
      borderRadius: theme.borderRadius,
    };
  }
  if (theme.buttonStyle === "ghost") {
    return {
      backgroundColor: "transparent",
      color: textColor ?? color,
      border: "none",
      borderRadius: theme.borderRadius,
    };
  }
  return {
    backgroundColor: color,
    color: textColor ?? "#ffffff",
    border: "none",
    borderRadius: theme.borderRadius,
  };
}

function parseHexColor(hex: string): { r: number; g: number; b: number } | null {
  const normalized = hex.trim().replace("#", "");
  if (!/^[0-9a-fA-F]{6}$/.test(normalized)) return null;
  return {
    r: parseInt(normalized.slice(0, 2), 16),
    g: parseInt(normalized.slice(2, 4), 16),
    b: parseInt(normalized.slice(4, 6), 16),
  };
}

export function isDarkBackground(color: string): boolean {
  const rgb = parseHexColor(color);
  if (!rgb) return false;
  const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
  return luminance < 0.5;
}

export function publishedPageTokens(theme: ThemeJson) {
  const dark = isDarkBackground(theme.backgroundColor);
  return {
    dark,
    pageText: dark ? "#f8fafc" : "#0f172a",
    labelColor: dark ? "#1e293b" : "#334155",
    inputBackground: "#ffffff",
    inputColor: "#0f172a",
    inputBorder: "#cbd5e1",
    formSurfaceBackground: "#ffffff",
    formSurfaceText: "#0f172a",
  };
}

export function publishedPageCssVars(theme: ThemeJson): CSSProperties {
  const tokens = publishedPageTokens(theme);
  return {
    ...themeToCssVars(theme),
    ["--pb-page-text" as string]: tokens.pageText,
    ["--pb-label" as string]: tokens.labelColor,
    ["--pb-input-bg" as string]: tokens.inputBackground,
    ["--pb-input-text" as string]: tokens.inputColor,
    ["--pb-input-border" as string]: tokens.inputBorder,
    ["--pb-form-surface-bg" as string]: tokens.formSurfaceBackground,
    ["--pb-form-surface-text" as string]: tokens.formSurfaceText,
    ...themePageBackgroundStyle(theme),
  };
}
