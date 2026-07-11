import { headers } from "next/headers";
import { AppShell } from "@/components/layout/app-shell";

const FULLSCREEN_ADMIN_FUNNEL =
  /^\/admin\/funnel-templates\/[^/]+\/(edit|preview)(\/|$)/;

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = (await headers()).get("x-pathname") ?? "";
  if (FULLSCREEN_ADMIN_FUNNEL.test(pathname)) {
    return children;
  }

  return <AppShell role="ADMIN">{children}</AppShell>;
}
