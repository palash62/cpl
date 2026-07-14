"use server";

import { signIn } from "@/lib/auth";
import { redirect } from "next/navigation";
import { assertSafeRelativeRedirect } from "@/lib/safe-url";

function isFailedAuthUrl(url: unknown) {
  return (
    typeof url === "string" &&
    (url.includes("error=") || url.includes("/login") || url.includes("/signin"))
  );
}

export async function completeImpersonation(token: string, redirectTo: string) {
  const safeRedirect = assertSafeRelativeRedirect(redirectTo, "/admin");
  let result: unknown;

  try {
    result = await signIn("impersonation", {
      token,
      redirectTo: safeRedirect,
      redirect: false,
    });
  } catch {
    redirect("/admin?error=impersonation_failed");
  }

  if (isFailedAuthUrl(result)) {
    redirect("/admin?error=impersonation_failed");
  }

  redirect(safeRedirect);
}
