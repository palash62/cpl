import { useBuilderStore } from "@/modules/page-builder/lib/builder-store";
import type { ThemeJson } from "@/modules/page-builder/lib/theme";

/** Opt-in vs thank-you theme when editing funnels; otherwise the page theme. */
export function useActivePageTheme(): {
  theme: ThemeJson;
  setTheme: (theme: ThemeJson) => void;
} {
  const funnelStep = useBuilderStore((s) => s.funnelStep);
  const builderConfig = useBuilderStore((s) => s.builderConfig);
  const theme = useBuilderStore((s) => s.theme);
  const thankYouTheme = useBuilderStore((s) => s.thankYouTheme);
  const setTheme = useBuilderStore((s) => s.setTheme);
  const setThankYouTheme = useBuilderStore((s) => s.setThankYouTheme);

  const isThankYou = builderConfig.mode === "funnel" && funnelStep === "thankYou";
  return {
    theme: isThankYou ? thankYouTheme : theme,
    setTheme: isThankYou ? setThankYouTheme : setTheme,
  };
}
