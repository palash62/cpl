"use client";

import type { ReactNode, CSSProperties, ElementType } from "react";
import { useEditor, useNode } from "@craftjs/core";
import { cn } from "@/lib/utils";
import { mergeBlockStyles, shouldStretchPublishedWrapper } from "@/modules/page-builder/lib/responsive";
import { useBuilderStore } from "@/modules/page-builder/lib/builder-store";
import { isGhlBuilderMode } from "@/modules/page-builder/lib/builder-mode";
import { useRenderBreakpoint } from "@/modules/page-builder/hooks/use-render-breakpoint";
import type { BlockProps } from "@/modules/page-builder/types/block-props";
import type { Breakpoint } from "@/modules/page-builder/types/block-props";

function buildBlockStyle(
  blockProps: BlockProps,
  breakpoint: Breakpoint,
  extraStyle?: CSSProperties,
): CSSProperties {
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

  return style;
}

function renderBackgroundMedia(backgroundVideo: string | undefined, children: ReactNode) {
  const videoSrc = backgroundVideo?.trim();
  if (!videoSrc) return children;

  return (
    <div className="relative overflow-hidden">
      <video
        src={videoSrc}
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
  const isGhl = useBuilderStore((s) => isGhlBuilderMode(s.builderConfig));
  const breakpoint = useRenderBreakpoint();

  if (blockProps.visible === false && !enabled) return null;

  const style = buildBlockStyle(blockProps, breakpoint, extraStyle);
  const backgroundVideo = blockProps.style?.backgroundVideo
    ? String(blockProps.style.backgroundVideo).trim() || undefined
    : undefined;
  const inner = renderBackgroundMedia(backgroundVideo, children);

  if (!enabled) {
    return (
      <Tag
        style={style}
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
