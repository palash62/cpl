import { AuthenticatedShell } from "@/components/layout/authenticated-shell";

export default function AdvertiserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthenticatedShell role="ADVERTISER">{children}</AuthenticatedShell>;
}
