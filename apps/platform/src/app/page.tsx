import { redirect } from "next/navigation";
import { getDashboardPath } from "@/lib/auth";
import { getSession } from "@/lib/session";

export default async function HomePage() {
  const session = await getSession();

  if (session?.user) {
    redirect(getDashboardPath(session.user.role));
  }

  redirect("/login");
}
