import { redirect } from "next/navigation";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AdvertiserOptinFunnelTemplateEditRedirect({ params }: PageProps) {
  const { id } = await params;
  redirect(`/advertiser/optin-funnels/${id}/edit`);
}
