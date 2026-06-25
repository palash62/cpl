import { AuthenticatedShell } from "@/components/layout/authenticated-shell";

export default function PublisherLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthenticatedShell role="PUBLISHER">{children}</AuthenticatedShell>;
}
