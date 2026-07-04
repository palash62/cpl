"use client";

import { Editor, Frame, Element } from "@craftjs/core";
import { craftResolver } from "@/modules/page-builder/blocks";
import { CanvasRoot } from "@/modules/page-builder/blocks/basic";
import { TopToolbar } from "@/modules/page-builder/components/editor/top-toolbar";
import { LeftComponentPanel } from "@/modules/page-builder/components/editor/left-component-panel";
import { RightPropertiesPanel } from "@/modules/page-builder/components/editor/right-properties-panel";
import { BottomStatusBar } from "@/modules/page-builder/components/editor/bottom-status-bar";
import { PreviewModal } from "@/modules/page-builder/components/editor/preview-modal";
import { VersionHistoryDrawer } from "@/modules/page-builder/components/editor/version-history-drawer";
import { useAutosave } from "@/modules/page-builder/hooks/use-autosave";
import { useBuilderKeyboard } from "@/modules/page-builder/hooks/use-builder-keyboard";
import { themeToCssVars } from "@/modules/page-builder/lib/theme";
import { useBuilderStore } from "@/modules/page-builder/lib/builder-store";
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
  const isDesktop = breakpoint === "desktop";
  const canvasWidth = isDesktop ? undefined : BREAKPOINT_WIDTHS[breakpoint];

  return (
    <Editor resolver={craftResolver} enabled onRender={RenderNode}>
      <EditorEffects pageId={pageId} />
      <div className="flex h-full min-h-0 flex-col">
        <TopToolbar pageId={pageId} pageName={pageName} />
        <div className="flex min-h-0 flex-1 overflow-hidden">
          <LeftComponentPanel />
          <div className="relative flex min-w-0 flex-1 flex-col overflow-hidden bg-[#1a1d27]">
            <div
              className="pointer-events-none absolute inset-0 opacity-[0.35]"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 1px 1px, #3f4455 1px, transparent 0)",
                backgroundSize: "20px 20px",
              }}
            />
            <div className="relative flex flex-1 items-start justify-center overflow-auto p-6">
              <div
                className={cn(
                  "w-full bg-white shadow-2xl ring-1 ring-white/10 transition-all duration-300",
                  !isDesktop && "rounded-xl overflow-hidden",
                )}
                style={{
                  maxWidth: canvasWidth ?? "100%",
                  minHeight: isDesktop ? "100%" : 600,
                  ...themeToCssVars(theme),
                }}
              >
                <Frame data={initialCraftState as never}>
                  <Element is={CanvasRoot} canvas />
                </Frame>
              </div>
            </div>
          </div>
          <RightPropertiesPanel />
        </div>
        <BottomStatusBar
          pageId={pageId}
          pageName={pageName}
          pageSlug={pageSlug}
          campaignId={campaignId}
        />
        <PreviewModal pageSlug={pageSlug} />
        <VersionHistoryDrawer pageId={pageId} />
      </div>
    </Editor>
  );
}
