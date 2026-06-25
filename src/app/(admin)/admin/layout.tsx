import { AuthenticatedShell } from "@/components/layout/authenticated-shell";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthenticatedShell role="ADMIN">{children}</AuthenticatedShell>;
}
