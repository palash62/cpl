"use client";

import type { ReactNode } from "react";
import { Element, useEditor } from "@craftjs/core";
import { CanvasWrapper } from "@/modules/page-builder/blocks/block-wrapper";
import { StandardSettings } from "@/modules/page-builder/components/settings/shared/block-settings";
import type { BlockProps } from "@/modules/page-builder/types/block-props";

type SectionProps = BlockProps & { children?: ReactNode };

export function Section({ children, ...props }: SectionProps) {
  return <CanvasWrapper {...props}>{children}</CanvasWrapper>;
}

Section.craft = {
  displayName: "Section",
  props: {
    name: "Section",
    style: { backgroundColor: "#ffffff" },
    layout: { padding: "40px 20px", width: "100%" },
  },
  rules: { canDrag: () => true, canMoveIn: () => true },
  related: { settings: StandardSettings },
};

export function Container({ children, ...props }: SectionProps) {
  return (
    <CanvasWrapper
      {...props}
      layout={{ maxWidth: "1200px", margin: "0 auto", ...props.layout }}
    >
      {children}
    </CanvasWrapper>
  );
}

Container.craft = {
  displayName: "Container",
  props: {
    layout: { maxWidth: "1200px", margin: "0 auto", padding: "0 16px" },
  },
  rules: { canDrag: () => true, canMoveIn: () => true },
  related: { settings: StandardSettings },
};

export function Columns({ children, columns = 2, ...props }: SectionProps & { columns?: number }) {
  return (
    <CanvasWrapper
      {...props}
      layout={{
        display: "grid",
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        gap: "16px",
        ...props.layout,
      }}
    >
      {children}
    </CanvasWrapper>
  );
}

Columns.craft = {
  displayName: "Columns",
  props: { columns: 2, layout: { gap: "16px" } },
  rules: { canDrag: () => true, canMoveIn: () => true },
  related: { settings: StandardSettings },
};

export function Spacer({ height = "32px", ...props }: BlockProps & { height?: string }) {
  return <CanvasWrapper {...props} layout={{ height }} draggable={false}>{null}</CanvasWrapper>;
}

Spacer.craft = {
  displayName: "Spacer",
  props: { height: "32px" },
  rules: { canDrag: () => true },
  related: { settings: StandardSettings },
};

export function Divider({ ...props }: BlockProps) {
  return (
    <CanvasWrapper
      {...props}
      style={{ borderTop: "1px solid #e2e8f0", ...props.style }}
      layout={{ margin: "16px 0", height: "1px", ...props.layout }}
      draggable
    />
  );
}

Divider.craft = {
  displayName: "Divider",
  props: { style: { borderTop: "1px solid #e2e8f0" } },
  rules: { canDrag: () => true },
  related: { settings: StandardSettings },
};

export function CanvasRoot({ children }: { children?: ReactNode }) {
  const { enabled } = useEditor((state) => ({ enabled: state.options.enabled }));
  return (
    <div className="min-h-screen w-full" style={{ background: "var(--pb-bg, #fff)" }}>
      {enabled ? children : children}
    </div>
  );
}

CanvasRoot.craft = {
  displayName: "Page",
  props: {},
  rules: { canDrag: () => false, canMoveIn: () => true },
};

export function SectionElement() {
  return <Element is={Section} canvas />;
}
