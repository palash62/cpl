"use client";

import type { ElementType } from "react";
import { useNode } from "@craftjs/core";
import { BlockWrapper } from "@/modules/page-builder/blocks/block-wrapper";
import {
  StandardSettings,
  FieldLabel,
  FieldInput,
  BUILDER_CHECKBOX_LABEL,
  BUILDER_FIELD_INPUT,
} from "@/modules/page-builder/components/settings/shared/block-settings";
import { cn } from "@/lib/utils";
import type { BlockProps } from "@/modules/page-builder/types/block-props";

type HeadingProps = BlockProps & { text?: string; level?: 1 | 2 | 3 | 4 | 5 | 6 };

function HeadingSettings() {
  const { text, level, actions: { setProp } } = useNode((node) => ({
    text: node.data.props.text as string,
    level: node.data.props.level as number,
  }));
  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <FieldLabel>Text</FieldLabel>
        <FieldInput value={text ?? ""} onChange={(e) => setProp((p: HeadingProps) => { p.text = e.target.value; })} />
      </div>
      <div className="space-y-1.5">
        <FieldLabel>Level</FieldLabel>
        <select
          className={cn("w-full rounded-md border px-2 py-1.5 text-sm", BUILDER_FIELD_INPUT)}
          value={level ?? 2}
          onChange={(e) => setProp((p: HeadingProps) => { p.level = parseInt(e.target.value, 10) as HeadingProps["level"]; })}
        >
          {[1, 2, 3, 4, 5, 6].map((n) => <option key={n} value={n}>H{n}</option>)}
        </select>
      </div>
      <StandardSettings />
    </div>
  );
}

export function Heading({ text = "Heading", level = 2, ...props }: HeadingProps) {
  const Tag = `h${level}` as ElementType;
  return (
    <BlockWrapper {...props} as={Tag}>
      {text}
    </BlockWrapper>
  );
}

Heading.craft = {
  displayName: "Heading",
  props: {
    text: "Heading",
    level: 2,
    typography: { fontSize: "2rem", fontWeight: "700", color: "#0f172a" },
  },
  related: { settings: HeadingSettings },
};

type ParagraphProps = BlockProps & { text?: string };

function ParagraphSettings() {
  const { text, actions: { setProp } } = useNode((node) => ({
    text: node.data.props.text as string,
  }));
  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <FieldLabel>Text</FieldLabel>
        <textarea
          className={cn("w-full min-h-[80px] rounded-md border px-2 py-1.5 text-sm", BUILDER_FIELD_INPUT)}
          value={text ?? ""}
          onChange={(e) => setProp((p: ParagraphProps) => { p.text = e.target.value; })}
        />
      </div>
      <StandardSettings />
    </div>
  );
}

export function Paragraph({ text = "Paragraph text", ...props }: ParagraphProps) {
  return (
    <BlockWrapper {...props} as="p">
      {text}
    </BlockWrapper>
  );
}

Paragraph.craft = {
  displayName: "Paragraph",
  props: {
    text: "Paragraph text",
    typography: { fontSize: "1rem", lineHeight: "1.6", color: "#475569" },
  },
  related: { settings: ParagraphSettings },
};

type ListProps = BlockProps & { items?: string[]; ordered?: boolean };

function ListSettings() {
  const { items, ordered, actions: { setProp } } = useNode((node) => ({
    items: node.data.props.items as string[],
    ordered: node.data.props.ordered as boolean,
  }));
  return (
    <div className="space-y-3">
      <label className={BUILDER_CHECKBOX_LABEL}>
        <input type="checkbox" className="accent-indigo-500" checked={!!ordered} onChange={(e) => setProp((p: ListProps) => { p.ordered = e.target.checked; })} />
        Ordered list
      </label>
      <div className="space-y-1.5">
        <FieldLabel>Items (one per line)</FieldLabel>
        <textarea
          className={cn("w-full min-h-[100px] rounded-md border px-2 py-1.5 text-sm", BUILDER_FIELD_INPUT)}
          value={(items ?? []).join("\n")}
          onChange={(e) => setProp((p: ListProps) => { p.items = e.target.value.split("\n").filter(Boolean); })}
        />
      </div>
      <StandardSettings />
    </div>
  );
}

export function List({ items = ["Item one", "Item two"], ordered = false, ...props }: ListProps) {
  const Tag = ordered ? "ol" : "ul";
  return (
    <BlockWrapper {...props} as={Tag}>
      {items.map((item, i) => <li key={i}>{item}</li>)}
    </BlockWrapper>
  );
}

List.craft = {
  displayName: "List",
  props: { items: ["Benefit one", "Benefit two", "Benefit three"], ordered: false },
  related: { settings: ListSettings },
};
