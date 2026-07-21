"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import type { UserRole } from "@prisma/client";
import { getNavForRole } from "./nav-config";

function safePrefetch(router: ReturnType<typeof useRouter>, href: string) {
  try {
    router.prefetch(href);
  } catch {
    // Router may not be initialized yet during hydration or Fast Refresh.
  }
}

export function NavPrefetch({
  role,
  canAccessCpaOffers,
}: {
  role: UserRole;
  canAccessCpaOffers?: boolean;
}) {
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;

    const prefetchNav = () => {
      if (cancelled) return;
      for (const item of getNavForRole(role, { canAccessCpaOffers })) {
        safePrefetch(router, item.href);
        for (const child of item.children ?? []) {
          safePrefetch(router, child.href);
        }
      }
    };

    // Defer until after the app router action queue is initialized.
    const timeoutId = window.setTimeout(prefetchNav, 0);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [role, canAccessCpaOffers, router]);

  return null;
}
