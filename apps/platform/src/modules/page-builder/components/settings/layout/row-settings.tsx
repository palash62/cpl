"use client";

import { useNode } from "@craftjs/core";
import { GeneralFields } from "@/modules/page-builder/components/settings/shared/block-settings";
import { AlignControl, WidthControl } from "@/modules/page-builder/components/settings/ghl/controls";
import type { BlockProps } from "@/modules/page-builder/types/block-props";

export function RowSettings() {
  const { columns, layout, actions: { setProp } } = useNode((node) => ({
    columns: node.data.props.columns as number | undefined,
    layout: node.data.props.layout as BlockProps["layout"],
  }));

  return (
    <div className="space-y-3">
      <GeneralFields />
      <div className="space-y-1">
        <label className="text-[11px] font-medium text-slate-600">Columns</label>
        <select
          className="h-8 w-full rounded-md border border-slate-200 px-2 text-xs"
          value={columns ?? 2}
          onChange={(e) => setProp((p: BlockProps & { columns?: number }) => {
            const count = parseInt(e.target.value, 10);
            p.columns = count;
            p.name = count === 1 ? "1 Column Row" : `${count} Column Row`;
          })}
        >
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <option key={n} value={n}>{n} column{n > 1 ? "s" : ""}</option>
          ))}
        </select>
      </div>
      <AlignControl
        label="Align"
        mode="flex"
        value={layout?.justifyContent ?? "center"}
        onChange={(value) => setProp((p: BlockProps) => {
          p.layout = { ...(p.layout ?? {}), justifyContent: value };
        })}
      />
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
