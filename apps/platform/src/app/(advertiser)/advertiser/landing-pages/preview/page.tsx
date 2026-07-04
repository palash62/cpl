export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { getSession } from "@/lib/session";
import { getLandingPageDraftPreview } from "@/modules/page-builder/server";
import { PublishedPage } from "@/modules/page-builder";

export default async function LandingPagePreviewPage({
  searchParams,
}: {
  searchParams: Promise<{ slug?: string }>;
}) {
  const session = await getSession();
  const { slug } = await searchParams;

  if (!session || session.user.role !== "ADVERTISER" || !slug) {
    notFound();
  }

  const page = await getLandingPageDraftPreview(slug, session.user.id);
  if (!page) notFound();

  return (
    <PublishedPage
      slug={page.slug}
      craftState={page.craftState}
      theme={page.themeJson}
      formJson={page.formJson}
    />
  );
}
