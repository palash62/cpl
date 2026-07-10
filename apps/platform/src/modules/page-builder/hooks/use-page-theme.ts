import { useEditor } from "@craftjs/core";
import { useActivePageTheme } from "@/modules/page-builder/hooks/use-active-page-theme";
import { usePublishedPage } from "@/modules/page-builder/lib/published-page-context";
import { DEFAULT_THEME } from "@/modules/page-builder/lib/theme";
import type { ThemeJson } from "@/modules/page-builder/lib/theme";

/** Editor: Zustand theme. Published/preview: theme from PageRenderer context. */
export function usePageTheme(): ThemeJson {
  const { enabled } = useEditor((state) => ({ enabled: state.options.enabled }));
  const { theme: editorTheme } = useActivePageTheme();
  const published = usePublishedPage();

  if (enabled) return editorTheme;
  return published.theme ?? DEFAULT_THEME;
}
