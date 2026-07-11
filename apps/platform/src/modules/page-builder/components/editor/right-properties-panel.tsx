"use client";

import type { ComponentType } from "react";
import { useEffect } from "react";
import { NodeProvider, useEditor, useNode } from "@craftjs/core";
import { MousePointer2, X } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AnimationFields,
  GeneralFields,
  TypographyFields,
} from "@/modules/page-builder/components/settings/shared/block-settings";
import {
  AlignControl,
  BackgroundPanel,
  BlurControl,
  normalizeAlignValue,
  SpacingControl,
  WidthControl,
} from "@/modules/page-builder/components/settings/ghl/controls";
import { BorderShadowPanel } from "@/modules/page-builder/components/settings/ghl/border-shadow-panel";
import {
  InlineTextFormattingPanel,
  RICH_TEXT_BLOCK_NAMES,
} from "@/modules/page-builder/components/settings/ghl/inline-text-formatting-panel";
import { useBuilderStore } from "@/modules/page-builder/lib/builder-store";
import { useRichTextEditorStore } from "@/modules/page-builder/lib/rich-text-editor-store";
import { getBuilderChrome } from "@/modules/page-builder/lib/builder-chrome";
import { isGhlBuilderMode } from "@/modules/page-builder/lib/builder-mode";
import {
  GHL_PROPERTIES_PANEL,
  GHL_SECTION_CARD,
  GHL_SECTION_TITLE,
  GHL_TAB_LIST,
  GHL_TAB_TRIGGER,
} from "@/modules/page-builder/lib/builder-panel-styles";
import type { BlockProps, Breakpoint } from "@/modules/page-builder/types/block-props";
import { cn } from "@/lib/utils";
import {
  isFullWidthLayout,
  resolveGhlAlignDisplay,
  seedBreakpointOverridesBeforeDesktopEdit,
  shouldUseTextAlignForGhlAlign,
} from "@/modules/page-builder/lib/responsive";
import { ListAppearancePanel } from "@/modules/page-builder/components/settings/ghl/list-appearance-panel";

function GhlStylesPanel() {
  const styleBreakpoint = useBuilderStore((s) => s.styleBreakpoint);
  const setStyleBreakpoint = useBuilderStore((s) => s.setStyleBreakpoint);
  const setBreakpoint = useBuilderStore((s) => s.setBreakpoint);
  const {
    displayName,
    layout,
    typography,
    style,
    responsive,
    visible,
    mobileVisible,
    actions: { setProp },
  } = useNode((node) => ({
    displayName: String(node.data.displayName ?? node.data.type ?? "Element"),
    layout: node.data.props.layout as BlockProps["layout"],
    typography: node.data.props.typography as BlockProps["typography"],
    style: node.data.props.style as BlockProps["style"],
    responsive: node.data.props.responsive as BlockProps["responsive"],
    visible: node.data.props.visible as boolean | undefined,
    mobileVisible: (node.data.props.responsive as BlockProps["responsive"])?.mobile?.visible,
  }));

  const breakpointOverride = styleBreakpoint === "desktop" ? undefined : responsive?.[styleBreakpoint];
  const layoutSafe = { ...(layout ?? {}), ...(breakpointOverride?.layout ?? {}) };
  const typographySafe = { ...(typography ?? {}), ...(breakpointOverride?.typography ?? {}) };
  const styleSafe = { ...(style ?? {}), ...(breakpointOverride?.style ?? {}) };
  const isSection = displayName === "Section";
  const supportsInlineText = RICH_TEXT_BLOCK_NAMES.has(displayName);
  const useTextAlignForAlign = shouldUseTextAlignForGhlAlign(displayName, layoutSafe.width, RICH_TEXT_BLOCK_NAMES);

  function setLayoutProp(key: keyof NonNullable<BlockProps["layout"]>, value: string) {
    setProp((props: BlockProps) => {
      if (styleBreakpoint === "desktop") {
        seedBreakpointOverridesBeforeDesktopEdit(props, "layout", key);
        props.layout = { ...(props.layout ?? {}), [key]: value };
        return;
      }
      props.responsive = {
        ...(props.responsive ?? {}),
        [styleBreakpoint]: {
          ...(props.responsive?.[styleBreakpoint] ?? {}),
          layout: { ...(props.responsive?.[styleBreakpoint]?.layout ?? {}), [key]: value },
        },
      };
    });
  }

  function setStyleProp(key: string, value: string) {
    const nextValue = key === "opacity" ? parseFloat(value) || 1 : value;
    setProp((props: BlockProps) => {
      if (styleBreakpoint === "desktop") {
        seedBreakpointOverridesBeforeDesktopEdit(props, "style", key);
        props.style = { ...(props.style ?? {}), [key]: nextValue };
        return;
      }
      props.responsive = {
        ...(props.responsive ?? {}),
        [styleBreakpoint]: {
          ...(props.responsive?.[styleBreakpoint] ?? {}),
          style: { ...(props.responsive?.[styleBreakpoint]?.style ?? {}), [key]: nextValue },
        },
      };
    });
  }

  function setDesktopVisible(next: boolean) {
    setProp((props: BlockProps) => {
      props.visible = next;
    });
  }

  function setTypographyProp(key: keyof NonNullable<BlockProps["typography"]>, value: string) {
    setProp((props: BlockProps) => {
      if (styleBreakpoint === "desktop") {
        seedBreakpointOverridesBeforeDesktopEdit(props, "typography", key);
        props.typography = { ...(props.typography ?? {}), [key]: value };
        return;
      }
      props.responsive = {
        ...(props.responsive ?? {}),
        [styleBreakpoint]: {
          ...(props.responsive?.[styleBreakpoint] ?? {}),
          typography: { ...(props.responsive?.[styleBreakpoint]?.typography ?? {}), [key]: value },
        },
      };
    });
  }

  function setAlignValue(value: string) {
    if (useTextAlignForAlign) {
      setTypographyProp("textAlign", value);
      setLayoutProp("textAlign", value);
    } else {
      setLayoutProp("blockAlign", value);
    }
  }

  const alignDisplayValue = normalizeAlignValue(
    resolveGhlAlignDisplay(typographySafe, layoutSafe, layoutSafe.width),
  );

  function setMobileVisible(next: boolean) {
    setProp((props: BlockProps) => {
      props.responsive = {
        ...(props.responsive ?? {}),
        mobile: { ...(props.responsive?.mobile ?? {}), visible: next },
      };
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-0.5 rounded-md bg-slate-100 p-0.5">
        {(["desktop", "tablet", "mobile"] as Breakpoint[]).map((bp) => (
          <button
            key={bp}
            type="button"
            onClick={() => {
              setStyleBreakpoint(bp);
              setBreakpoint(bp);
            }}
            className={cn(
              "flex-1 rounded py-1 text-[11px] font-medium capitalize",
              styleBreakpoint === bp ? "bg-white text-slate-900 shadow-sm" : "text-slate-500",
            )}
          >
            {bp}
          </button>
        ))}
      </div>

      <div className={GHL_SECTION_CARD}>
        <p className={GHL_SECTION_TITLE}>Spacing</p>
        <div className="space-y-2.5">
          <SpacingControl label="Margin" value={String(layoutSafe.margin ?? "")} onChange={(v) => setLayoutProp("margin", v)} />
          <SpacingControl label="Padding" value={String(layoutSafe.padding ?? "")} onChange={(v) => setLayoutProp("padding", v)} />
        </div>
      </div>

      <div className={GHL_SECTION_CARD}>
        <p className={GHL_SECTION_TITLE}>
          {isSection ? "Section Size" : "Container Size"}
        </p>
        <div className="space-y-2.5">
          <WidthControl label="Width" value={String(layoutSafe.width ?? "auto")} onChange={(v) => setLayoutProp("width", v)} />
          <WidthControl
            label={isSection ? "Min Height" : "Height"}
            value={String(isSection ? (layoutSafe.minHeight ?? "auto") : (layoutSafe.height ?? "auto"))}
            onChange={(v) => setLayoutProp(isSection ? "minHeight" : "height", v)}
          />
          <AlignControl
            label="Align"
            value={alignDisplayValue}
            onChange={setAlignValue}
          />
        </div>
      </div>

      <div className={GHL_SECTION_CARD}>
        <p className={GHL_SECTION_TITLE}>Visibility</p>
        <div className="grid grid-cols-2 gap-1.5">
          <button
            type="button"
            onClick={() => setDesktopVisible(visible === false)}
            className={cn(
              "h-8 rounded-md border text-[11px] font-medium transition",
              visible !== false ? "border-blue-200 bg-blue-50 text-blue-700" : "border-slate-200 bg-white text-slate-500",
            )}
          >
            Desktop
          </button>
          <button
            type="button"
            onClick={() => setMobileVisible(mobileVisible === false)}
            className={cn(
              "h-8 rounded-md border text-[11px] font-medium transition",
              mobileVisible !== false ? "border-blue-200 bg-blue-50 text-blue-700" : "border-slate-200 bg-white text-slate-500",
            )}
          >
            Mobile
          </button>
        </div>
      </div>

      <div className={GHL_SECTION_CARD}>
        <p className={GHL_SECTION_TITLE}>Background</p>
        <BackgroundPanel style={styleSafe as Record<string, string | number | undefined>} onChange={setStyleProp} />
        <div className="mt-2.5">
          <BlurControl
            value={String(styleSafe?.backdropFilter ?? "").replace("blur(", "").replace(")", "") || "0px"}
            onChange={(v) => setStyleProp("backdropFilter", v === "0px" ? "" : `blur(${v})`)}
          />
        </div>
      </div>

      {supportsInlineText ? <InlineTextFormattingPanel /> : null}

      {displayName === "List" ? <ListAppearancePanel /> : null}

      <div className={GHL_SECTION_CARD}>
        <p className={GHL_SECTION_TITLE}>Typography</p>
        <TypographyFields />
      </div>

      <div className={GHL_SECTION_CARD}>
        <p className={GHL_SECTION_TITLE}>Border & Shadow</p>
        <BorderShadowPanel style={styleSafe as Record<string, string | number | undefined>} onChange={setStyleProp} />
      </div>
    </div>
  );
}

function GhlPropertiesBody({ Settings, displayName }: { Settings: ComponentType | null; displayName: string }) {
  const propertiesTab = useBuilderStore((s) => s.propertiesTab);
  const setPropertiesTab = useBuilderStore((s) => s.setPropertiesTab);
  const { actions } = useEditor();

  return (
    <>
      <div className="flex items-center justify-between border-b border-slate-200 px-3 py-2.5">
        <h3 className="text-[13px] font-semibold leading-none text-slate-900">{displayName}</h3>
        <button
          type="button"
          className="flex h-6 w-6 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          onClick={() => actions.selectNode()}
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      <Tabs value={propertiesTab} onValueChange={(v) => setPropertiesTab(v as typeof propertiesTab)}>
        <TabsList className={GHL_TAB_LIST}>
          <TabsTrigger value="general" className={GHL_TAB_TRIGGER}>
            General
          </TabsTrigger>
          <TabsTrigger value="styles" className={GHL_TAB_TRIGGER}>
            Styles
          </TabsTrigger>
          <TabsTrigger value="animations" className={GHL_TAB_TRIGGER}>
            Animations
          </TabsTrigger>
        </TabsList>

        <div className={cn("max-h-[calc(100vh-200px)] overflow-y-auto p-3", GHL_PROPERTIES_PANEL)}>
          <TabsContent value="general" className="mt-0 space-y-3">
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-slate-600">Element name</label>
              <input
                readOnly
                value={displayName}
                className="h-8 w-full rounded-md border border-slate-200 bg-slate-50 px-2.5 text-xs text-slate-700"
              />
            </div>
            <GeneralFields />
            {Settings && <Settings />}
          </TabsContent>
          <TabsContent value="styles" className="mt-0">
            {propertiesTab === "styles" && <GhlStylesPanel />}
          </TabsContent>
          <TabsContent value="animations" className="mt-0">
            {propertiesTab === "animations" && <AnimationFields />}
          </TabsContent>
        </div>
      </Tabs>
    </>
  );
}

export function RightPropertiesPanel() {
  const builderConfig = useBuilderStore((s) => s.builderConfig);
  const chromeTheme = builderConfig.chromeTheme ?? "dark";
  const chrome = getBuilderChrome(chromeTheme);
  const isGhl = isGhlBuilderMode(builderConfig);

  const { selected, Settings, displayName } = useEditor((state, query) => {
    const currentNodeId = query.getEvent("selected").first();
    let settingsPanel: ComponentType | null = null;
    let name: string | null = null;
    if (currentNodeId && state.nodes[currentNodeId]) {
      const node = query.node(currentNodeId).get();
      settingsPanel = (node?.related?.settings as ComponentType) ?? null;
      name = String(node?.data.displayName ?? node?.data.type ?? "Element");
    }
    return {
      selected: currentNodeId,
      Settings: settingsPanel,
      displayName: name,
    };
  });

  useEffect(() => {
    if (!selected) {
      useRichTextEditorStore.getState().setActiveEditor(null);
    }
  }, [selected]);

  if (isGhl) {
    return (
      <aside className="flex w-[300px] shrink-0 flex-col border-l border-slate-200 bg-white shadow-[-4px_0_24px_rgba(15,23,42,0.04)]">
        {selected ? (
          <NodeProvider id={selected} related>
            <GhlPropertiesBody Settings={Settings} displayName={displayName ?? "Element"} />
          </NodeProvider>
        ) : (
          <div className="flex flex-col items-center justify-center px-5 py-16 text-center">
            <div className="mb-2.5 flex h-10 w-10 items-center justify-center rounded-full bg-slate-100">
              <MousePointer2 className="h-4 w-4 text-slate-400" />
            </div>
            <p className="text-[13px] font-medium text-slate-900">Select an element</p>
            <p className="mt-1 text-[11px] leading-snug text-slate-500">Click any block on the canvas to edit properties.</p>
          </div>
        )}
      </aside>
    );
  }

  return (
    <aside className={cn("flex w-[300px] shrink-0 flex-col", chrome.properties)}>
      <div className="border-b border-inherit px-4 py-3">
        <div className="flex items-center gap-2">
          <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg", chrome.propertiesIcon)}>
            <MousePointer2 className="h-4 w-4" />
          </div>
          <div>
            <h3 className={cn("text-sm font-semibold", chrome.propertiesTitle)}>Properties</h3>
            <p className={cn("text-xs", chrome.propertiesSubtitle)}>
              {selected ? displayName : "No selection"}
            </p>
          </div>
        </div>
      </div>
      <div className={cn("flex-1 overflow-auto p-4", chrome.propertiesPanel)}>
        {Settings ? (
          <Settings />
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className={cn("mb-3 flex h-12 w-12 items-center justify-center rounded-full", chrome.propertiesIcon)}>
              <MousePointer2 className="h-5 w-5" />
            </div>
            <p className={cn("text-sm font-medium", chrome.propertiesEmpty)}>Select an element</p>
            <p className={cn("mt-1 max-w-[200px] text-xs", chrome.propertiesEmptyMuted)}>
              Click any block on the canvas to edit its content and styles.
            </p>
          </div>
        )}
      </div>
    </aside>
  );
}
