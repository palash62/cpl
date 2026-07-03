import { redirect } from "next/navigation";

interface PageProps {
  params: Promise<{ path: string[] }>;
}

export default async function LegacyOptinPagesCatchAll({ params }: PageProps) {
  const { path } = await params;
  const suffix = path?.length ? `/${path.join("/")}` : "";
  redirect(`/advertiser/optin-funnels${suffix}`);
}
