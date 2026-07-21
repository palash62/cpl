"use client";

import { createContext, useContext, type ReactNode } from "react";

export type BuilderSettingsLayout = "ghl" | "classic";

type BuilderSettingsContextValue = {
  layout: BuilderSettingsLayout;
  advertiserId?: string;
  showCpaOfferSelect?: boolean;
};

const BuilderSettingsContext = createContext<BuilderSettingsContextValue>({
  layout: "classic",
});

export function BuilderSettingsLayoutProvider({
  layout,
  advertiserId,
  showCpaOfferSelect = false,
  children,
}: {
  layout: BuilderSettingsLayout;
  advertiserId?: string;
  showCpaOfferSelect?: boolean;
  children: React.ReactNode;
}) {
  return (
    <BuilderSettingsContext.Provider value={{ layout, advertiserId, showCpaOfferSelect }}>
      {children}
    </BuilderSettingsContext.Provider>
  );
}

export function useBuilderSettingsLayout() {
  return useContext(BuilderSettingsContext).layout;
}

export function useBuilderSettings() {
  return useContext(BuilderSettingsContext);
}
