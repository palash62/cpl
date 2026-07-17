import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PublicOptinSlugPage } from "@/components/optin/public-optin-slug-page";
import { getPublicOptinFunnel } from "@/services/optin-funnel.service";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const page = await getPublicOptinFunnel(slug);
  if (!page) return { title: "Optin Funnel" };
  return { title: page.title, description: page.subheadline };
}

export default async function PublicOptinFunnelPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ preview?: string; test_campaign?: string }>;
}) {
  const { slug } = await params;
  const query = await searchParams;

  if (!slug) notFound();

  return <PublicOptinSlugPage slug={slug} searchParams={query} />;
}
