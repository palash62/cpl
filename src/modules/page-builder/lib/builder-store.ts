import { create } from "zustand";
import type { Breakpoint } from "@/modules/page-builder/types/block-props";
import type { ThemeJson } from "@/modules/page-builder/lib/theme";
import { DEFAULT_THEME } from "@/modules/page-builder/lib/theme";

export type SaveStatus = "idle" | "saving" | "saved" | "error";

type BuilderUIState = {
  breakpoint: Breakpoint;
  leftTab: "components" | "layers" | "theme";
  previewOpen: boolean;
  versionHistoryOpen: boolean;
  saveStatus: SaveStatus;
  theme: ThemeJson;
  pageId: string | null;
  pageName: string;
  pageSlug: string;
  campaignId: string | null;
  setBreakpoint: (bp: Breakpoint) => void;
  setLeftTab: (tab: BuilderUIState["leftTab"]) => void;
  setPreviewOpen: (open: boolean) => void;
  setVersionHistoryOpen: (open: boolean) => void;
  setSaveStatus: (status: SaveStatus) => void;
  setTheme: (theme: ThemeJson) => void;
  setPageMeta: (meta: { pageId?: string; pageName?: string; pageSlug?: string; campaignId?: string | null }) => void;
};

export const useBuilderStore = create<BuilderUIState>((set) => ({
  breakpoint: "desktop",
  leftTab: "components",
  previewOpen: false,
  versionHistoryOpen: false,
  saveStatus: "idle",
  theme: DEFAULT_THEME,
  pageId: null,
  pageName: "",
  pageSlug: "",
  campaignId: null,
  setBreakpoint: (breakpoint) => set({ breakpoint }),
  setLeftTab: (leftTab) => set({ leftTab }),
  setPreviewOpen: (previewOpen) => set({ previewOpen }),
  setVersionHistoryOpen: (versionHistoryOpen) => set({ versionHistoryOpen }),
  setSaveStatus: (saveStatus) => set({ saveStatus }),
  setTheme: (theme) => set({ theme }),
  setPageMeta: (meta) => set((s) => ({ ...s, ...meta })),
}));
