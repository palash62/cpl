"use server";

import { signIn } from "@/lib/auth";
import { redirect } from "next/navigation";

function isFailedAuthUrl(url: unknown) {
  return (
    typeof url === "string" &&
    (url.includes("error=") || url.includes("/login") || url.includes("/signin"))
  );
}

export async function completeImpersonation(token: string, redirectTo: string) {
  let result: unknown;

  try {
    result = await signIn("impersonation", {
      token,
      redirectTo,
      redirect: false,
    });
  } catch {
    redirect("/admin?error=impersonation_failed");
  }

  if (isFailedAuthUrl(result)) {
    redirect("/admin?error=impersonation_failed");
  }

  redirect(redirectTo);
}
