"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import type { UserRole } from "@prisma/client";
import { getNavForRole } from "./nav-config";

export function NavPrefetch({
  role,
  canAccessCpaOffers,
}: {
  role: UserRole;
  canAccessCpaOffers?: boolean;
}) {
  const router = useRouter();

  useEffect(() => {
    for (const item of getNavForRole(role, { canAccessCpaOffers })) {
      router.prefetch(item.href);
      for (const child of item.children ?? []) {
        router.prefetch(child.href);
      }
    }
  }, [role, canAccessCpaOffers, router]);

  return null;
}
