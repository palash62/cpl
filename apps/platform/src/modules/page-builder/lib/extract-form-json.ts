import type { FormFieldDefinition, FormJson, FormFieldType } from "@/modules/page-builder/types/form-field";
import type { CraftSerializedState } from "@/modules/page-builder/types/page-document";

const FORM_FIELD_TYPES = new Set<string>([
  "FormInput", "FormTextarea", "FormCheckbox", "FormRadio", "FormSelect",
]);

function mapFieldType(raw: string): FormFieldType {
  const map: Record<string, FormFieldType> = {
    text: "text", email: "email", phone: "phone", tel: "phone",
    textarea: "textarea", select: "select", checkbox: "checkbox",
    radio: "radio", file: "file", date: "date", number: "number",
    address: "address", city: "city", state: "state", country: "country",
  };
  return map[raw] ?? "text";
}

export function extractFormJson(
  craft: CraftSerializedState,
  campaignId: string,
): FormJson | null {
  const nodes = craft;
  const formNode = Object.entries(nodes).find(([, n]) => n.type.resolvedName === "LeadForm");
  if (!formNode) return null;

  const [formId, form] = formNode;
  const fields: FormFieldDefinition[] = [];
  let submitButtonNodeId: string | undefined;

  for (const childId of form.nodes) {
    const child = nodes[childId];
    if (!child) continue;
    const typeName = child.type.resolvedName;

    if (typeName === "SubmitButton") {
      submitButtonNodeId = childId;
      continue;
    }

    if (!FORM_FIELD_TYPES.has(typeName)) continue;

    const p = child.props as Record<string, unknown>;
    fields.push({
      id: childId,
      type: mapFieldType(String(p.fieldType ?? p.type ?? "text")),
      name: String(p.name ?? childId),
      label: String(p.label ?? p.name ?? "Field"),
      required: Boolean(p.required),
      minLength: typeof p.minLength === "number" ? p.minLength : undefined,
      maxLength: typeof p.maxLength === "number" ? p.maxLength : undefined,
      pattern: typeof p.pattern === "string" ? p.pattern : undefined,
      placeholder: typeof p.placeholder === "string" ? p.placeholder : undefined,
      defaultValue: typeof p.defaultValue === "string" ? p.defaultValue : undefined,
      options: Array.isArray(p.options) ? (p.options as FormFieldDefinition["options"]) : undefined,
    });
  }

  const fp = form.props as Record<string, unknown>;
  return {
    formId,
    campaignId,
    fields,
    submitButtonNodeId,
    successTitle: typeof fp.successTitle === "string" ? fp.successTitle : undefined,
    successMessage: typeof fp.successMessage === "string" ? fp.successMessage : undefined,
  };
}
