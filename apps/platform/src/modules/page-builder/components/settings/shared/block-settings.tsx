"use client";

import { useNode } from "@craftjs/core";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { BlockProps } from "@/modules/page-builder/types/block-props";
import {
  BUILDER_TAB_LIST,
  BUILDER_TAB_TRIGGER,
  BUILDER_FIELD_LABEL,
  BUILDER_FIELD_INPUT,
  BUILDER_CHECKBOX_LABEL,
} from "@/modules/page-builder/lib/builder-panel-styles";
import { cn } from "@/lib/utils";

function setNestedProp(
  setProp: (cb: (props: BlockProps) => void) => void,
  bucket: "typography" | "layout" | "style",
  key: string,
  value: string | number,
) {
  setProp((props: BlockProps) => {
    const current = { ...((props[bucket] as Record<string, string | number | undefined>) ?? {}) };
    current[key] = value;
    (props as Record<string, unknown>)[bucket] = current;
  });
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <Label className={BUILDER_FIELD_LABEL}>{children}</Label>;
}

function FieldInput({ className, ...props }: React.ComponentProps<typeof Input>) {
  return <Input className={cn(BUILDER_FIELD_INPUT, className)} {...props} />;
}

export function GeneralFields() {
  const { name, visible, actions: { setProp } } = useNode((node) => ({
    name: node.data.props.name as string | undefined,
    visible: node.data.props.visible as boolean | undefined,
  }));

  return (
    <div className="space-y-3 pt-2">
      <div className="space-y-1.5">
        <FieldLabel>Name</FieldLabel>
        <FieldInput value={name ?? ""} onChange={(e) => setProp((p: BlockProps) => { p.name = e.target.value; })} />
      </div>
      <label className={BUILDER_CHECKBOX_LABEL}>
        <input
          type="checkbox"
          className="accent-indigo-500"
          checked={visible !== false}
          onChange={(e) => setProp((p: BlockProps) => { p.visible = e.target.checked; })}
        />
        Visible
      </label>
    </div>
  );
}

export function TypographyFields() {
  const { typography, actions: { setProp } } = useNode((node) => ({
    typography: node.data.props.typography as BlockProps["typography"],
  }));
  const t = typography ?? {};

  return (
    <div className="space-y-2.5 pt-2">
      {[
        ["fontSize", "Font size", "1rem"],
        ["fontWeight", "Weight", "400"],
        ["color", "Color", "#000000"],
        ["textAlign", "Align", "left"],
        ["lineHeight", "Line height", "1.5"],
        ["letterSpacing", "Letter spacing", "normal"],
      ].map(([key, label, placeholder]) => (
        <div key={key} className="space-y-1.5">
          <FieldLabel>{label}</FieldLabel>
          <FieldInput
            value={String(t[key as keyof typeof t] ?? "")}
            placeholder={placeholder}
            onChange={(e) => setNestedProp(setProp, "typography", key, e.target.value)}
          />
        </div>
      ))}
    </div>
  );
}

export function LayoutFields() {
  const { layout, actions: { setProp } } = useNode((node) => ({
    layout: node.data.props.layout as BlockProps["layout"],
  }));
  const l = layout ?? {};

  return (
    <div className="space-y-2.5 pt-2">
      {[
        ["width", "Width"],
        ["height", "Height"],
        ["margin", "Margin"],
        ["padding", "Padding"],
        ["gap", "Gap"],
        ["display", "Display"],
        ["flexDirection", "Flex direction"],
        ["justifyContent", "Justify"],
        ["alignItems", "Align items"],
      ].map(([key, label]) => (
        <div key={key} className="space-y-1.5">
          <FieldLabel>{label}</FieldLabel>
          <FieldInput
            value={String(l[key as keyof typeof l] ?? "")}
            onChange={(e) => setNestedProp(setProp, "layout", key, e.target.value)}
          />
        </div>
      ))}
    </div>
  );
}

export function StyleFields() {
  const { style, actions: { setProp } } = useNode((node) => ({
    style: node.data.props.style as BlockProps["style"],
  }));
  const s = style ?? {};

  return (
    <div className="space-y-2.5 pt-2">
      {[
        ["backgroundColor", "Background"],
        ["backgroundImage", "BG image URL"],
        ["backgroundGradient", "Gradient"],
        ["border", "Border"],
        ["borderRadius", "Radius"],
        ["boxShadow", "Shadow"],
      ].map(([key, label]) => (
        <div key={key} className="space-y-1.5">
          <FieldLabel>{label}</FieldLabel>
          <FieldInput
            value={String(s[key as keyof typeof s] ?? "")}
            onChange={(e) => setNestedProp(setProp, "style", key, e.target.value)}
          />
        </div>
      ))}
      <div className="space-y-1.5">
        <FieldLabel>Opacity (0-1)</FieldLabel>
        <FieldInput
          type="number"
          min={0}
          max={1}
          step={0.1}
          value={s.opacity ?? 1}
          onChange={(e) => setNestedProp(setProp, "style", "opacity", parseFloat(e.target.value) || 1)}
        />
      </div>
    </div>
  );
}

export function AnimationFields() {
  const { animation, actions: { setProp } } = useNode((node) => ({
    animation: node.data.props.animation as BlockProps["animation"],
  }));
  const a = animation ?? {};

  return (
    <div className="space-y-2.5 pt-2">
      <div className="space-y-1.5">
        <FieldLabel>Animation</FieldLabel>
        <select
          className={cn("w-full rounded-md border px-2 py-1.5 text-sm", BUILDER_FIELD_INPUT)}
          value={a.type ?? "none"}
          onChange={(e) => setProp((p: BlockProps) => {
            p.animation = { ...a, type: e.target.value as "none" | "fade" | "slide" | "zoom" };
          })}
        >
          <option value="none">None</option>
          <option value="fade">Fade</option>
          <option value="slide">Slide</option>
          <option value="zoom">Zoom</option>
        </select>
      </div>
      <div className="space-y-1.5">
        <FieldLabel>Duration</FieldLabel>
        <FieldInput
          value={a.duration ?? "0.5s"}
          onChange={(e) => setProp((p: BlockProps) => { p.animation = { ...a, duration: e.target.value }; })}
        />
      </div>
      <div className="space-y-1.5">
        <FieldLabel>Delay</FieldLabel>
        <FieldInput
          value={a.delay ?? "0s"}
          onChange={(e) => setProp((p: BlockProps) => { p.animation = { ...a, delay: e.target.value }; })}
        />
      </div>
    </div>
  );
}

export function ResponsiveFields() {
  const { responsive, actions: { setProp } } = useNode((node) => ({
    responsive: node.data.props.responsive as BlockProps["responsive"],
  }));

  return (
    <Tabs defaultValue="tablet" className="pt-2">
      <TabsList className={BUILDER_TAB_LIST}>
        <TabsTrigger value="tablet" className={BUILDER_TAB_TRIGGER}>Tablet</TabsTrigger>
        <TabsTrigger value="mobile" className={BUILDER_TAB_TRIGGER}>Mobile</TabsTrigger>
      </TabsList>
      {(["tablet", "mobile"] as const).map((bp) => (
        <TabsContent key={bp} value={bp} className="space-y-2.5">
          <label className={BUILDER_CHECKBOX_LABEL}>
            <input
              type="checkbox"
              className="accent-indigo-500"
              checked={responsive?.[bp]?.visible !== false}
              onChange={(e) => setProp((p: BlockProps) => {
                p.responsive = {
                  ...p.responsive,
                  [bp]: { ...p.responsive?.[bp], visible: e.target.checked },
                };
              })}
            />
            Visible on {bp}
          </label>
          <div className="space-y-1.5">
            <FieldLabel>Padding override</FieldLabel>
            <FieldInput
              value={responsive?.[bp]?.layout?.padding ?? ""}
              placeholder="e.g. 16px"
              onChange={(e) => setProp((p: BlockProps) => {
                p.responsive = {
                  ...p.responsive,
                  [bp]: {
                    ...p.responsive?.[bp],
                    layout: { ...p.responsive?.[bp]?.layout, padding: e.target.value },
                  },
                };
              })}
            />
          </div>
        </TabsContent>
      ))}
    </Tabs>
  );
}

export function StandardSettings() {
  return (
    <Tabs defaultValue="general">
      <TabsList className={BUILDER_TAB_LIST}>
        <TabsTrigger value="general" className={BUILDER_TAB_TRIGGER}>General</TabsTrigger>
        <TabsTrigger value="typography" className={BUILDER_TAB_TRIGGER}>Type</TabsTrigger>
        <TabsTrigger value="layout" className={BUILDER_TAB_TRIGGER}>Layout</TabsTrigger>
        <TabsTrigger value="style" className={BUILDER_TAB_TRIGGER}>Style</TabsTrigger>
        <TabsTrigger value="animation" className={BUILDER_TAB_TRIGGER}>Anim</TabsTrigger>
        <TabsTrigger value="responsive" className={BUILDER_TAB_TRIGGER}>Responsive</TabsTrigger>
      </TabsList>
      <TabsContent value="general"><GeneralFields /></TabsContent>
      <TabsContent value="typography"><TypographyFields /></TabsContent>
      <TabsContent value="layout"><LayoutFields /></TabsContent>
      <TabsContent value="style"><StyleFields /></TabsContent>
      <TabsContent value="animation"><AnimationFields /></TabsContent>
      <TabsContent value="responsive"><ResponsiveFields /></TabsContent>
    </Tabs>
  );
}

// Re-export for block-specific settings panels
export { FieldLabel, FieldInput, BUILDER_CHECKBOX_LABEL, BUILDER_FIELD_INPUT };
