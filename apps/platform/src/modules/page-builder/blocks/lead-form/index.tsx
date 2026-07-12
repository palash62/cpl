"use client";

import type { FormEvent, ReactNode, CSSProperties } from "react";
import { useState } from "react";
import { useNode, useEditor } from "@craftjs/core";
import { CanvasWrapper, BlockWrapper } from "@/modules/page-builder/blocks/block-wrapper";
import {
  StandardSettings,
  FieldLabel,
  FieldInput,
  BUILDER_CHECKBOX_LABEL,
  BUILDER_FIELD_INPUT,
  setBlockPropAtBreakpoint,
} from "@/modules/page-builder/components/settings/shared/block-settings";
import { cn } from "@/lib/utils";
import { ButtonAppearancePanel } from "@/modules/page-builder/components/settings/ghl/button-appearance-panel";
import { ButtonLabelContent } from "@/modules/page-builder/components/editor/button-label-content";
import { hoverEffectClass, resolveButtonStyle } from "@/modules/page-builder/lib/button-appearance";
import {
  buildButtonLayoutStyle,
  buttonIconSizePx,
  parseButtonFontSizePx,
} from "@/modules/page-builder/lib/button-layout";
import { stripHtmlToPlain } from "@/modules/page-builder/lib/rich-text";
import { buttonStyleFromTheme } from "@/modules/page-builder/lib/theme";
import {
  withoutStretchLayout,
  resolveFullWidthForBreakpoint,
  resolveTypographyForBreakpoint,
  setFullWidthAtBreakpoint,
} from "@/modules/page-builder/lib/responsive";
import { usePageTheme } from "@/modules/page-builder/hooks/use-page-theme";
import { usePublishedPage } from "@/modules/page-builder/lib/published-page-context";
import { useRenderBreakpoint } from "@/modules/page-builder/hooks/use-render-breakpoint";
import { useBuilderStore } from "@/modules/page-builder/lib/builder-store";
import { useBuilderSettingsLayout } from "@/modules/page-builder/lib/builder-settings-context";
import type { BlockProps, Breakpoint, ButtonAppearanceProps, TypographyProps } from "@/modules/page-builder/types/block-props";

const FORM_INPUT_STYLE: CSSProperties = {
  color: "var(--pb-input-text, #0f172a)",
  background: "var(--pb-input-bg, #ffffff)",
  borderColor: "var(--pb-input-border, #cbd5e1)",
  font: "inherit",
  colorScheme: "light",
};

function formFieldWrapperColor(typography?: TypographyProps): CSSProperties {
  return { color: typography?.color ?? "inherit" };
}

function formSurfaceTextColor(typography?: TypographyProps): string {
  return typography?.color ?? "var(--pb-form-surface-text, #0f172a)";
}

type LeadFormProps = BlockProps & {
  children?: ReactNode;
  successTitle?: string;
  successMessage?: string;
  landingPageSlug?: string;
  onSubmit?: (data: Record<string, string>) => Promise<void>;
};

function LeadFormSettings() {
  const {
    successTitle,
    successMessage,
    actions: { setProp },
  } = useNode((node) => ({
    successTitle: node.data.props.successTitle as string,
    successMessage: node.data.props.successMessage as string,
  }));

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <FieldLabel>Success title</FieldLabel>
        <FieldInput
          value={successTitle ?? ""}
          onChange={(e) =>
            setProp((p: LeadFormProps) => {
              p.successTitle = e.target.value;
            })
          }
        />
      </div>
      <div className="space-y-1.5">
        <FieldLabel>Success message</FieldLabel>
        <textarea
          className={cn("w-full min-h-[90px] rounded-md border px-2 py-1.5 text-sm", BUILDER_FIELD_INPUT)}
          value={successMessage ?? ""}
          onChange={(e) =>
            setProp((p: LeadFormProps) => {
              p.successMessage = e.target.value;
            })
          }
        />
      </div>
      <StandardSettings />
    </div>
  );
}

export function LeadForm({
  children,
  successTitle = "Thank you!",
  successMessage = "We'll be in touch soon.",
  landingPageSlug,
  onSubmit,
  ...props
}: LeadFormProps) {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const { enabled } = useEditor((state) => ({ enabled: state.options.enabled }));
  const theme = usePageTheme();
  const published = usePublishedPage();
  const slug = landingPageSlug ?? published.landingPageSlug;
  const submitHandler = onSubmit ?? published.onLeadSubmit;
  const successTitleText = successTitle ?? published.formJson?.successTitle ?? "Thank you!";
  const successMessageText = successMessage ?? published.formJson?.successMessage ?? "We'll be in touch soon.";

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!slug || !submitHandler) return;
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const data: Record<string, string> = {};
    formData.forEach((v, k) => { if (k !== "honeypot") data[k] = String(v); });
    try {
      await submitHandler(data);
      setSubmitted(true);
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    const { layout, ...rest } = props;
    return (
      <CanvasWrapper {...rest} layout={withoutStretchLayout(layout)}>
        <div className="rounded-lg border bg-green-50 p-6 text-center">
          <h3 className="text-green-800" style={{ fontWeight: 600 }}>{successTitleText}</h3>
          <p className="mt-2 text-green-700">{successMessageText}</p>
        </div>
      </CanvasWrapper>
    );
  }

  const formBody = (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <input type="text" name="honeypot" className="hidden" tabIndex={-1} autoComplete="off" />
      {children}
      {!children && <p className="opacity-60">Drop form fields here</p>}
      {slug && submitHandler && (
        <button
          type="submit"
          disabled={loading}
          style={buttonStyleFromTheme(theme, "primary", props.typography?.color)}
          className="px-4 py-2.5"
        >
          {loading ? "Submitting..." : "Submit"}
        </button>
      )}
    </form>
  );

  const { layout, ...rest } = props;

  return (
    <CanvasWrapper {...rest} layout={withoutStretchLayout(layout)}>
      <div
        className={cn(
          "rounded-3xl border border-slate-200/80 p-6",
          enabled ? "shadow-sm" : "shadow-xl",
        )}
        style={{
          background: "var(--pb-form-surface-bg, #ffffff)",
          color: formSurfaceTextColor(props.typography),
        }}
      >
        {formBody}
      </div>
    </CanvasWrapper>
  );
}

LeadForm.craft = {
  displayName: "Lead Form",
  props: { successTitle: "You're in!", successMessage: "Check your inbox for next steps." },
  rules: {
    canDrag: () => true,
    canMoveIn: (incoming: { name: string }[]) =>
      incoming.every((n) =>
        [
          "FormInput",
          "FormTextarea",
          "FormCheckbox",
          "FormRadio",
          "FormSelect",
          "SubmitButton",
          "Columns",
          "Column",
          "Row",
          "Container",
          "Paragraph",
          "Heading",
          "Text",
          "Spacer",
          "Divider",
        ].includes(n.name),
      ),
  },
  related: { settings: LeadFormSettings },
};

type FormFieldProps = BlockProps & {
  name?: string;
  label?: string;
  fieldType?: string;
  required?: boolean;
  placeholder?: string;
  options?: { label: string; value: string }[];
};

function FormFieldSettings() {
  const { p, displayName, actions: { setProp } } = useNode((node) => ({
    p: node.data.props as FormFieldProps,
    displayName: String(node.data.displayName ?? ""),
  }));
  const isInputLike = displayName === "Form Input" || displayName === "Textarea";
  const supportsOptions = displayName === "Radio" || displayName === "Dropdown";
  const supportsRequired = displayName !== "Checkbox";
  const optionsText = (p.options ?? []).map((opt) => `${opt.label}:${opt.value}`).join("\n");

  function updateOptions(raw: string) {
    const options = raw
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const [label, value] = line.includes(":")
          ? line.split(":")
          : [line, line.toLowerCase().replace(/\s+/g, "-")];
        return { label: label.trim(), value: value.trim() };
      });
    setProp((x: FormFieldProps) => {
      x.options = options;
    });
  }

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <FieldLabel>Field name</FieldLabel>
        <FieldInput value={String(p.name ?? "")} onChange={(e) => setProp((x: FormFieldProps) => { x.name = e.target.value; })} />
      </div>
      <div className="space-y-1.5">
        <FieldLabel>Label</FieldLabel>
        <FieldInput value={String(p.label ?? "")} onChange={(e) => setProp((x: FormFieldProps) => { x.label = e.target.value; })} />
      </div>
      {isInputLike && (
        <>
          <div className="space-y-1.5">
            <FieldLabel>Type</FieldLabel>
            <select
              className={cn("w-full rounded-md border px-2 py-1.5 text-sm", BUILDER_FIELD_INPUT)}
              value={String(p.fieldType ?? "text")}
              onChange={(e) => setProp((x: FormFieldProps) => { x.fieldType = e.target.value; })}
            >
              {["text", "email", "phone", "number", "date", "address", "city", "state", "country"].map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <FieldLabel>Placeholder</FieldLabel>
            <FieldInput
              value={String(p.placeholder ?? "")}
              onChange={(e) =>
                setProp((x: FormFieldProps) => {
                  x.placeholder = e.target.value;
                })
              }
            />
          </div>
        </>
      )}
      {supportsOptions && (
        <div className="space-y-1.5">
          <FieldLabel>Options (label:value per line)</FieldLabel>
          <textarea
            className={cn("w-full min-h-[100px] rounded-md border px-2 py-1.5 text-sm", BUILDER_FIELD_INPUT)}
            value={optionsText}
            onChange={(e) => updateOptions(e.target.value)}
          />
        </div>
      )}
      {supportsRequired && (
        <label className={BUILDER_CHECKBOX_LABEL}>
          <input type="checkbox" className="accent-indigo-500" checked={!!p.required} onChange={(e) => setProp((x: FormFieldProps) => { x.required = e.target.checked; })} />
          Required
        </label>
      )}
      <StandardSettings />
    </div>
  );
}

function renderInput(fieldType: string) {
  if (fieldType === "phone") return "tel";
  if (fieldType === "email") return "email";
  if (fieldType === "number") return "number";
  if (fieldType === "date") return "date";
  return "text";
}

export function FormInput({
  name = "field",
  label = "Field",
  fieldType = "text",
  required = false,
  placeholder = "",
  ...props
}: FormFieldProps) {
  return (
    <BlockWrapper {...props} extraStyle={formFieldWrapperColor(props.typography)} draggable>
      <label className="block">
        {label}{required && <span className="text-red-500"> *</span>}
        <input
          name={name}
          type={renderInput(fieldType)}
          required={required}
          placeholder={placeholder}
          className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 placeholder:text-slate-400"
          style={FORM_INPUT_STYLE}
        />
      </label>
    </BlockWrapper>
  );
}

FormInput.craft = {
  displayName: "Form Input",
  props: { name: "email", label: "Email", fieldType: "email", required: true, placeholder: "you@example.com" },
  related: { settings: FormFieldSettings },
};

export function FormTextarea({ name = "message", label = "Message", required = false, placeholder = "", ...props }: FormFieldProps) {
  return (
    <BlockWrapper {...props} extraStyle={formFieldWrapperColor(props.typography)} draggable>
      <label className="block">
        {label}{required && <span className="text-red-500"> *</span>}
        <textarea
          name={name}
          required={required}
          placeholder={placeholder}
          className="mt-1 min-h-[80px] w-full rounded-md border border-slate-300 bg-white px-3 py-2 placeholder:text-slate-400"
          style={FORM_INPUT_STYLE}
        />
      </label>
    </BlockWrapper>
  );
}

FormTextarea.craft = {
  displayName: "Textarea",
  props: { name: "message", label: "Message", fieldType: "textarea" },
  related: { settings: FormFieldSettings },
};

export function FormCheckbox({ name = "agree", label = "I agree", ...props }: FormFieldProps) {
  return (
    <BlockWrapper {...props} extraStyle={formFieldWrapperColor(props.typography)} draggable>
      <label className="flex items-center gap-2">
        <input type="checkbox" name={name} value="yes" />
        {label}
      </label>
    </BlockWrapper>
  );
}

FormCheckbox.craft = {
  displayName: "Checkbox",
  props: { name: "agree", label: "I agree to terms", fieldType: "checkbox" },
  related: { settings: FormFieldSettings },
};

export function FormRadio({ name = "choice", label = "Choose", options = [{ label: "Option A", value: "a" }], ...props }: FormFieldProps) {
  return (
    <BlockWrapper {...props} extraStyle={formFieldWrapperColor(props.typography)} draggable>
      <fieldset>
        <legend>{label}</legend>
        {options.map((opt) => (
          <label key={opt.value} className="mt-1 flex items-center gap-2">
            <input type="radio" name={name} value={opt.value} />
            {opt.label}
          </label>
        ))}
      </fieldset>
    </BlockWrapper>
  );
}

FormRadio.craft = {
  displayName: "Radio",
  props: { name: "choice", label: "Choose one", options: [{ label: "Option A", value: "a" }, { label: "Option B", value: "b" }] },
  related: { settings: FormFieldSettings },
};

export function FormSelect({ name = "select", label = "Select", options = [{ label: "Option 1", value: "1" }], required = false, ...props }: FormFieldProps) {
  return (
    <BlockWrapper {...props} extraStyle={formFieldWrapperColor(props.typography)} draggable>
      <label className="block">
        {label}
        <select
          name={name}
          required={required}
          className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2"
          style={FORM_INPUT_STYLE}
        >
          {options.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
        </select>
      </label>
    </BlockWrapper>
  );
}

FormSelect.craft = {
  displayName: "Dropdown",
  props: { name: "country", label: "Country", options: [{ label: "United States", value: "US" }, { label: "Canada", value: "CA" }] },
  related: { settings: FormFieldSettings },
};

type SubmitProps = BlockProps & {
  text?: string;
  fullWidth?: boolean;
  buttonAppearance?: ButtonAppearanceProps;
};

function SubmitButtonSettings() {
  const styleBreakpoint = useBuilderStore((s) => s.styleBreakpoint);
  const settingsLayout = useBuilderSettingsLayout();
  const isGhl = settingsLayout === "ghl";
  const activeBreakpoint: Breakpoint = isGhl ? styleBreakpoint : "desktop";
  const {
    text,
    fullWidth,
    typography,
    responsive,
    actions: { setProp },
  } = useNode((node) => ({
    text: node.data.props.text as string,
    fullWidth: Boolean(node.data.props.fullWidth),
    typography: node.data.props.typography as BlockProps["typography"],
    responsive: node.data.props.responsive as BlockProps["responsive"],
  }));
  const typographyForBp = resolveTypographyForBreakpoint(
    { typography, responsive } as BlockProps,
    activeBreakpoint,
    { blockType: "Submit Button" },
  );
  const fontSizePx = parseButtonFontSizePx(typographyForBp?.fontSize);
  const fullWidthForBp = resolveFullWidthForBreakpoint(
    { fullWidth, responsive },
    activeBreakpoint,
    { blockType: "Submit Button" },
  );

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <FieldLabel>Button text</FieldLabel>
        <FieldInput
          value={stripHtmlToPlain(text ?? "")}
          onChange={(e) =>
            setProp((p: SubmitProps) => {
              p.text = e.target.value;
            })
          }
        />
      </div>
      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-2">
          <FieldLabel>Button size</FieldLabel>
          <span className="text-[11px] text-slate-500">{fontSizePx}px</span>
        </div>
        <input
          type="range"
          min={12}
          max={48}
          step={1}
          value={fontSizePx}
          onChange={(e) =>
            setBlockPropAtBreakpoint(
              setProp,
              "typography",
              "fontSize",
              `${e.target.value}px`,
              activeBreakpoint,
            )
          }
          className="h-1.5 w-full accent-blue-600"
        />
      </div>
      <label className="flex items-center gap-2 text-xs text-slate-600">
        <input
          type="checkbox"
          className="accent-blue-600"
          checked={fullWidthForBp}
          onChange={(e) => setFullWidthAtBreakpoint(setProp, e.target.checked, activeBreakpoint)}
        />
        Full width
      </label>
      <ButtonAppearancePanel />
      <StandardSettings />
    </div>
  );
}

export function SubmitButton({
  text = "Submit",
  fullWidth = false,
  buttonAppearance,
  ...props
}: SubmitProps) {
  const theme = usePageTheme();
  const { enabled } = useEditor((state) => ({ enabled: state.options.enabled }));
  const { actions: { setProp } } = useNode();
  const breakpoint = useRenderBreakpoint();
  const typographyForBp = resolveTypographyForBreakpoint(props, breakpoint, { blockType: "Submit Button" });
  const isFullWidth = resolveFullWidthForBreakpoint(
    { fullWidth, responsive: props.responsive },
    breakpoint,
    { blockType: "Submit Button" },
  );
  const fontSizePx = parseButtonFontSizePx(typographyForBp?.fontSize);
  const hoverClass = hoverEffectClass(buttonAppearance?.hoverEffect);
  const buttonStyle = buildButtonLayoutStyle({
    fontSizePx,
    fullWidth: isFullWidth,
    baseStyle: resolveButtonStyle(theme, buttonAppearance, typographyForBp?.color),
    editorMode: enabled,
  });

  return (
    <BlockWrapper
      {...props}
      draggable
      typography={{ ...typographyForBp, fontSize: `${fontSizePx}px` }}
      layout={{ textAlign: "center", ...props.layout }}
    >
      <button
        type={enabled ? "button" : "submit"}
        form={enabled ? undefined : "pb-optin-form"}
        style={buttonStyle}
        className={hoverClass}
      >
        <ButtonLabelContent
          text={text ?? ""}
          editable={enabled}
          onChange={(html) => setProp((p: SubmitProps) => { p.text = html; })}
          icon={buttonAppearance?.icon}
          iconPosition={buttonAppearance?.iconPosition}
          iconSize={buttonIconSizePx(fontSizePx)}
        />
      </button>
    </BlockWrapper>
  );
}

SubmitButton.craft = {
  displayName: "Submit Button",
  props: {
    text: "Get Instant Access",
    fullWidth: false,
    typography: { fontSize: "16px" },
  },
  related: { settings: SubmitButtonSettings },
};
