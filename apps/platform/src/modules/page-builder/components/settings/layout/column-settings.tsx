"use client";

import { useNode } from "@craftjs/core";
import { GeneralFields } from "@/modules/page-builder/components/settings/shared/block-settings";
import { WidthControl } from "@/modules/page-builder/components/settings/ghl/controls";
import type { BlockProps } from "@/modules/page-builder/types/block-props";

export function ColumnSettings() {
  const { layout, actions: { setProp } } = useNode((node) => ({
    layout: node.data.props.layout as BlockProps["layout"],
  }));

  return (
    <div className="space-y-4">
      <GeneralFields />
      <WidthControl
        label="Width"
        value={layout?.width ?? "100%"}
        onChange={(value) => setProp((p: BlockProps) => {
          p.layout = { ...(p.layout ?? {}), width: value };
        })}
      />
    </div>
  );
}
