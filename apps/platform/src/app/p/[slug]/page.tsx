import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getSession } from "@/lib/session";
import { getPublishedLandingPage, getLandingPageDraftPreview, trackPageEvent } from "@/modules/page-builder/server";
import { PublishedPage } from "@/modules/page-builder";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const page = await getPublishedLandingPage(slug);
  return { title: page?.name ?? "Landing Page" };
}

export default async function PublicLandingPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ preview?: string }>;
}) {
  const { slug } = await params;
  const { preview } = await searchParams;

  if (preview === "1") {
    const session = await getSession();
    if (!session || session.user.role !== "ADVERTISER") notFound();
    const draft = await getLandingPageDraftPreview(slug, session.user.id);
    if (!draft) notFound();
    return (
      <PublishedPage
        slug={draft.slug}
        craftState={draft.craftState}
        theme={draft.themeJson}
        formJson={draft.formJson}
      />
    );
  }

  const page = await getPublishedLandingPage(slug);
  if (!page) notFound();

  void trackPageEvent({ landingPageId: page.campaignId, slug, event: "page_view" });

  return (
    <PublishedPage
      slug={page.slug}
      craftState={page.craftState}
      theme={page.themeJson}
      formJson={page.formJson}
    />
  );
}
