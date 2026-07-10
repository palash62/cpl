"use client";

import type { ReactNode, CSSProperties, ElementType } from "react";
import { useEditor, useNode } from "@craftjs/core";
import { cn } from "@/lib/utils";
import { mergeBlockStyles } from "@/modules/page-builder/lib/responsive";
import { useBuilderStore } from "@/modules/page-builder/lib/builder-store";
import { isGhlBuilderMode } from "@/modules/page-builder/lib/builder-mode";
import { usePublishedBreakpoint } from "@/modules/page-builder/hooks/use-published-breakpoint";
import type { BlockProps } from "@/modules/page-builder/types/block-props";

const PUBLISHED_BACKGROUND_KEYS = new Set([
  "background",
  "backgroundColor",
  "backgroundImage",
  "backgroundSize",
  "backgroundPosition",
  "backgroundRepeat",
  "backdropFilter",
]);

const PUBLISHED_CONTENT_LAYOUT_KEYS = new Set([
  "width",
  "maxWidth",
  "margin",
  "marginTop",
  "marginRight",
  "marginBottom",
  "marginLeft",
  "padding",
  "paddingTop",
  "paddingRight",
  "paddingBottom",
  "paddingLeft",
  "display",
  "flexDirection",
  "justifyContent",
  "alignItems",
  "gap",
  "flexWrap",
  "gridTemplateColumns",
  "textAlign",
  "aspectRatio",
]);

function hasPublishedBackground(style: CSSProperties) {
  return Boolean(style.background || style.backgroundColor || style.backgroundImage);
}

function isPublishedWidthConstrained(style: CSSProperties) {
  const width = style.width;
  const maxWidth = style.maxWidth;
  if (maxWidth && maxWidth !== "none") return true;
  if (width && width !== "100%" && width !== "auto") return true;
  return false;
}

function splitPublishedBlockStyles(style: CSSProperties) {
  if (!hasPublishedBackground(style) || !isPublishedWidthConstrained(style)) {
    return { shell: style, content: null as CSSProperties | null };
  }

  const shell: CSSProperties = { width: "100%" };
  const content: CSSProperties = {};

  for (const [key, value] of Object.entries(style) as [keyof CSSProperties, CSSProperties[keyof CSSProperties]][]) {
    if (value === undefined) continue;
    if (PUBLISHED_BACKGROUND_KEYS.has(key)) {
      shell[key] = value;
      continue;
    }
    if (key === "minHeight" || key === "height") {
      shell[key] = value;
      content[key] = value;
      continue;
    }
    if (PUBLISHED_CONTENT_LAYOUT_KEYS.has(key)) {
      content[key] = value;
      continue;
    }
    content[key] = value;
  }

  return { shell, content };
}

function renderPublishedBackgroundMedia(
  backgroundVideo: string | undefined,
  children: ReactNode,
) {
  if (!backgroundVideo) return children;

  return (
    <div className="relative overflow-hidden">
      <video
        src={backgroundVideo}
        autoPlay
        muted
        loop
        playsInline
        className="pointer-events-none absolute inset-0 h-full w-full object-cover"
      />
      <div className="relative">{children}</div>
    </div>
  );
}

type BlockWrapperProps = BlockProps & {
  children?: ReactNode;
  className?: string;
  as?: ElementType;
  draggable?: boolean;
  extraStyle?: CSSProperties;
};

export function BlockWrapper({
  children,
  className,
  as: Tag = "div",
  draggable = true,
  extraStyle,
  ...blockProps
}: BlockWrapperProps) {
  const { connectors: { connect, drag }, selected, hovered } = useNode((node) => ({
    selected: node.events.selected,
    hovered: node.events.hovered,
  }));
  const { enabled } = useEditor((state) => ({ enabled: state.options.enabled }));
  const editorBreakpoint = useBuilderStore((s) => s.breakpoint);
  const publishedBreakpoint = usePublishedBreakpoint();
  const isGhl = useBuilderStore((s) => isGhlBuilderMode(s.builderConfig));
  const breakpoint = enabled ? editorBreakpoint : publishedBreakpoint;

  if (blockProps.visible === false && !enabled) return null;

  const style: CSSProperties = {
    ...mergeBlockStyles(blockProps, breakpoint),
    ...extraStyle,
  };

  if (!("color" in style) || !style.color) {
    style.color = "var(--pb-page-text, #0f172a)";
  }

  const animation = blockProps.animation;
  if (animation?.type && animation.type !== "none") {
    style.animation = `${animation.type} ${animation.duration ?? "0.5s"} ease ${animation.delay ?? "0s"} both`;
  }

  if (!enabled) {
    const { shell, content } = splitPublishedBlockStyles(style);
    const backgroundVideo = blockProps.style?.backgroundVideo
      ? String(blockProps.style.backgroundVideo)
      : undefined;

    if (content) {
      return (
        <Tag style={shell} className={cn(className, "w-full")}>
          {renderPublishedBackgroundMedia(
            backgroundVideo,
            <div style={content}>{children}</div>,
          )}
        </Tag>
      );
    }

    return (
      <Tag style={shell} className={className}>
        {renderPublishedBackgroundMedia(backgroundVideo, children)}
      </Tag>
    );
  }

  const inner = blockProps.style?.backgroundVideo ? (
    <div className="relative overflow-hidden">
      <video
        src={String(blockProps.style.backgroundVideo)}
        autoPlay
        muted
        loop
        playsInline
        className="pointer-events-none absolute inset-0 h-full w-full object-cover"
      />
      <div className="relative">{children}</div>
    </div>
  ) : (
    children
  );

  return (
    <Tag
      ref={(ref: HTMLElement | null) => {
        if (ref) {
          if (draggable) connect(drag(ref));
          else connect(ref);
        }
      }}
      style={style}
      className={cn(
        className,
        !isGhl && selected && "ring-2 ring-indigo-500 ring-offset-1",
        !isGhl && !selected && "hover:ring-1 hover:ring-indigo-400/40",
        isGhl && hovered && !selected && "outline outline-1 outline-dashed outline-orange-200/80",
      )}
    >
      {inner}
    </Tag>
  );
}

export function CanvasWrapper({
  children,
  className,
  ...blockProps
}: BlockWrapperProps) {
  return (
    <BlockWrapper {...blockProps} className={cn("min-h-[40px]", className)} draggable>
      {children}
    </BlockWrapper>
  );
}
