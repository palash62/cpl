import type { FormFieldDefinition, FormJson, FormFieldType } from "@/modules/page-builder/types/form-field";
import type { CraftSerializedState } from "@/modules/page-builder/types/page-document";

const FORM_FIELD_TYPES = new Set<string>([
  "FormInput", "FormTextarea", "FormCheckbox", "FormRadio", "FormSelect",
]);

const FORM_CONTAINER_TYPES = new Set<string>(["LeadForm"]);

/** Layout wrappers that may sit between the form and fields (rows/columns). */
const LAYOUT_TYPES = new Set<string>([
  "Section", "Container", "Columns", "Column", "Row", "CanvasRoot",
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

function resolvedName(node: CraftSerializedState[string] | undefined): string | null {
  return node?.type?.resolvedName ?? null;
}

function toFieldDefinition(
  childId: string,
  child: CraftSerializedState[string],
): FormFieldDefinition {
  const p = child.props as Record<string, unknown>;
  return {
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
  };
}

/**
 * Walk descendants so fields inside Row/Column under LeadForm still count.
 */
function collectFormContents(
  nodes: CraftSerializedState,
  rootId: string,
): { fields: FormFieldDefinition[]; submitButtonNodeId?: string } {
  const fields: FormFieldDefinition[] = [];
  let submitButtonNodeId: string | undefined;
  const visited = new Set<string>();

  function walk(nodeId: string) {
    if (visited.has(nodeId)) return;
    visited.add(nodeId);

    const node = nodes[nodeId];
    if (!node) return;
    const typeName = resolvedName(node);
    if (!typeName) return;

    if (typeName === "SubmitButton") {
      submitButtonNodeId = nodeId;
      return;
    }

    if (FORM_FIELD_TYPES.has(typeName)) {
      fields.push(toFieldDefinition(nodeId, node));
      return;
    }

    if (LAYOUT_TYPES.has(typeName) || FORM_CONTAINER_TYPES.has(typeName) || node.isCanvas) {
      for (const childId of node.nodes ?? []) {
        walk(childId);
      }
    }
  }

  walk(rootId);
  return { fields, submitButtonNodeId };
}

function collectLooseFormFields(nodes: CraftSerializedState): {
  fields: FormFieldDefinition[];
  submitButtonNodeId?: string;
} {
  const fields: FormFieldDefinition[] = [];
  let submitButtonNodeId: string | undefined;

  for (const [id, node] of Object.entries(nodes)) {
    const typeName = resolvedName(node);
    if (!typeName) continue;
    if (typeName === "SubmitButton") {
      submitButtonNodeId = id;
      continue;
    }
    if (FORM_FIELD_TYPES.has(typeName)) {
      fields.push(toFieldDefinition(id, node));
    }
  }

  return { fields, submitButtonNodeId };
}

export function extractFormJson(
  craft: CraftSerializedState,
  campaignId: string,
): FormJson | null {
  const nodes = craft;
  const formNode = Object.entries(nodes).find(([, n]) => resolvedName(n) === "LeadForm");

  if (formNode) {
    const [formId, form] = formNode;
    let { fields, submitButtonNodeId } = collectFormContents(nodes, formId);

    // Fields often sit beside the Form (columns / Quick Add), not only inside it.
    if (!fields.length) {
      const loose = collectLooseFormFields(nodes);
      fields = loose.fields;
      submitButtonNodeId = submitButtonNodeId ?? loose.submitButtonNodeId;
    }

    if (!fields.length) return null;

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

  // Fallback: fields dropped on the canvas without a Form wrapper (common with Quick Add)
  const loose = collectLooseFormFields(nodes);
  if (!loose.fields.length) return null;

  return {
    formId: "implicit_form",
    campaignId,
    fields: loose.fields,
    submitButtonNodeId: loose.submitButtonNodeId,
  };
}
