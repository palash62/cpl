import type { BlockProps } from "@/modules/page-builder/types/block-props";

export type QuickAddPreset = Partial<BlockProps> & {
  text?: string;
  level?: 1 | 2 | 3 | 4 | 5 | 6;
};

const QUICK_ADD_PRESETS: Record<string, QuickAddPreset> = {
  Headline: {
    text: "Headline",
    level: 2,
    typography: {
      fontSize: "2rem",
      fontWeight: "700",
      lineHeight: "1.2",
      color: "#0f172a",
    },
  },
  "Sub-Headline": {
    text: "Sub-headline",
    level: 3,
    typography: {
      fontSize: "1.25rem",
      fontWeight: "600",
      lineHeight: "1.4",
      color: "#475569",
    },
  },
  Paragraph: {
    text: "Paragraph text",
    typography: {
      fontSize: "1rem",
      lineHeight: "1.6",
      color: "#475569",
    },
  },
};

export function getQuickAddPreset(label: string): QuickAddPreset | undefined {
  return QUICK_ADD_PRESETS[label];
}
