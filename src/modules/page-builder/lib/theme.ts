import type { CSSProperties } from "react";

export type ThemeJson = {
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  fontFamily: string;
  buttonStyle: "solid" | "outline" | "ghost";
  borderRadius: string;
  spacingScale: "compact" | "normal" | "relaxed";
};

export const DEFAULT_THEME: ThemeJson = {
  primaryColor: "#6366f1",
  secondaryColor: "#a855f7",
  backgroundColor: "#ffffff",
  fontFamily: "Inter, system-ui, sans-serif",
  buttonStyle: "solid",
  borderRadius: "8px",
  spacingScale: "normal",
};

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
): CSSProperties {
  const color = variant === "primary" ? theme.primaryColor : theme.secondaryColor;
  if (theme.buttonStyle === "outline") {
    return {
      backgroundColor: "transparent",
      color,
      border: `2px solid ${color}`,
      borderRadius: theme.borderRadius,
    };
  }
  if (theme.buttonStyle === "ghost") {
    return {
      backgroundColor: "transparent",
      color,
      border: "none",
      borderRadius: theme.borderRadius,
    };
  }
  return {
    backgroundColor: color,
    color: "#ffffff",
    border: "none",
    borderRadius: theme.borderRadius,
  };
}
