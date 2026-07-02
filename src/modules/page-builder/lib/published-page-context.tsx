"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { FormJson } from "@/modules/page-builder/types/form-field";

type PublishedPageContextValue = {
  landingPageSlug?: string;
  onLeadSubmit?: (data: Record<string, string>) => Promise<void>;
  formJson?: FormJson | null;
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
