import type { CraftBlockName } from "@/modules/page-builder/blocks/index";
import type { CraftSerializedState } from "@/modules/page-builder/types/page-document";

export type CraftNodeInput = {
  id: string;
  type: CraftBlockName;
  parent: string | null;
  children?: string[];
  props?: Record<string, unknown>;
  isCanvas?: boolean;
  displayName?: string;
};

export function makeNode(input: CraftNodeInput): CraftSerializedState[string] {
  const node: CraftSerializedState[string] = {
    type: { resolvedName: input.type },
    props: input.props ?? {},
    displayName: input.displayName ?? input.type,
    parent: input.parent,
    nodes: input.children ?? [],
    linkedNodes: {},
  };
  if (input.isCanvas) node.isCanvas = true;
  return node;
}

export function mergeCraftStates(...states: CraftSerializedState[]): CraftSerializedState {
  return Object.assign({}, ...states);
}

export function linkChildren(
  state: CraftSerializedState,
  parentId: string,
  childIds: string[],
): CraftSerializedState {
  const parent = state[parentId];
  if (!parent) return state;

  const next: CraftSerializedState = { ...state };
  next[parentId] = { ...parent, nodes: childIds };
  for (const childId of childIds) {
    if (next[childId]) {
      next[childId] = { ...next[childId], parent: parentId };
    }
  }
  return next;
}

export function nodeTypeName(node: CraftSerializedState[string] | undefined): string {
  if (!node) return "";
  return (node.type as { resolvedName?: string })?.resolvedName ?? "";
}
