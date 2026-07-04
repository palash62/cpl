import { useBuilderStore } from "@/modules/page-builder/lib/builder-store";
import type { CraftSerializedState } from "@/modules/page-builder/types/page-document";

export async function savePageCraft(
  pageId: string,
  serialized: string,
  options?: { autosave?: boolean },
): Promise<{ ok: boolean; errorMessage?: string }> {
  const store = useBuilderStore.getState();
  const { builderConfig, funnelStep } = store;
  const isThankYou = funnelStep === "thankYou";
  const craft = JSON.parse(serialized) as CraftSerializedState;

  store.setSaveStatus("saving");

  try {
    const res = await fetch(`${builderConfig.apiBasePath}/${pageId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...(isThankYou
          ? {
              thankYouCraftState: craft,
              thankYouThemeJson: store.thankYouTheme,
              step: "thankYou",
            }
          : {
              craftState: craft,
              themeJson: store.theme,
              step: "optin",
            }),
        autosave: options?.autosave ?? false,
      }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      store.setSaveStatus("error");
      return {
        ok: false,
        errorMessage: body.error?.message ?? "Save failed",
      };
    }

    store.onCraftSaved(isThankYou ? "thankYou" : "optin", craft);
    store.setSaveStatus("saved");
    return { ok: true };
  } catch {
    store.setSaveStatus("error");
    return { ok: false, errorMessage: "Save failed" };
  }
}
