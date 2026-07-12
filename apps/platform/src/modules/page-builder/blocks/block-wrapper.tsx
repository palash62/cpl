"use client";

import type { ReactNode, CSSProperties, ElementType } from "react";
import { useEditor, useNode } from "@craftjs/core";
import { cn } from "@/lib/utils";
import { mergeBlockStyles, shouldStretchPublishedWrapper, splitStylesForBackgroundBlur } from "@/modules/page-builder/lib/responsive";
import type { EffectiveBlockPropsContext } from "@/modules/page-builder/lib/responsive";
import { useBuilderStore } from "@/modules/page-builder/lib/builder-store";
import { isGhlBuilderMode } from "@/modules/page-builder/lib/builder-mode";
import { useRenderBreakpoint } from "@/modules/page-builder/hooks/use-render-breakpoint";
import type { BlockProps } from "@/modules/page-builder/types/block-props";
import type { Breakpoint } from "@/modules/page-builder/types/block-props";

function buildBlockStyle(
  blockProps: BlockProps,
  breakpoint: Breakpoint,
  extraStyle?: CSSProperties,
  context?: EffectiveBlockPropsContext,
): CSSProperties {
  const style: CSSProperties = {
    ...mergeBlockStyles(blockProps, breakpoint, context),
    ...extraStyle,
  };

  if (!("color" in style) || !style.color) {
    style.color = "var(--pb-page-text, #0f172a)";
  }

  const animation = blockProps.animation;
  if (animation?.type && animation.type !== "none") {
    style.animation = `${animation.type} ${animation.duration ?? "0.5s"} ease ${animation.delay ?? "0s"} both`;
  }

  return style;
}

function renderBackgroundStack(
  children: ReactNode,
  blockStyle: BlockProps["style"],
  resolvedStyle: CSSProperties,
): { wrapperStyle: CSSProperties; inner: ReactNode } {
  const { wrapperStyle, backgroundLayerStyle, blurPx } = splitStylesForBackgroundBlur(
    resolvedStyle,
    blockStyle,
  );
  const videoSrc = blockStyle?.backgroundVideo
    ? String(blockStyle.backgroundVideo).trim() || undefined
    : undefined;
  const needsStack = Boolean(backgroundLayerStyle || videoSrc);

  if (!needsStack) {
    return { wrapperStyle, inner: children };
  }

  const videoFilter = blurPx > 0 && videoSrc ? `blur(${blurPx}px)` : undefined;
  const stackClipStyle: CSSProperties = wrapperStyle.borderRadius
    ? { borderRadius: wrapperStyle.borderRadius }
    : {};

  return {
    wrapperStyle,
    inner: (
      <div className="relative overflow-hidden" style={stackClipStyle}>
        {backgroundLayerStyle ? (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={backgroundLayerStyle}
          />
        ) : null}
        {videoSrc ? (
          <video
            src={videoSrc}
            autoPlay
            muted
            loop
            playsInline
            className="pointer-events-none absolute inset-0 h-full w-full object-cover"
            style={videoFilter ? { filter: videoFilter } : undefined}
          />
        ) : null}
        <div className="relative">{children}</div>
      </div>
    ),
  };
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
  const { connectors: { connect, drag }, selected, hovered, displayName } = useNode((node) => ({
    selected: node.events.selected,
    hovered: node.events.hovered,
    displayName: String(node.data.displayName ?? ""),
  }));
  const { enabled } = useEditor((state) => ({ enabled: state.options.enabled }));
  const isGhl = useBuilderStore((s) => isGhlBuilderMode(s.builderConfig));
  const breakpoint = useRenderBreakpoint();

  if (blockProps.visible === false && !enabled) return null;

  const baseStyle = buildBlockStyle(
    blockProps,
    breakpoint,
    extraStyle,
    displayName ? { blockType: displayName } : undefined,
  );
  const { wrapperStyle, inner } = renderBackgroundStack(children, blockProps.style, baseStyle);

  if (!enabled) {
    return (
      <Tag
        style={wrapperStyle}
        className={cn(className, shouldStretchPublishedWrapper(blockProps.layout) && "w-full")}
      >
        {inner}
      </Tag>
    );
  }

  return (
    <Tag
      ref={(ref: HTMLElement | null) => {
        if (ref) {
          if (draggable) connect(drag(ref));
          else connect(ref);
        }
      }}
      style={wrapperStyle}
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
  const { enabled } = useEditor((state) => ({ enabled: state.options.enabled }));
  const stretchPublished = shouldStretchPublishedWrapper(blockProps.layout);

  return (
    <BlockWrapper
      {...blockProps}
      className={cn(
        enabled ? "min-h-[40px]" : stretchPublished && "w-full",
        className,
      )}
      draggable
    >
      {children}
    </BlockWrapper>
  );
}
