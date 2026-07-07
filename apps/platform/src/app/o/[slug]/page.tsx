import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { OptinLandingPage } from "@/components/optin/optin-landing-page";
import { PublishedOptinFunnel } from "@/components/optin/published-optin-funnel";
import { getSession } from "@/lib/session";
import {
  getAdvertiserOptinFunnelPreview,
  getPublicOptinFunnel,
  getPublishedBuilderFunnel,
} from "@/services/optin-funnel.service";
import { usesBuilderRenderer } from "@/lib/optin-funnel";
import { createEmptyCraftState } from "@/modules/page-builder/lib/serialize";
import { recordFunnelEvent } from "@/services/funnel-analytics.service";
import { prisma } from "@/lib/prisma";
import { DEFAULT_THEME } from "@/modules/page-builder/lib/theme";

async function getOrigin() {
  const headerStore = await headers();
  const host = headerStore.get("x-forwarded-host") ?? headerStore.get("host");
  const proto = headerStore.get("x-forwarded-proto") ?? "http";
  if (host) return `${proto}://${host}`;
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}

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

async function recordView(slug: string) {
  const page = await prisma.advertiserOptinPage.findUnique({
    where: { slug },
    select: { id: true, campaignId: true },
  });
  if (!page?.campaignId) return;

  const headerStore = await headers();
  const ip =
    headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    headerStore.get("x-real-ip") ??
    undefined;

  await recordFunnelEvent({
    funnelId: page.id,
    campaignId: page.campaignId,
    eventType: "VIEW",
    step: "optin",
    ip,
    userAgent: headerStore.get("user-agent") ?? undefined,
  });
}

export default async function PublicOptinFunnelPage({
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

    const draft = await getAdvertiserOptinFunnelPreview(slug, session.user.id);
    if (!draft) notFound();

    if (usesBuilderRenderer(draft)) {
      return (
        <PublishedOptinFunnel
          slug={slug}
          craftState={draft.craftState?.craft ?? createEmptyCraftState()}
          theme={draft.themeJson ?? DEFAULT_THEME}
          formJson={draft.formJson ?? null}
          thankYouEnabled={draft.thankYouEnabled}
          destinationUrl={draft.destinationUrl}
          previewMode
        />
      );
    }

    return <OptinLandingPage page={draft} />;
  }

  const publishedBuilder = await getPublishedBuilderFunnel(slug);
  if (publishedBuilder) {
    await recordView(slug);
    return (
      <PublishedOptinFunnel
        slug={slug}
        craftState={publishedBuilder.craftState}
        theme={publishedBuilder.themeJson}
        formJson={publishedBuilder.formJson}
        thankYouEnabled={publishedBuilder.funnel.thankYouEnabled}
        destinationUrl={publishedBuilder.funnel.destinationUrl}
      />
    );
  }

  const page = await getPublicOptinFunnel(slug);
  if (!page) notFound();

  await recordView(slug);
  return <OptinLandingPage page={page} />;
}
