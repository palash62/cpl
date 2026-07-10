import type { CraftSerializedState } from "@/modules/page-builder/types/page-document";
import { normalizeCraftState } from "@/modules/page-builder/lib/serialize";

const COLUMN_TYPE = "Column";
const ROW_TYPE = "Columns";

function nodeTypeName(node: CraftSerializedState[string]): string {
  const type = node.type as { resolvedName?: string };
  return type?.resolvedName ?? "";
}

function ordinalLabel(index: number): string {
  const labels = ["1st", "2nd", "3rd"];
  return labels[index] ?? `${index + 1}th`;
}

export function createColumnNode(id: string, parentId: string, columnIndex: number): CraftSerializedState[string] {
  return {
    type: { resolvedName: COLUMN_TYPE },
    isCanvas: true,
    props: {
      name: `${ordinalLabel(columnIndex)} Column`,
      columnIndex: columnIndex + 1,
      layout: { minHeight: "120px", padding: "8px" },
    },
    displayName: `${ordinalLabel(columnIndex)} Column`,
    parent: parentId,
    nodes: [],
    linkedNodes: {},
  };
}

export function createRowWithColumns(rowId: string, parentId: string, columnCount: number): CraftSerializedState {
  const state: CraftSerializedState = {};
  const columnIds: string[] = [];

  for (let i = 0; i < columnCount; i += 1) {
    const colId = `${rowId}_col_${i}`;
    columnIds.push(colId);
    state[colId] = createColumnNode(colId, rowId, i);
  }

  const label = columnCount === 1 ? "1 Column Row" : `${columnCount} Column Row`;
  state[rowId] = {
    type: { resolvedName: ROW_TYPE },
    isCanvas: true,
    props: {
      name: label,
      columns: columnCount,
      layout: { gap: "16px", width: "100%" },
    },
    displayName: label,
    parent: parentId,
    nodes: columnIds,
    linkedNodes: {},
  };

  return state;
}

export function normalizeRowColumnState(state: CraftSerializedState): CraftSerializedState {
  const normalized = normalizeCraftState(state);
  const next: CraftSerializedState = { ...normalized };
  let changed = false;

  for (const [id, node] of Object.entries(normalized)) {
    if (nodeTypeName(node) !== ROW_TYPE) continue;

    const childIds = node.nodes ?? [];
    const columnsProp = (node.props as { columns?: number })?.columns ?? (childIds.length || 1);
    const allColumns = childIds.every((childId) => nodeTypeName(normalized[childId] ?? {}) === COLUMN_TYPE);

    if (allColumns && childIds.length === columnsProp) continue;

    const wrappedIds: string[] = [];
    childIds.forEach((childId, index) => {
      const child = normalized[childId];
      if (!child) return;
      if (nodeTypeName(child) === COLUMN_TYPE) {
        wrappedIds.push(childId);
        return;
      }
      const wrapId = `${id}_wrap_${index}_${childId}`;
      next[wrapId] = createColumnNode(wrapId, id, index);
      next[wrapId] = {
        ...next[wrapId],
        nodes: [childId],
      };
      next[childId] = { ...child, parent: wrapId };
      wrappedIds.push(wrapId);
      changed = true;
    });

    while (wrappedIds.length < columnsProp) {
      const colId = `${id}_col_fill_${wrappedIds.length}`;
      next[colId] = createColumnNode(colId, id, wrappedIds.length);
      wrappedIds.push(colId);
      changed = true;
    }

    if (changed || wrappedIds.length !== childIds.length) {
      const label = columnsProp === 1 ? "1 Column Row" : `${columnsProp} Column Row`;
      next[id] = {
        ...node,
        props: { ...(node.props as object), columns: columnsProp, name: label },
        displayName: label,
        nodes: wrappedIds,
      };
      changed = true;
    }
  }

  return changed ? normalizeCraftState(next) : normalized;
}

export function buildBlankPageWithRow(): CraftSerializedState {
  const rowNodes = createRowWithColumns("row_main", "container_main", 1);
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
        name: "Section",
        style: { backgroundColor: "#ffffff" },
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
        layout: { maxWidth: "960px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "16px" },
      },
      displayName: "Container",
      parent: "section_main",
      nodes: ["row_main"],
      linkedNodes: {},
    },
    ...rowNodes,
  };
}
