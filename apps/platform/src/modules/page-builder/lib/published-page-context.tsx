"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { FormJson } from "@/modules/page-builder/types/form-field";
import type { ThemeJson } from "@/modules/page-builder/lib/theme";
import type { Breakpoint } from "@/modules/page-builder/types/block-props";

export type PublishedPageContextValue = {
  landingPageSlug?: string;
  onLeadSubmit?: (data: Record<string, string>) => Promise<void>;
  formJson?: FormJson | null;
  theme?: ThemeJson;
  breakpoint?: Breakpoint;
  matchEditorCanvas?: boolean;
  isGhl?: boolean;
  advertiserId?: string;
  leadId?: string;
};

const PublishedPageContext = createContext<PublishedPageContextValue>({});

export function PublishedPageProvider({
  children,
  value,
}: {
  children: ReactNode;
  value: PublishedPageContextValue;
}) {
  return (
    <PublishedPageContext.Provider value={value}>
      {children}
    </PublishedPageContext.Provider>
  );
}

export function usePublishedPage() {
  return useContext(PublishedPageContext);
}
