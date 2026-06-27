import { AppShell } from "@/components/layout/app-shell";

export default function PublisherLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppShell role="PUBLISHER">{children}</AppShell>;
}
