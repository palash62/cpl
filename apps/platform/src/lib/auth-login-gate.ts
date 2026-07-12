import type { UserRole, UserStatus } from "@prisma/client";

export type LoginBlockCode =
  | "email_not_verified"
  | "pending_approval"
  | "suspended"
  | "inactive";

type LoginGateUser = {
  status: UserStatus;
  role: UserRole;
  emailVerified: Date | null;
};

export function getLoginBlock(user: LoginGateUser): LoginBlockCode | null {
  if (user.status === "SUSPENDED") return "suspended";
  if (user.status === "ACTIVE") return null;

  if (user.status === "PENDING") {
    if (!user.emailVerified) return "email_not_verified";
    if (user.role === "PUBLISHER") return "pending_approval";
    return "inactive";
  }

  return "inactive";
}

export function loginBlockMessage(code: LoginBlockCode): string {
  switch (code) {
    case "email_not_verified":
      return "Verify your email before signing in. Check your inbox for the verification link.";
    case "pending_approval":
      return "Your email is verified. Your publisher account is pending admin approval.";
    case "suspended":
      return "This account has been suspended. Contact support for help.";
    default:
      return "This account is not active yet.";
  }
}
