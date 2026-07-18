import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { OptinLandingPage } from "@/components/optin/optin-landing-page";
import { PublishedOptinFunnel } from "@/components/optin/published-optin-funnel";
import { withPublicPageTracking } from "@/components/tracking/with-public-page-tracking";
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
import {
  getAdvertiserCampaignTestFunnel,
  getCampaignTestFunnel,
} from "@/services/campaign.service";

export type PublicOptinSlugSearchParams = {
  preview?: string;
  test_campaign?: string;
};

type PublicOptinSlugPageProps = {
  slug: string;
  searchParams: PublicOptinSlugSearchParams;
  thankYouPath?: string;
};

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

function resolveThankYouPath(slug: string, thankYouPath?: string) {
  return thankYouPath ?? `/o/${slug}/thank-you`;
}

export async function PublicOptinSlugPage({
  slug,
  searchParams,
  thankYouPath,
}: PublicOptinSlugPageProps) {
  const { preview, test_campaign: testCampaignId } = searchParams;
  const resolvedThankYouPath = resolveThankYouPath(slug, thankYouPath);

  if (testCampaignId) {
    const session = await getSession();
    const role = session?.user?.role;
    if (!session?.user || (role !== "ADVERTISER" && role !== "ADMIN")) notFound();

    let testFunnel: { slug: string };
    try {
      testFunnel =
        role === "ADMIN"
          ? await getCampaignTestFunnel(testCampaignId)
          : await getAdvertiserCampaignTestFunnel(testCampaignId, session.user.id);
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
          thankYouPath={resolvedThankYouPath}
        />
      );
    }

    const publishedPage = await getPublicOptinFunnel(slug);
    if (publishedPage) {
      return (
        <OptinLandingPage
          page={publishedPage}
          testCampaignId={testCampaignId}
          thankYouPath={resolvedThankYouPath}
        />
      );
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
          thankYouPath={resolvedThankYouPath}
        />
      );
    }

    return (
      <OptinLandingPage
        page={draft}
        testCampaignId={testCampaignId}
        thankYouPath={resolvedThankYouPath}
      />
    );
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
          thankYouPath={resolvedThankYouPath}
        />
      );
    }

    return <OptinLandingPage page={draft} thankYouPath={resolvedThankYouPath} />;
  }

  const publishedBuilder = await getPublishedBuilderFunnel(slug);
  if (publishedBuilder) {
    await recordView(slug);
    return withPublicPageTracking(
      <PublishedOptinFunnel
        slug={slug}
        craftState={publishedBuilder.craftState}
        theme={publishedBuilder.themeJson}
        formJson={publishedBuilder.formJson}
        thankYouEnabled={publishedBuilder.funnel.thankYouEnabled}
        destinationUrl={publishedBuilder.funnel.destinationUrl}
        thankYouPath={resolvedThankYouPath}
      />,
    );
  }

  const page = await getPublicOptinFunnel(slug);
  if (!page) notFound();

  await recordView(slug);
  return withPublicPageTracking(
    <OptinLandingPage page={page} thankYouPath={resolvedThankYouPath} />,
  );
}
