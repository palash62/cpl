import { prisma, isStalePrismaClientError, resetPrismaClient } from "@/lib/prisma";
import {
  buildPublicOptinPage,
  DEFAULT_OPTIN_PAGE,
  serializeOptinPage,
  serializePublicOptinPage,
} from "@/lib/optin-page";
import { isValidOptinSlug, slugifyOptinAddress } from "@/lib/optin-slug";
import {
  getDefaultTemplateId,
  getOptinTemplate,
  isOptinTemplateId,
  type OptinTemplateId,
} from "@/lib/optin-templates";
import { Errors } from "@/lib/errors";
import {
  buildOptinDestinationUrl,
  getAdvertiserOptinFunnelPreview,
  getOrCreateFirstTemplateFunnel,
  getPublicOptinFunnel,
  linkOptinFunnelToCampaign,
  listOptinFunnelOptions,
  resolveOptinFunnelDestination,
} from "@/services/optin-funnel.service";
import { sanitizeHtml } from "@/modules/page-builder/lib/sanitize";

export type OptinPageOption = {
  id: string;
  title: string;
  slug: string;
  isPublished: boolean;
  name?: string;
  editorType?: string;
};

async function getPrimaryFunnel(advertiserId: string) {
  return prisma.advertiserOptinPage.findFirst({
    where: { advertiserId, status: { not: "ARCHIVED" } },
    orderBy: { createdAt: "asc" },
  });
}

async function assertUniqueSlug(slug: string, advertiserId: string, funnelId?: string) {
  const existing = await prisma.advertiserOptinPage.findUnique({ where: { slug } });
  if (existing && existing.advertiserId !== advertiserId && existing.id !== funnelId) {
    throw new Error("This page address is already taken. Choose another.");
  }
  if (existing && funnelId && existing.id !== funnelId) {
    throw new Error("This page address is already taken. Choose another.");
  }
}

export async function getAdvertiserOptinPageState(advertiserId: string) {
  const page = await getPrimaryFunnel(advertiserId);
  return page ? serializeOptinPage(page) : null;
}

export async function listAdvertiserOptinPageOptions(
  advertiserId: string,
): Promise<OptinPageOption[]> {
  const options = await listOptinFunnelOptions(advertiserId);
  return options.map((o) => ({
    id: o.id,
    title: o.title,
    slug: o.slug,
    isPublished: o.isPublished,
    name: o.name,
    editorType: o.editorType,
  }));
}

export async function getOrCreateAdvertiserOptinPage(advertiserId: string) {
  return getOrCreateFirstTemplateFunnel(advertiserId);
}

export async function selectAdvertiserOptinTemplate(
  advertiserId: string,
  templateId: OptinTemplateId,
  funnelId?: string,
) {
  const page = funnelId
    ? await prisma.advertiserOptinPage.findFirst({ where: { id: funnelId, advertiserId } })
    : await getPrimaryFunnel(advertiserId);

  if (!page) {
    await getOrCreateAdvertiserOptinPage(advertiserId);
    return selectAdvertiserOptinTemplate(advertiserId, templateId, funnelId);
  }

  const updated = await prisma.advertiserOptinPage.update({
    where: { id: page.id },
    data: { templateId },
  });

  return serializeOptinPage(updated);
}

export async function updateAdvertiserOptinColors(
  advertiserId: string,
  primaryColor: string,
  accentColor: string,
  funnelId?: string,
) {
  const page = funnelId
    ? await prisma.advertiserOptinPage.findFirst({ where: { id: funnelId, advertiserId } })
    : await getPrimaryFunnel(advertiserId);

  if (!page) {
    await getOrCreateAdvertiserOptinPage(advertiserId);
    return updateAdvertiserOptinColors(advertiserId, primaryColor, accentColor, funnelId);
  }

  const updated = await prisma.advertiserOptinPage.update({
    where: { id: page.id },
    data: { primaryColor, accentColor },
  });

  return serializeOptinPage(updated);
}

export async function updateAdvertiserOptinPage(
  advertiserId: string,
  input: {
    funnelId?: string;
    title: string;
    slug: string;
    destinationUrl?: string | null;
    templateId?: OptinTemplateId;
    headline: string;
    subheadline: string;
    description?: string | null;
    ctaText: string;
    successTitle: string;
    successMessage: string;
    badgeText?: string | null;
    bulletPoints: string[];
    primaryColor: string;
    accentColor: string;
    isPublished: boolean;
    thankYouEnabled?: boolean;
    thankYouPixelHtml?: string | null;
    thankYouUseCampaignPixel?: boolean;
  },
) {
  let page = input.funnelId
    ? await prisma.advertiserOptinPage.findFirst({ where: { id: input.funnelId, advertiserId } })
    : await getPrimaryFunnel(advertiserId);

  if (!page) {
    await getOrCreateAdvertiserOptinPage(advertiserId);
    page = await getPrimaryFunnel(advertiserId);
  }

  if (!page) throw Errors.notFound("Optin funnel");

  const slug = slugifyOptinAddress(input.slug);
  if (!isValidOptinSlug(slug)) {
    throw new Error("Page address must be at least 2 characters and use letters, numbers, or hyphens.");
  }

  await assertUniqueSlug(slug, advertiserId, page.id);

  async function runUpdate() {
    return prisma.advertiserOptinPage.update({
      where: { id: page!.id },
      data: {
        title: input.title.trim(),
        name: input.title.trim(),
        slug,
        destinationUrl: input.destinationUrl?.trim() || null,
        ...(input.templateId ? { templateId: input.templateId } : {}),
        headline: input.headline.trim(),
        subheadline: input.subheadline.trim(),
        description: input.description?.trim() || null,
        ctaText: input.ctaText.trim(),
        successTitle: input.successTitle.trim(),
        successMessage: input.successMessage.trim(),
        badgeText: input.badgeText?.trim() || null,
        bulletPoints: input.bulletPoints,
        primaryColor: input.primaryColor,
        accentColor: input.accentColor,
        isPublished: input.isPublished,
        status: input.isPublished ? "PUBLISHED" : "DRAFT",
        ...(input.thankYouEnabled !== undefined ? { thankYouEnabled: input.thankYouEnabled } : {}),
        ...(input.thankYouPixelHtml !== undefined
          ? {
              thankYouPixelHtml: input.thankYouPixelHtml
                ? sanitizeHtml(input.thankYouPixelHtml)
                : null,
            }
          : {}),
        ...(input.thankYouUseCampaignPixel !== undefined
          ? { thankYouUseCampaignPixel: input.thankYouUseCampaignPixel }
          : {}),
      },
    });
  }

  let updated;
  try {
    updated = await runUpdate();
  } catch (error) {
    if (isStalePrismaClientError(error)) {
      resetPrismaClient();
      updated = await runUpdate();
    } else {
      throw error;
    }
  }

  return serializeOptinPage(updated);
}

export async function linkOptinPageToCampaign(
  optinPageId: string,
  campaignId: string,
  advertiserId: string,
) {
  return linkOptinFunnelToCampaign(optinPageId, campaignId, advertiserId);
}

export { buildOptinDestinationUrl };

export async function resolveOptinPageDestination(
  optinPageId: string,
  advertiserId: string,
  baseUrl: string,
) {
  return resolveOptinFunnelDestination(optinPageId, advertiserId, baseUrl);
}

export async function getPublicOptinPage(slug: string) {
  return getPublicOptinFunnel(slug);
}

export async function getAdvertiserOptinPreview(slug: string, advertiserId: string) {
  return getAdvertiserOptinFunnelPreview(slug, advertiserId);
}

export async function assertOptinPageOwner(slug: string, advertiserId: string) {
  const page = await prisma.advertiserOptinPage.findUnique({
    where: { slug },
    select: { advertiserId: true },
  });
  if (!page || page.advertiserId !== advertiserId) {
    throw Errors.notFound("Optin page");
  }
}

export function resolveTemplateParam(template?: string | null): OptinTemplateId | null {
  if (!template || !isOptinTemplateId(template)) return null;
  return template;
}
