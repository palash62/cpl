"use client";

import { Editor, Frame, Element } from "@craftjs/core";
import { craftResolver } from "@/modules/page-builder/blocks";
import { CanvasRoot } from "@/modules/page-builder/blocks/basic";
import { TopToolbar } from "@/modules/page-builder/components/editor/top-toolbar";
import { BuilderSubToolbar } from "@/modules/page-builder/components/editor/builder-sub-toolbar";
import { LeftComponentPanel } from "@/modules/page-builder/components/editor/left-component-panel";
import { RightPropertiesPanel } from "@/modules/page-builder/components/editor/right-properties-panel";
import { BottomStatusBar } from "@/modules/page-builder/components/editor/bottom-status-bar";
import { PreviewModal } from "@/modules/page-builder/components/editor/preview-modal";
import { VersionHistoryDrawer } from "@/modules/page-builder/components/editor/version-history-drawer";
import { PageSettingsDrawer } from "@/modules/page-builder/components/editor/page-settings-drawer";
import { AssetPickerModal } from "@/modules/page-builder/components/editor/asset-picker-modal";
import { useAutosave } from "@/modules/page-builder/hooks/use-autosave";
import { useBuilderKeyboard } from "@/modules/page-builder/hooks/use-builder-keyboard";
import { isDarkBackground, themeToCssVars } from "@/modules/page-builder/lib/theme";
import { useBuilderStore } from "@/modules/page-builder/lib/builder-store";
import { getBuilderChrome } from "@/modules/page-builder/lib/builder-chrome";
import { isGhlBuilderMode } from "@/modules/page-builder/lib/builder-mode";
import { ensureEditorCraftState } from "@/modules/page-builder/lib/serialize";
import { BuilderSettingsLayoutProvider } from "@/modules/page-builder/lib/builder-settings-context";
import { BREAKPOINT_WIDTHS } from "@/modules/page-builder/lib/responsive";
import type { CraftSerializedState } from "@/modules/page-builder/types/page-document";
import { RenderNode } from "@/modules/page-builder/components/editor/render-node";
import { cn } from "@/lib/utils";

type LandingPageBuilderProps = {
  pageId: string;
  initialCraftState: CraftSerializedState;
  pageName: string;
  pageSlug: string;
  campaignId: string | null;
};

function EditorEffects({ pageId }: { pageId: string }) {
  useAutosave(pageId);
  useBuilderKeyboard();
  return null;
}

export function LandingPageBuilder({
  pageId,
  initialCraftState,
  pageName,
  pageSlug,
  campaignId,
}: LandingPageBuilderProps) {
  const theme = useBuilderStore((s) => s.theme);
  const breakpoint = useBuilderStore((s) => s.breakpoint);
  const builderConfig = useBuilderStore((s) => s.builderConfig);
  const chromeTheme = builderConfig.chromeTheme ?? "dark";
  const chrome = getBuilderChrome(chromeTheme);
  const isGhl = isGhlBuilderMode(builderConfig);
  const isDesktop = breakpoint === "desktop";
  const canvasWidth = isDesktop ? undefined : BREAKPOINT_WIDTHS[breakpoint];
  const darkCanvas = isDarkBackground(theme.backgroundColor);

  const resolvedCraftState = ensureEditorCraftState(initialCraftState);

  return (
    <BuilderSettingsLayoutProvider layout={isGhl ? "ghl" : "classic"}>
      <Editor resolver={craftResolver} enabled onRender={RenderNode}>
        <EditorEffects pageId={pageId} />
        <div className="flex h-full min-h-0 flex-col">
          <TopToolbar pageId={pageId} pageName={pageName} pageSlug={pageSlug} />
          {isGhl && <BuilderSubToolbar />}
          <div className="flex min-h-0 flex-1 overflow-hidden">
            <LeftComponentPanel />
            <div className={cn("relative flex min-w-0 flex-1 flex-col overflow-hidden", chrome.canvas)}>
              {!isGhl && (
                <div
                  className="pointer-events-none absolute inset-0 opacity-[0.35]"
                  style={{
                    backgroundImage: chrome.canvasGrid,
                    backgroundSize: "20px 20px",
                  }}
                />
              )}
              <div className="relative flex flex-1 items-start justify-center overflow-auto p-6">
                <div
                  className={cn(
                    "relative w-full bg-white transition-all duration-300",
                    isGhl ? "min-h-[720px] shadow-lg ring-1 ring-slate-200" : "shadow-2xl",
                    chromeTheme === "light" && !isGhl && "ring-1 ring-slate-200",
                    !isGhl && "ring-1 ring-white/10",
                    !isDesktop && "overflow-hidden rounded-xl",
                    darkCanvas ? "text-slate-100" : "text-slate-900",
                  )}
                  style={{
                    maxWidth: canvasWidth ?? (isGhl ? 960 : "100%"),
                    minHeight: isDesktop ? (isGhl ? 720 : "100%") : 600,
                    ...themeToCssVars(theme),
                  }}
                >
                  <Frame data={resolvedCraftState as never}>
                    <Element is={CanvasRoot} canvas />
                  </Frame>
                </div>
              </div>
            </div>
            <RightPropertiesPanel />
          </div>
          {!isGhl && (
            <BottomStatusBar
              pageId={pageId}
              pageName={pageName}
              pageSlug={pageSlug}
              campaignId={campaignId}
            />
          )}
          <PreviewModal pageSlug={pageSlug} />
          <VersionHistoryDrawer pageId={pageId} />
          <PageSettingsDrawer />
          <AssetPickerModal />
        </div>
      </Editor>
    </BuilderSettingsLayoutProvider>
  );
}
