import { AppShell } from "@/components/layout/app-shell";

export default function AdvertiserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppShell role="ADVERTISER">{children}</AppShell>;
}
