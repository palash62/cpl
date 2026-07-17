import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PublicOptinSlugPage } from "@/components/optin/public-optin-slug-page";
import { resolveFunnelByDomain } from "@/services/advertiser-domain.service";
import { getPublicOptinFunnel } from "@/services/optin-funnel.service";

function decodeHostParam(host: string) {
  try {
    return decodeURIComponent(host).toLowerCase();
  } catch {
    return host.toLowerCase();
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ host: string }>;
}): Promise<Metadata> {
  const { host } = await params;
  const resolved = await resolveFunnelByDomain(decodeHostParam(host));
  if (!resolved) return { title: "Funnel" };

  const page = await getPublicOptinFunnel(resolved.funnel.slug);
  if (!page) return { title: "Funnel" };
  return { title: page.title, description: page.subheadline };
}

export default async function CustomDomainFunnelPage({
  params,
  searchParams,
}: {
  params: Promise<{ host: string }>;
  searchParams: Promise<{ preview?: string; test_campaign?: string }>;
}) {
  const { host } = await params;
  const resolved = await resolveFunnelByDomain(decodeHostParam(host));
  if (!resolved) notFound();

  const query = await searchParams;

  return (
    <PublicOptinSlugPage
      slug={resolved.funnel.slug}
      searchParams={query}
      thankYouPath="/thank-you"
    />
  );
}
