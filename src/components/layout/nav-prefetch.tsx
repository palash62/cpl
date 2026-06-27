"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import type { UserRole } from "@prisma/client";
import { getNavForRole } from "./nav-config";

export function NavPrefetch({ role }: { role: UserRole }) {
  const router = useRouter();

  useEffect(() => {
    for (const item of getNavForRole(role)) {
      router.prefetch(item.href);
    }
  }, [role, router]);

  return null;
}
