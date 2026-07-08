import { getRandomId } from "@craftjs/utils";
import type { Node, NodeId, NodeTree } from "@craftjs/core";

/** Deep-clone a Craft.js node tree with fresh IDs (required for duplicate). */
export function cloneNodeTree(tree: NodeTree): NodeTree {
  const newNodes: Record<NodeId, Node> = {};

  function changeNodeId(node: Node, newParentId?: string | null): string {
    const newNodeId = getRandomId(10);

    const childNodes = (node.data.nodes ?? []).map((childId) =>
      changeNodeId(tree.nodes[childId], newNodeId),
    );

    const linkedNodes = Object.keys(node.data.linkedNodes ?? {}).reduce<Record<string, string>>(
      (accum, linkId) => {
        const linkedChildId = node.data.linkedNodes[linkId];
        accum[linkId] = changeNodeId(tree.nodes[linkedChildId], newNodeId);
        return accum;
      },
      {},
    );

    newNodes[newNodeId] = {
      ...node,
      id: newNodeId,
      events: { selected: false, dragged: false, hovered: false },
      data: {
        ...node.data,
        parent: newParentId ?? node.data.parent,
        nodes: childNodes,
        linkedNodes,
      },
    };

    return newNodeId;
  }

  const rootNodeId = changeNodeId(tree.nodes[tree.rootNodeId]);
  return { rootNodeId, nodes: newNodes };
}
