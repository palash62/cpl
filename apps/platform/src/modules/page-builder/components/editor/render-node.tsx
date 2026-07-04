"use client";

import type { ReactNode } from "react";
import { useNode } from "@craftjs/core";
import { cn } from "@/lib/utils";

export function RenderNode({ render }: { render: ReactNode }) {
  const { id, selected, hovered } = useNode((node) => ({
    selected: node.events.selected,
    hovered: node.events.hovered,
  }));

  if (id === "ROOT") return <>{render}</>;

  return (
    <div
      data-craft-node={id}
      className={cn(
        "relative transition-shadow",
        selected && "z-10 ring-2 ring-indigo-500 ring-offset-2",
        !selected && hovered && "ring-1 ring-indigo-400/60 ring-offset-1",
      )}
    >
      {render}
    </div>
  );
}
