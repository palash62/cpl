"use client";

import { Editor, Frame } from "@craftjs/core";
import { craftResolver } from "@/modules/page-builder/blocks";
import { themeToCssVars } from "@/modules/page-builder/lib/theme";
import { PublishedPageProvider } from "@/modules/page-builder/lib/published-page-context";
import type { CraftSerializedState } from "@/modules/page-builder/types/page-document";
import type { ThemeJson } from "@/modules/page-builder/lib/theme";
import { DEFAULT_THEME } from "@/modules/page-builder/lib/theme";
import type { FormJson } from "@/modules/page-builder/types/form-field";

type PageRendererProps = {
  craftState: CraftSerializedState;
  theme?: ThemeJson;
  landingPageSlug?: string;
  formJson?: FormJson | null;
  onLeadSubmit?: (data: Record<string, string>) => Promise<void>;
};

export function PageRenderer({
  craftState,
  theme = DEFAULT_THEME,
  landingPageSlug,
  formJson,
  onLeadSubmit,
}: PageRendererProps) {
  return (
    <PublishedPageProvider value={{ landingPageSlug, onLeadSubmit, formJson }}>
      <div id="pb-page" style={{ ...themeToCssVars(theme), fontFamily: theme.fontFamily, background: theme.backgroundColor }}>
        <Editor resolver={craftResolver} enabled={false}>
          <Frame data={craftState as never} />
        </Editor>
      </div>
    </PublishedPageProvider>
  );
}
