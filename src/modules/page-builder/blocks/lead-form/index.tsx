"use client";

import type { FormEvent, ReactNode } from "react";
import { useState } from "react";
import { useNode, useEditor } from "@craftjs/core";
import { CanvasWrapper, BlockWrapper } from "@/modules/page-builder/blocks/block-wrapper";
import {
  StandardSettings,
  FieldLabel,
  FieldInput,
  BUILDER_CHECKBOX_LABEL,
  BUILDER_FIELD_INPUT,
} from "@/modules/page-builder/components/settings/shared/block-settings";
import { cn } from "@/lib/utils";
import { buttonStyleFromTheme } from "@/modules/page-builder/lib/theme";
import { useBuilderStore } from "@/modules/page-builder/lib/builder-store";
import { usePublishedPage } from "@/modules/page-builder/lib/published-page-context";
import type { BlockProps } from "@/modules/page-builder/types/block-props";

type LeadFormProps = BlockProps & {
  children?: ReactNode;
  successTitle?: string;
  successMessage?: string;
  landingPageSlug?: string;
  onSubmit?: (data: Record<string, string>) => Promise<void>;
};

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
  const theme = useBuilderStore((s) => s.theme);
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
    return (
      <CanvasWrapper {...props}>
        <div className="rounded-lg border bg-green-50 p-6 text-center">
          <h3 className="text-lg font-semibold text-green-800">{successTitleText}</h3>
          <p className="mt-2 text-green-700">{successMessageText}</p>
        </div>
      </CanvasWrapper>
    );
  }

  const formBody = (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <input type="text" name="honeypot" className="hidden" tabIndex={-1} autoComplete="off" />
      {children}
      {!children && <p className="text-sm text-muted-foreground">Drop form fields here</p>}
      {slug && submitHandler && (
        <button
          type="submit"
          disabled={loading}
          style={buttonStyleFromTheme(theme)}
          className="px-4 py-2.5 font-medium"
        >
          {loading ? "Submitting..." : "Submit"}
        </button>
      )}
    </form>
  );

  return (
    <CanvasWrapper {...props}>
      {!enabled ? (
        <div
          className="rounded-3xl border border-slate-200/80 p-6 shadow-xl"
          style={{
            background: "var(--pb-form-surface-bg, #ffffff)",
            color: "var(--pb-form-surface-text, #0f172a)",
          }}
        >
          {formBody}
        </div>
      ) : (
        formBody
      )}
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
        ["FormInput", "FormTextarea", "FormCheckbox", "FormRadio", "FormSelect", "SubmitButton"].includes(n.name),
      ),
  },
  related: { settings: StandardSettings },
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
  const p = useNode((node) => node.data.props as FormFieldProps);
  const { actions: { setProp } } = useNode();
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
      <label className={BUILDER_CHECKBOX_LABEL}>
        <input type="checkbox" className="accent-indigo-500" checked={!!p.required} onChange={(e) => setProp((x: FormFieldProps) => { x.required = e.target.checked; })} />
        Required
      </label>
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
    <BlockWrapper {...props} draggable>
      <label className="block text-sm font-medium text-slate-700">
        {label}{required && <span className="text-red-500"> *</span>}
        <input
          name={name}
          type={renderInput(fieldType)}
          required={required}
          placeholder={placeholder}
          className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400"
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
    <BlockWrapper {...props} draggable>
      <label className="block text-sm font-medium text-slate-700">
        {label}{required && <span className="text-red-500"> *</span>}
        <textarea name={name} required={required} placeholder={placeholder} className="mt-1 min-h-[80px] w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400" />
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
    <BlockWrapper {...props} draggable>
      <label className="flex items-center gap-2 text-sm">
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
    <BlockWrapper {...props} draggable>
      <fieldset>
        <legend className="text-sm font-medium">{label}</legend>
        {options.map((opt) => (
          <label key={opt.value} className="flex items-center gap-2 text-sm mt-1">
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
    <BlockWrapper {...props} draggable>
      <label className="block text-sm font-medium">
        {label}
        <select name={name} required={required} className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900">
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

type SubmitProps = BlockProps & { text?: string };

export function SubmitButton({ text = "Submit", ...props }: SubmitProps) {
  const theme = useBuilderStore((s) => s.theme);
  return (
    <BlockWrapper {...props} draggable>
      <button type="submit" style={buttonStyleFromTheme(theme)} className="w-full px-4 py-2.5 font-medium">
        {text}
      </button>
    </BlockWrapper>
  );
}

SubmitButton.craft = {
  displayName: "Submit Button",
  props: { text: "Get Instant Access" },
  related: { settings: StandardSettings },
};
