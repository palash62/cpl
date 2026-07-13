"use client";

import { useNode } from "@craftjs/core";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { BlockProps, Breakpoint } from "@/modules/page-builder/types/block-props";
import {
  BUILDER_TAB_LIST,
  BUILDER_TAB_TRIGGER,
  BUILDER_FIELD_LABEL,
  BUILDER_FIELD_INPUT,
  BUILDER_CHECKBOX_LABEL,
  GHL_TAB_LIST,
  GHL_TAB_TRIGGER,
  GHL_FIELD_LABEL,
  GHL_FIELD_INPUT,
} from "@/modules/page-builder/lib/builder-panel-styles";
import { useBuilderSettingsLayout } from "@/modules/page-builder/lib/builder-settings-context";
import { useBuilderStore } from "@/modules/page-builder/lib/builder-store";
import { resolveEffectiveTypography } from "@/modules/page-builder/lib/responsive";
import { ColorField } from "@/modules/page-builder/components/settings/ghl/controls";
import { cn } from "@/lib/utils";

function setNestedProp(
  setProp: (cb: (props: BlockProps) => void) => void,
  bucket: "typography" | "layout" | "style",
  key: string,
  value: string | number,
  breakpoint: Breakpoint = "desktop",
) {
  setProp((props: BlockProps) => {
    const shouldClear = value === "" || value === undefined;
    if (breakpoint === "desktop") {
      const current = { ...((props[bucket] as Record<string, string | number | undefined>) ?? {}) };
      if (shouldClear) delete current[key];
      else current[key] = value;
      (props as Record<string, unknown>)[bucket] = current;
      return;
    }
    const existing = props.responsive?.[breakpoint] ?? {};
    const bucketCurrent = {
      ...((existing[bucket] as Record<string, string | number | undefined> | undefined) ?? {}),
    };
    if (shouldClear) delete bucketCurrent[key];
    else bucketCurrent[key] = value;
    props.responsive = {
      ...(props.responsive ?? {}),
      [breakpoint]: { ...existing, [bucket]: bucketCurrent },
    };
  });
}

export function setBlockPropAtBreakpoint(
  setProp: (cb: (props: BlockProps) => void) => void,
  bucket: "typography" | "layout" | "style",
  key: string,
  value: string | number,
  breakpoint: Breakpoint,
) {
  setNestedProp(setProp, bucket, key, value, breakpoint);
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  const layout = useBuilderSettingsLayout();
  return (
    <Label className={layout === "ghl" ? GHL_FIELD_LABEL : BUILDER_FIELD_LABEL}>{children}</Label>
  );
}

function FieldInput({ className, ...props }: React.ComponentProps<typeof Input>) {
  const layout = useBuilderSettingsLayout();
  return (
    <Input
      className={cn(layout === "ghl" ? GHL_FIELD_INPUT : BUILDER_FIELD_INPUT, className)}
      {...props}
    />
  );
}

export function GeneralFields() {
  const layout = useBuilderSettingsLayout();
  const isGhl = layout === "ghl";
  const { name, visible, actions: { setProp } } = useNode((node) => ({
    name: node.data.props.name as string | undefined,
    visible: node.data.props.visible as boolean | undefined,
  }));

  return (
    <div className={cn(isGhl ? "space-y-2.5" : "space-y-3 pt-2")}>
      <div className={cn(isGhl ? "space-y-1" : "space-y-1.5")}>
        <FieldLabel>Name</FieldLabel>
        <FieldInput value={name ?? ""} onChange={(e) => setProp((p: BlockProps) => { p.name = e.target.value; })} />
      </div>
      <label className={cn(BUILDER_CHECKBOX_LABEL, isGhl && "text-[11px] text-slate-600")}>
        <input
          type="checkbox"
          className={isGhl ? "accent-blue-600" : "accent-indigo-500"}
          checked={visible !== false}
          onChange={(e) => setProp((p: BlockProps) => { p.visible = e.target.checked; })}
        />
        Visible
      </label>
    </div>
  );
}

const FONT_FAMILY_OPTIONS = [
  { label: "Inter", value: "Inter, system-ui, sans-serif" },
  { label: "System UI", value: "system-ui, -apple-system, sans-serif" },
  { label: "Arial", value: "Arial, Helvetica, sans-serif" },
  { label: "Helvetica", value: "Helvetica, Arial, sans-serif" },
  { label: "Georgia", value: "Georgia, Times New Roman, serif" },
  { label: "Times New Roman", value: "\"Times New Roman\", Times, serif" },
  { label: "Courier New", value: "\"Courier New\", Courier, monospace" },
  { label: "Montserrat", value: "Montserrat, Inter, sans-serif" },
  { label: "Roboto", value: "Roboto, Inter, sans-serif" },
  { label: "Open Sans", value: "\"Open Sans\", Inter, sans-serif" },
] as const;

const TEXT_ALIGN_OPTIONS = [
  { label: "Left", value: "left" },
  { label: "Center", value: "center" },
  { label: "Right", value: "right" },
  { label: "Justify", value: "justify" },
] as const;

function parseFontSizePx(value: string | undefined): number {
  if (!value) return 16;
  const trimmed = value.trim();
  if (trimmed.endsWith("rem")) {
    const n = parseFloat(trimmed);
    return Number.isFinite(n) ? Math.round(n * 16) : 16;
  }
  if (trimmed.endsWith("px")) {
    const n = parseFloat(trimmed);
    return Number.isFinite(n) ? Math.round(n) : 16;
  }
  const n = parseFloat(trimmed);
  return Number.isFinite(n) ? Math.round(n) : 16;
}

function FieldSelect({ className, ...props }: React.ComponentProps<"select">) {
  const layout = useBuilderSettingsLayout();
  return (
    <select
      className={cn(
        "w-full rounded-md border px-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-blue-500/30",
        layout === "ghl" ? "h-8 border-slate-200 bg-white text-xs text-slate-900" : BUILDER_FIELD_INPUT,
        className,
      )}
      {...props}
    />
  );
}

export function TypographyFields() {
  const layout = useBuilderSettingsLayout();
  const isGhl = layout === "ghl";
  const styleBreakpoint = useBuilderStore((s) => s.styleBreakpoint);
  const activeBreakpoint: Breakpoint = isGhl ? styleBreakpoint : "desktop";
  const { typography, responsive, actions: { setProp } } = useNode((node) => ({
    typography: node.data.props.typography as BlockProps["typography"],
    responsive: node.data.props.responsive as BlockProps["responsive"],
  }));
  const t = resolveEffectiveTypography(
    { typography, responsive },
    activeBreakpoint,
  ) ?? {};
  const fontSizePx = parseFontSizePx(t.fontSize);
  const fontFamilyValue = t.fontFamily ?? "";
  const knownFamily = FONT_FAMILY_OPTIONS.some((opt) => opt.value === fontFamilyValue);

  return (
    <div className={cn(isGhl ? "space-y-2" : "space-y-2.5 pt-2")}>
      <div className={cn(isGhl ? "space-y-1" : "space-y-1.5")}>
        <FieldLabel>Font family</FieldLabel>
        <FieldSelect
          value={knownFamily ? fontFamilyValue : FONT_FAMILY_OPTIONS[0].value}
          onChange={(e) =>
            setNestedProp(setProp, "typography", "fontFamily", e.target.value, activeBreakpoint)
          }
        >
          {!knownFamily && fontFamilyValue ? (
            <option value={fontFamilyValue}>{fontFamilyValue}</option>
          ) : null}
          {FONT_FAMILY_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </FieldSelect>
      </div>

      <div className={cn(isGhl ? "space-y-1" : "space-y-1.5")}>
        <div className="flex items-center justify-between gap-2">
          <FieldLabel>Font size</FieldLabel>
          <span className={cn("text-[11px]", isGhl ? "text-slate-500" : "text-slate-400")}>
            {fontSizePx}px
          </span>
        </div>
        <input
          type="range"
          min={10}
          max={96}
          step={1}
          value={fontSizePx}
          onChange={(e) =>
            setNestedProp(setProp, "typography", "fontSize", `${e.target.value}px`, activeBreakpoint)
          }
          className="h-1.5 w-full accent-blue-600"
        />
      </div>

      <div className={cn(isGhl ? "space-y-1" : "space-y-1.5")}>
        <FieldLabel>Text align</FieldLabel>
        <FieldSelect
          value={t.textAlign ?? "left"}
          onChange={(e) =>
            setNestedProp(setProp, "typography", "textAlign", e.target.value, activeBreakpoint)
          }
        >
          {TEXT_ALIGN_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </FieldSelect>
      </div>

      <div className={cn(isGhl ? "space-y-1" : "space-y-1.5")}>
        <FieldLabel>Weight</FieldLabel>
        <FieldInput
          value={String(t.fontWeight ?? "")}
          placeholder="400"
          onChange={(e) =>
            setNestedProp(setProp, "typography", "fontWeight", e.target.value, activeBreakpoint)
          }
        />
      </div>

      <div className={cn(isGhl ? "space-y-1" : "space-y-1.5")}>
        <FieldLabel>Color</FieldLabel>
        <ColorField
          value={String(t.color ?? "")}
          onChange={(v) => setNestedProp(setProp, "typography", "color", v, activeBreakpoint)}
          onClear={() => setNestedProp(setProp, "typography", "color", "", activeBreakpoint)}
          placeholder="#000000"
          fallbackHex="#000000"
          clearLabel="Remove color"
        />
      </div>

      {[
        ["lineHeight", "Line height", "1.5"],
        ["letterSpacing", "Letter spacing", "normal"],
      ].map(([key, label, placeholder]) => (
        <div key={key} className={cn(isGhl ? "space-y-1" : "space-y-1.5")}>
          <FieldLabel>{label}</FieldLabel>
          <FieldInput
            value={String(t[key as keyof typeof t] ?? "")}
            placeholder={placeholder}
            onChange={(e) =>
              setNestedProp(setProp, "typography", key, e.target.value, activeBreakpoint)
            }
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
      <ColorField
        label="Background"
        value={String(s.backgroundColor ?? "")}
        onChange={(v) => setNestedProp(setProp, "style", "backgroundColor", v)}
        onClear={() => setNestedProp(setProp, "style", "backgroundColor", "")}
        placeholder="#ffffff"
      />
      {[
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
  const layout = useBuilderSettingsLayout();
  const isGhl = layout === "ghl";
  const { animation, actions: { setProp } } = useNode((node) => ({
    animation: node.data.props.animation as BlockProps["animation"],
  }));
  const a = animation ?? {};

  return (
    <div className={cn(isGhl ? "space-y-2.5" : "space-y-2.5 pt-2")}>
      <div className={cn(isGhl ? "space-y-1" : "space-y-1.5")}>
        <FieldLabel>Animation</FieldLabel>
        <select
          className={cn(
            "w-full rounded-md border px-2",
            isGhl ? "h-8 border-slate-200 bg-white text-xs text-slate-900" : cn("py-1.5 text-sm", BUILDER_FIELD_INPUT),
          )}
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
      <div className={cn(isGhl ? "space-y-1" : "space-y-1.5")}>
        <FieldLabel>Duration</FieldLabel>
        <FieldInput
          value={a.duration ?? "0.5s"}
          onChange={(e) => setProp((p: BlockProps) => { p.animation = { ...a, duration: e.target.value }; })}
        />
      </div>
      <div className={cn(isGhl ? "space-y-1" : "space-y-1.5")}>
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
  const layout = useBuilderSettingsLayout();
  if (layout === "ghl") return null;

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
