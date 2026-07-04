import type { CraftSerializedState } from "@/modules/page-builder/types/page-document";

export function deserializeCraftState(json: string | CraftSerializedState): CraftSerializedState {
  const state = typeof json === "string" ? (JSON.parse(json) as CraftSerializedState) : json;
  if (!state?.ROOT) {
    throw new Error("Invalid craft state: missing ROOT node");
  }
  return state;
}
