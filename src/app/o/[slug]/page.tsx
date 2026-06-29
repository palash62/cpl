import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { OptinLandingPage } from "@/components/optin/optin-landing-page";
import { getSession } from "@/lib/session";
import { getAdvertiserOptinPreview, getPublicOptinPage } from "@/services/optin-page.service";

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ preview?: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const { preview } = await searchParams;

  if (preview === "1") {
    const session = await getSession();
    if (session?.user.role === "ADVERTISER") {
      const draft = await getAdvertiserOptinPreview(slug, session.user.id);
      if (draft) {
        return { title: draft.title };
      }
    }
  }

  const page = await getPublicOptinPage(slug);
  if (!page) {
    return { title: "Optin Page" };
  }

  return {
    title: page.title,
    description: page.subheadline,
  };
}

export default async function PublicOptinPage({
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
    if (!session || session.user.role !== "ADVERTISER") {
      notFound();
    }

    const draft = await getAdvertiserOptinPreview(slug, session.user.id);
    if (!draft) {
      notFound();
    }

    return <OptinLandingPage page={draft} />;
  }

  const page = await getPublicOptinPage(slug);

  if (!page) {
    notFound();
  }

  return <OptinLandingPage page={page} />;
}
