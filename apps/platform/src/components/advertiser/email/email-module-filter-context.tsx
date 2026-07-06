"use client";

import { createContext, useContext, useMemo, useState } from "react";

type EmailModuleFilterContextValue = {
  search: string;
  filterValues: Record<string, string>;
  setSearch: (value: string) => void;
  setFilterValue: (id: string, value: string) => void;
};

const EmailModuleFilterContext = createContext<EmailModuleFilterContextValue | null>(null);

export function EmailModuleFilterProvider({ children }: { children: React.ReactNode }) {
  const [search, setSearch] = useState("");
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});

  const value = useMemo(
    () => ({
      search,
      filterValues,
      setSearch,
      setFilterValue: (id: string, value: string) => {
        setFilterValues((prev) => ({ ...prev, [id]: value }));
      },
    }),
    [search, filterValues],
  );

  return (
    <EmailModuleFilterContext.Provider value={value}>{children}</EmailModuleFilterContext.Provider>
  );
}

export function useEmailModuleFilters() {
  const context = useContext(EmailModuleFilterContext);
  if (!context) {
    throw new Error("useEmailModuleFilters must be used within EmailModuleFilterProvider");
  }
  return context;
}
