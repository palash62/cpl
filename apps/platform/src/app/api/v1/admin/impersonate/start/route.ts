import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { consumeImpersonationToken } from "@/services/impersonation.service";
import {
  VIEW_AS_COOKIE,
  createViewAsCookieValue,
  viewAsCookieOptions,
} from "@/lib/view-as";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");
  const redirectTo = searchParams.get("redirectTo") ?? "/admin";

  if (!token) {
    redirect("/admin?error=impersonation_failed");
  }

  const result = await consumeImpersonationToken(token);
  if (!result || result.purpose !== "IMPERSONATE" || !result.impersonatorId) {
    redirect("/admin?error=impersonation_failed");
  }

  const cookieStore = await cookies();
  cookieStore.set(
    VIEW_AS_COOKIE,
    await createViewAsCookieValue(result.user, result.impersonatorId),
    viewAsCookieOptions(),
  );

  redirect(redirectTo);
}
