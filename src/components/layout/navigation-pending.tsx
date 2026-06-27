"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { usePathname, useSearchParams } from "next/navigation";

interface NavigationPendingContextValue {
  pending: boolean;
  startNavigation: () => void;
}

const NavigationPendingContext = createContext<NavigationPendingContextValue | null>(null);

export function NavigationPendingProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, setPending] = useState(false);

  useEffect(() => {
    setPending(false);
  }, [pathname, searchParams]);

  const startNavigation = useCallback(() => {
    setPending(true);
  }, []);

  return (
    <NavigationPendingContext.Provider value={{ pending, startNavigation }}>
      {children}
    </NavigationPendingContext.Provider>
  );
}

export function useNavigationPending() {
  const context = useContext(NavigationPendingContext);
  if (!context) {
    throw new Error("useNavigationPending must be used within NavigationPendingProvider");
  }
  return context;
}

export function NavigationProgressBar() {
  const { pending } = useNavigationPending();

  if (!pending) return null;

  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-20 h-0.5 overflow-hidden bg-transparent">
      <div
        className="h-full w-1/3 animate-[navigation-progress_0.9s_ease-in-out_infinite] rounded-full"
        style={{ background: "var(--theme-primary)" }}
      />
    </div>
  );
}
