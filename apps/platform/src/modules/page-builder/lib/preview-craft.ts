import { normalizeCraftState } from "@/modules/page-builder/lib/serialize";
import { normalizeRowColumnState } from "@/modules/page-builder/lib/row-column";
import type { CraftSerializedState } from "@/modules/page-builder/types/page-document";

/** Same normalization pipeline as the editor load path. */
export function normalizePreviewCraft(craft: CraftSerializedState): CraftSerializedState {
  return normalizeRowColumnState(normalizeCraftState(craft));
}
