"use client";

import type { ReactNode } from "react";
import { Element, useEditor, useNode } from "@craftjs/core";
import { CanvasWrapper } from "@/modules/page-builder/blocks/block-wrapper";
import { CanvasAddButton } from "@/modules/page-builder/blocks/basic/canvas-add-button";
import { RowSettings } from "@/modules/page-builder/components/settings/layout/row-settings";
import { ColumnSettings } from "@/modules/page-builder/components/settings/layout/column-settings";
import { StandardSettings } from "@/modules/page-builder/components/settings/shared/block-settings";
import type { BlockProps } from "@/modules/page-builder/types/block-props";

type SectionProps = BlockProps & { children?: ReactNode };

export function Section({ children, ...props }: SectionProps) {
  const { id, childCount } = useNode((node) => ({
    childCount: node.data.nodes?.length ?? 0,
  }));
  const { enabled } = useEditor((state) => ({ enabled: state.options.enabled }));
  const showEmpty = enabled && childCount === 0;

  return (
    <CanvasWrapper
      {...props}
      layout={{
        ...(enabled && showEmpty ? { minHeight: "400px" } : {}),
        ...props.layout,
      }}
    >
      {showEmpty ? <CanvasAddButton parentId={id} variant="section" /> : children}
    </CanvasWrapper>
  );
}

Section.craft = {
  displayName: "Section",
  props: {
    name: "Section",
    style: { backgroundColor: "transparent" },
    layout: { padding: "40px 20px", width: "100%" },
  },
  rules: { canDrag: () => true, canMoveIn: () => true },
  related: { settings: StandardSettings },
};

export function Container({ children, ...props }: SectionProps) {
  const { id, childCount } = useNode((node) => ({
    childCount: node.data.nodes?.length ?? 0,
  }));
  const { enabled } = useEditor((state) => ({ enabled: state.options.enabled }));
  const showEmpty = enabled && childCount === 0;

  return (
    <CanvasWrapper
      {...props}
      layout={{ maxWidth: "1200px", margin: "0 auto", minHeight: showEmpty ? "200px" : undefined, ...props.layout }}
    >
      {showEmpty ? <CanvasAddButton parentId={id} variant="container" /> : children}
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

export function Columns({
  children,
  columns = 2,
  ...props
}: SectionProps & { columns?: number }) {
  const label = columns === 1 ? "1 Column Row" : `${columns} Column Row`;
  return (
    <CanvasWrapper
      {...props}
      name={props.name ?? label}
      layout={{
        display: "grid",
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        gap: "16px",
        width: "100%",
        alignItems: "stretch",
        ...props.layout,
      }}
    >
      {children}
    </CanvasWrapper>
  );
}

Columns.craft = {
  displayName: "Columns",
  props: { columns: 2, name: "2 Column Row", layout: { gap: "16px", width: "100%" } },
  rules: {
    canDrag: () => true,
    canMoveIn: (incoming: Array<{ data: { type: { resolvedName?: string } } }>) =>
      incoming.every((node) => node.data.type?.resolvedName === "Column"),
  },
  related: { settings: RowSettings },
};

export function Column({
  children,
  columnIndex = 1,
  ...props
}: SectionProps & { columnIndex?: number }) {
  const { id, childCount } = useNode((node) => ({
    childCount: node.data.nodes?.length ?? 0,
  }));
  const { enabled } = useEditor((state) => ({ enabled: state.options.enabled }));
  const labels = ["1st", "2nd", "3rd", "4th", "5th", "6th"];
  const label = `${labels[columnIndex - 1] ?? `${columnIndex}th`} Column`;
  const showEmpty = enabled && childCount === 0;

  return (
    <CanvasWrapper
      {...props}
      name={props.name ?? label}
      layout={{
        ...(showEmpty ? { minHeight: "120px" } : {}),
        padding: "8px",
        display: "flex",
        flexDirection: "column",
        gap: "8px",
        alignSelf: "stretch",
        ...props.layout,
      }}
      className={showEmpty ? "min-h-[120px]" : undefined}
    >
      {showEmpty ? <CanvasAddButton parentId={id} variant="column" /> : children}
    </CanvasWrapper>
  );
}

Column.craft = {
  displayName: "Column",
  props: { columnIndex: 1, name: "1st Column", layout: { minHeight: "120px", padding: "8px" } },
  rules: {
    canDrag: () => false,
    canMoveIn: () => true,
  },
  related: { settings: ColumnSettings },
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
  const { id, childCount } = useNode((node) => ({
    childCount: node.data.nodes?.length ?? 0,
  }));
  const { enabled } = useEditor((state) => ({ enabled: state.options.enabled }));
  const showEmpty = enabled && childCount === 0;

  return (
    <div className={enabled ? "min-h-[720px] w-full" : "pb-fill-viewport flex w-full flex-1 flex-col"} style={{ background: "inherit" }}>
      {showEmpty ? (
        <div className="p-6">
          <CanvasAddButton parentId={id} variant="page" />
        </div>
      ) : (
        children
      )}
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
