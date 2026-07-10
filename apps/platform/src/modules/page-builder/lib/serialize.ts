import type { CraftSerializedState, PageDocument } from "@/modules/page-builder/types/page-document";
import { buildBlankPageWithRow, normalizeRowColumnState } from "@/modules/page-builder/lib/row-column";
import { withoutStretchLayout } from "@/modules/page-builder/lib/responsive";
import type { LayoutProps } from "@/modules/page-builder/types/block-props";

const LAYOUT_SANITIZE_TYPES = new Set(["Section", "Container", "Column", "LeadForm"]);

function nodeTypeName(node: CraftSerializedState[string]): string {
  const type = node.type as { resolvedName?: string };
  return type?.resolvedName ?? "";
}

function sanitizeStretchLayoutInCraft(state: CraftSerializedState): CraftSerializedState {
  let changed = false;
  const result: CraftSerializedState = { ...state };

  for (const [id, node] of Object.entries(state)) {
    const typeName = nodeTypeName(node);
    if (!LAYOUT_SANITIZE_TYPES.has(typeName)) continue;

    const props = node.props as { layout?: LayoutProps } | undefined;
    if (!props?.layout) continue;

    const cleaned = withoutStretchLayout(props.layout);
    if (JSON.stringify(cleaned ?? {}) === JSON.stringify(props.layout)) continue;

    const nextProps = { ...props };
    if (cleaned) {
      nextProps.layout = cleaned;
    } else {
      delete nextProps.layout;
    }

    result[id] = {
      ...node,
      props: nextProps,
    };
    changed = true;
  }

  return changed ? result : state;
}

function isNodeMap(value: unknown): value is CraftSerializedState {
  return !!value && typeof value === "object" && "ROOT" in (value as object);
}

export function normalizeCraftState(state: CraftSerializedState | { nodes: CraftSerializedState }): CraftSerializedState {
  const nodes = ("nodes" in state ? state.nodes : state) as CraftSerializedState;
  const result: CraftSerializedState = { ...nodes };
  for (const id of Object.keys(result)) {
    const node = { ...result[id] };
    delete (node as { events?: unknown }).events;
    result[id] = node;
  }
  return sanitizeStretchLayoutInCraft(result);
}

export function wrapPageDocument(craft: CraftSerializedState): PageDocument {
  return {
    craft: normalizeCraftState(craft),
    meta: { schemaVersion: 1, editorBreakPoint: "desktop" },
  };
}

export function parseStoredCraftState(raw: unknown): PageDocument {
  if (!raw || typeof raw !== "object") {
    return wrapPageDocument(createEmptyCraftState());
  }
  const doc = raw as Partial<PageDocument>;
  if (doc.craft && isNodeMap(doc.craft)) {
    return {
      craft: normalizeRowColumnState(normalizeCraftState(doc.craft)),
      meta: doc.meta ?? { schemaVersion: 1, editorBreakPoint: "desktop" },
    };
  }
  if (isNodeMap(raw)) {
    return wrapPageDocument(raw);
  }
  const withNodes = raw as { nodes?: CraftSerializedState };
  if (isNodeMap(withNodes.nodes)) {
    return wrapPageDocument(withNodes.nodes);
  }
  return wrapPageDocument(createEmptyCraftState());
}

export function ensureEditorCraftState(state: CraftSerializedState): CraftSerializedState {
  const normalized = normalizeRowColumnState(normalizeCraftState(state));
  // Keep any real page document. Do not require hardcoded ids like `container_main` /
  // `row_main` — Craft regenerates node ids after edits, which previously wiped
  // template content and showed a blank canvas on edit.
  if (normalized.ROOT && Object.keys(normalized).length > 1) {
    return normalized;
  }
  return createBlankCraftState();
}

export function createBlankCraftState(): CraftSerializedState {
  return buildBlankPageWithRow();
}

export function createEmptyCraftState(): CraftSerializedState {
  return {
    ROOT: {
      type: { resolvedName: "CanvasRoot" },
      isCanvas: true,
      props: {},
      displayName: "Page",
      parent: null,
      nodes: ["section_main"],
      linkedNodes: {},
    },
    section_main: {
      type: { resolvedName: "Section" },
      isCanvas: true,
      props: {
        name: "Hero Section",
        style: { backgroundColor: "#f8fafc" },
        layout: { padding: "48px 24px" },
      },
      displayName: "Section",
      parent: "ROOT",
      nodes: ["container_main"],
      linkedNodes: {},
    },
    container_main: {
      type: { resolvedName: "Container" },
      isCanvas: true,
      props: {
        layout: { maxWidth: "720px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "16px" },
      },
      displayName: "Container",
      parent: "section_main",
      nodes: ["heading_main", "paragraph_main", "form_main"],
      linkedNodes: {},
    },
    heading_main: {
      type: { resolvedName: "Heading" },
      props: {
        text: "Get Your Free Guide Today",
        level: 2,
        typography: { fontSize: "2.25rem", fontWeight: "700", textAlign: "center", color: "#0f172a" },
      },
      displayName: "Heading",
      parent: "container_main",
      nodes: [],
      linkedNodes: {},
    },
    paragraph_main: {
      type: { resolvedName: "Paragraph" },
      props: {
        text: "Join thousands of marketers capturing high-quality leads.",
        typography: { fontSize: "1.125rem", textAlign: "center", color: "#475569", lineHeight: "1.6" },
      },
      displayName: "Paragraph",
      parent: "container_main",
      nodes: [],
      linkedNodes: {},
    },
    form_main: {
      type: { resolvedName: "LeadForm" },
      isCanvas: true,
      props: {
        successTitle: "You're in!",
        successMessage: "Check your inbox for next steps.",
      },
      displayName: "Lead Form",
      parent: "container_main",
      nodes: ["input_email", "input_name", "submit_main"],
      linkedNodes: {},
    },
    input_email: {
      type: { resolvedName: "FormInput" },
      props: { fieldType: "email", name: "email", label: "Email", required: true, placeholder: "you@example.com" },
      displayName: "Email",
      parent: "form_main",
      nodes: [],
      linkedNodes: {},
    },
    input_name: {
      type: { resolvedName: "FormInput" },
      props: { fieldType: "text", name: "name", label: "Full Name", required: true, placeholder: "Jane Doe" },
      displayName: "Name",
      parent: "form_main",
      nodes: [],
      linkedNodes: {},
    },
    submit_main: {
      type: { resolvedName: "SubmitButton" },
      props: { text: "Get Instant Access" },
      displayName: "Submit",
      parent: "form_main",
      nodes: [],
      linkedNodes: {},
    },
  };
}

export function toPrismaJson<T>(value: T) {
  return JSON.parse(JSON.stringify(value)) as object;
}
