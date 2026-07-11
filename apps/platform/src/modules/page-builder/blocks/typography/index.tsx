"use client";

import type { CSSProperties, ElementType } from "react";
import { useNode, useEditor } from "@craftjs/core";
import { BlockWrapper } from "@/modules/page-builder/blocks/block-wrapper";
import {
  StandardSettings,
  FieldLabel,
  FieldInput,
  BUILDER_CHECKBOX_LABEL,
  BUILDER_FIELD_INPUT,
} from "@/modules/page-builder/components/settings/shared/block-settings";
import { ListItemEditor } from "@/modules/page-builder/components/settings/shared/list-editor";
import { ListAppearancePanel } from "@/modules/page-builder/components/settings/ghl/list-appearance-panel";
import { RichTextField } from "@/modules/page-builder/components/editor/rich-text-field";
import { stripHtmlToPlain } from "@/modules/page-builder/lib/rich-text";
import {
  ListMarker,
  listAlignItemsFromTextAlign,
  parseMarkerSizePx,
  usesFlexListMarkers,
  type ListMarkerStyle,
} from "@/modules/page-builder/lib/list-marker";
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
        <FieldInput
          value={stripHtmlToPlain(text ?? "")}
          onChange={(e) => setProp((p: HeadingProps) => { p.text = e.target.value; })}
        />
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
  const { enabled } = useEditor((state) => ({ enabled: state.options.enabled }));
  const { actions: { setProp } } = useNode();

  return (
    <BlockWrapper {...props} as="div">
      {enabled ? (
        <div role="heading" aria-level={level} className="m-0">
          <RichTextField
            value={text ?? ""}
            editable
            onChange={(html) => setProp((p: HeadingProps) => { p.text = html; })}
          />
        </div>
      ) : (
        <Tag className="m-0">
          <RichTextField
            value={text ?? ""}
            editable={false}
            onChange={() => {}}
          />
        </Tag>
      )}
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
          value={stripHtmlToPlain(text ?? "")}
          onChange={(e) => setProp((p: ParagraphProps) => { p.text = e.target.value; })}
        />
      </div>
      <StandardSettings />
    </div>
  );
}

export function Paragraph({ text = "Paragraph text", ...props }: ParagraphProps) {
  const { enabled } = useEditor((state) => ({ enabled: state.options.enabled }));
  const { actions: { setProp } } = useNode();
  return (
    <BlockWrapper {...props} as="div" className="pb-paragraph">
      <RichTextField
        value={text ?? ""}
        editable={enabled}
        onChange={(html) => setProp((p: ParagraphProps) => { p.text = html; })}
      />
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

type ListProps = BlockProps & {
  items?: string[];
  ordered?: boolean;
  markerStyle?: ListMarkerStyle;
  markerIcon?: string;
  markerColor?: string;
  markerSize?: string;
  itemGap?: string;
};

function ListSettings() {
  const { items, ordered, actions: { setProp } } = useNode((node) => ({
    items: node.data.props.items as string[],
    ordered: node.data.props.ordered as boolean,
  }));
  const listItems = (items ?? []).map((item) => ({ text: stripHtmlToPlain(item) }));

  return (
    <div className="space-y-3">
      <p className="text-[11px] leading-snug text-slate-500">
        Click item text on the canvas to edit inline. Use the fields below to add or remove lines.
      </p>
      <label className={BUILDER_CHECKBOX_LABEL}>
        <input
          type="checkbox"
          className="accent-indigo-500"
          checked={!!ordered}
          onChange={(e) => setProp((p: ListProps) => { p.ordered = e.target.checked; })}
        />
        Ordered list
      </label>
      <ListItemEditor
        items={listItems}
        fields={[{ key: "text", label: "Item text", multiline: true }]}
        onChange={(next) =>
          setProp((p: ListProps) => {
            p.items = next.map((row) => row.text).filter(Boolean);
          })
        }
        createItem={() => ({ text: "New item" })}
      />
      <ListAppearancePanel compact />
      <StandardSettings />
    </div>
  );
}

function ListItem({
  item,
  index,
  enabled,
  ordered,
  markerStyle,
  markerIcon,
  markerColor,
  markerSizePx,
  itemGap,
  useFlex,
  onChange,
}: {
  item: string;
  index: number;
  enabled: boolean;
  ordered: boolean;
  markerStyle: ListMarkerStyle;
  markerIcon?: string;
  markerColor?: string;
  markerSizePx: number;
  itemGap: string;
  useFlex: boolean;
  onChange: (index: number, html: string) => void;
}) {
  if (!useFlex) {
    return (
      <li>
        <RichTextField
          value={item}
          editable={enabled}
          onChange={(html) => onChange(index, html)}
        />
      </li>
    );
  }

  const effectiveStyle = markerStyle === "number" || (ordered && markerStyle !== "disc")
    ? "number"
    : markerStyle;

  return (
    <li
      className="flex items-start"
      style={{ gap: itemGap, marginBottom: itemGap }}
    >
      <ListMarker
        style={effectiveStyle}
        icon={markerIcon}
        color={markerColor}
        sizePx={markerSizePx}
        index={index}
        ordered={ordered}
      />
      <RichTextField
        value={item}
        editable={enabled}
        className="min-w-0 flex-1"
        onChange={(html) => onChange(index, html)}
      />
    </li>
  );
}

export function List({
  items = ["Item one", "Item two"],
  ordered = false,
  markerStyle = "disc",
  markerIcon,
  markerColor,
  markerSize,
  itemGap = "12px",
  ...props
}: ListProps) {
  const Tag = ordered ? "ol" : "ul";
  const { enabled } = useEditor((state) => ({ enabled: state.options.enabled }));
  const { actions: { setProp } } = useNode();

  const useFlex = usesFlexListMarkers(markerStyle, ordered);
  const textAlign = props.typography?.textAlign ?? props.layout?.textAlign;
  const markerSizePx = parseMarkerSizePx(markerSize, props.typography?.fontSize);

  const listExtraStyle: CSSProperties = useFlex
    ? {
        listStyle: "none",
        padding: 0,
        margin: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: listAlignItemsFromTextAlign(textAlign),
        width: "100%",
      }
    : {};

  return (
    <BlockWrapper {...props} as={Tag} className="pb-list" extraStyle={listExtraStyle}>
      {(items ?? []).map((item, i) => (
        <ListItem
          key={i}
          item={item}
          index={i}
          enabled={enabled}
          ordered={ordered}
          markerStyle={markerStyle}
          markerIcon={markerIcon}
          markerColor={markerColor}
          markerSizePx={markerSizePx}
          itemGap={itemGap}
          useFlex={useFlex}
          onChange={(index, html) =>
            setProp((p: ListProps) => {
              const next = [...(p.items ?? [])];
              next[index] = html;
              p.items = next;
            })
          }
        />
      ))}
    </BlockWrapper>
  );
}

List.craft = {
  displayName: "List",
  props: {
    items: ["Benefit one", "Benefit two", "Benefit three"],
    ordered: false,
    markerStyle: "disc",
    itemGap: "12px",
    typography: { color: "#334155", lineHeight: "1.5" },
  },
  related: { settings: ListSettings },
};
