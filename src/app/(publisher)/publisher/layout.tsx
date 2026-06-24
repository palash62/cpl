import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";

export default async function PublisherLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user || session.user.role !== "PUBLISHER") {
    redirect("/login");
  }

  return <AppShell role="PUBLISHER">{children}</AppShell>;
}
