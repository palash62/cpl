import type { UserRole } from "@prisma/client";

export function shouldShowAdminQuickActions(role: UserRole) {
  return role === "ADMIN";
}
