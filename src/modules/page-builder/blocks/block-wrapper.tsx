"use client";

import type { ReactNode, CSSProperties, ElementType } from "react";
import { useEditor, useNode } from "@craftjs/core";
import { cn } from "@/lib/utils";
import { mergeBlockStyles } from "@/modules/page-builder/lib/responsive";
import { useBuilderStore } from "@/modules/page-builder/lib/builder-store";
import type { BlockProps } from "@/modules/page-builder/types/block-props";

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
  const { connectors: { connect, drag }, selected } = useNode((node) => ({
    selected: node.events.selected,
  }));
  const { enabled } = useEditor((state) => ({ enabled: state.options.enabled }));
  const breakpoint = useBuilderStore((s) => s.breakpoint);

  if (blockProps.visible === false && !enabled) return null;

  const style: CSSProperties = {
    ...mergeBlockStyles(blockProps, breakpoint),
    ...extraStyle,
  };

  const animation = blockProps.animation;
  if (animation?.type && animation.type !== "none") {
    style.animation = `${animation.type} ${animation.duration ?? "0.5s"} ease ${animation.delay ?? "0s"} both`;
  }

  if (!enabled) {
    return (
      <Tag style={style} className={className}>
        {children}
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
        selected && "ring-2 ring-indigo-500 ring-offset-1",
        !selected && "hover:ring-1 hover:ring-indigo-400/40",
      )}
    >
      {children}
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
