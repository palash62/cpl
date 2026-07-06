"use client";

import { createContext, useContext } from "react";

export type BuilderSettingsLayout = "ghl" | "classic";

const BuilderSettingsLayoutContext = createContext<BuilderSettingsLayout>("classic");

export function BuilderSettingsLayoutProvider({
  layout,
  children,
}: {
  layout: BuilderSettingsLayout;
  children: React.ReactNode;
}) {
  return (
    <BuilderSettingsLayoutContext.Provider value={layout}>
      {children}
    </BuilderSettingsLayoutContext.Provider>
  );
}

export function useBuilderSettingsLayout() {
  return useContext(BuilderSettingsLayoutContext);
}
