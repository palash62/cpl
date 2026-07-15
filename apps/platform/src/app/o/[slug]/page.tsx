import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { OptinLandingPage } from "@/components/optin/optin-landing-page";
import { PublishedOptinFunnel } from "@/components/optin/published-optin-funnel";
import {
  getOptinFunnelPreviewBySlug,
  getPublicOptinFunnel,
  getPublishedBuilderFunnel,
} from "@/services/optin-funnel.service";
import { usesBuilderRenderer } from "@/lib/optin-funnel";
import { createEmptyCraftState } from "@/modules/page-builder/lib/serialize";
import { normalizePreviewCraft } from "@/modules/page-builder/lib/preview-craft";
import { recordFunnelEvent } from "@/services/funnel-analytics.service";
import { prisma } from "@/lib/prisma";
import { DEFAULT_THEME } from "@/modules/page-builder/lib/theme";
import { getSession } from "@/lib/session";
import { getAdvertiserCampaignTestFunnel } from "@/services/campaign.service";

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
  searchParams: Promise<{ preview?: string; test_campaign?: string }>;
}) {
  const { slug } = await params;
  const { preview, test_campaign: testCampaignId } = await searchParams;

  if (testCampaignId) {
    const session = await getSession();
    if (!session?.user || session.user.role !== "ADVERTISER") notFound();

    let testFunnel: { slug: string };
    try {
      testFunnel = await getAdvertiserCampaignTestFunnel(testCampaignId, session.user.id);
    } catch {
      notFound();
    }
    if (testFunnel.slug !== slug) notFound();

    const publishedBuilder = await getPublishedBuilderFunnel(slug);
    if (publishedBuilder) {
      return (
        <PublishedOptinFunnel
          slug={slug}
          craftState={publishedBuilder.craftState}
          theme={publishedBuilder.themeJson}
          formJson={publishedBuilder.formJson}
          thankYouEnabled={publishedBuilder.funnel.thankYouEnabled}
          destinationUrl={publishedBuilder.funnel.destinationUrl}
          testCampaignId={testCampaignId}
        />
      );
    }

    const publishedPage = await getPublicOptinFunnel(slug);
    if (publishedPage) {
      return <OptinLandingPage page={publishedPage} testCampaignId={testCampaignId} />;
    }

    const draft = await getOptinFunnelPreviewBySlug(slug);
    if (!draft) notFound();

    if (usesBuilderRenderer(draft)) {
      return (
        <PublishedOptinFunnel
          slug={slug}
          craftState={normalizePreviewCraft(draft.craftState?.craft ?? createEmptyCraftState())}
          theme={draft.themeJson ?? DEFAULT_THEME}
          formJson={draft.formJson ?? null}
          thankYouEnabled={draft.thankYouEnabled}
          destinationUrl={draft.destinationUrl}
          testCampaignId={testCampaignId}
        />
      );
    }

    return <OptinLandingPage page={draft} testCampaignId={testCampaignId} />;
  }

  if (preview === "1") {
    const draft = await getOptinFunnelPreviewBySlug(slug);
    if (!draft) notFound();

    if (usesBuilderRenderer(draft)) {
      return (
        <PublishedOptinFunnel
          slug={slug}
          craftState={normalizePreviewCraft(draft.craftState?.craft ?? createEmptyCraftState())}
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
