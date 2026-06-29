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

export type OptinPageOption = {
  id: string;
  title: string;
  slug: string;
  isPublished: boolean;
};

async function createUniqueSlug(advertiserId: string, seed: string) {
  const base = slugifyOptinAddress(seed) || "optin";
  let slug = base;
  let attempt = 0;

  while (true) {
    const existing = await prisma.advertiserOptinPage.findUnique({ where: { slug } });
    if (!existing || existing.advertiserId === advertiserId) return slug;
    attempt += 1;
    slug = `${base}-${attempt}`;
  }
}

async function assertUniqueSlug(slug: string, advertiserId: string) {
  const existing = await prisma.advertiserOptinPage.findUnique({ where: { slug } });
  if (existing && existing.advertiserId !== advertiserId) {
    throw new Error("This page address is already taken. Choose another.");
  }
}

export async function getAdvertiserOptinPageState(advertiserId: string) {
  const page = await prisma.advertiserOptinPage.findUnique({
    where: { advertiserId },
  });
  return page ? serializeOptinPage(page) : null;
}

export async function listAdvertiserOptinPageOptions(
  advertiserId: string,
): Promise<OptinPageOption[]> {
  const page = await prisma.advertiserOptinPage.findUnique({
    where: { advertiserId },
    select: { id: true, title: true, slug: true, isPublished: true },
  });

  return page
    ? [
        {
          id: page.id,
          title: page.title,
          slug: page.slug,
          isPublished: page.isPublished,
        },
      ]
    : [];
}

export async function getOrCreateAdvertiserOptinPage(advertiserId: string) {
  const existing = await prisma.advertiserOptinPage.findUnique({
    where: { advertiserId },
  });

  if (existing) {
    return serializeOptinPage(existing);
  }

  const user = await prisma.user.findUniqueOrThrow({
    where: { id: advertiserId },
    select: {
      name: true,
      advertiserProfile: { select: { company: true } },
    },
  });

  const seed = user.advertiserProfile?.company ?? user.name;
  const slug = await createUniqueSlug(advertiserId, seed);
  const template = getOptinTemplate(getDefaultTemplateId());
  const title = user.advertiserProfile?.company ?? user.name ?? DEFAULT_OPTIN_PAGE.title;

  const created = await prisma.advertiserOptinPage.create({
    data: {
      advertiserId,
      slug,
      title,
      templateId: template.id,
      headline: template.headline,
      subheadline: template.subheadline,
      description: DEFAULT_OPTIN_PAGE.description,
      ctaText: DEFAULT_OPTIN_PAGE.ctaText,
      successTitle: DEFAULT_OPTIN_PAGE.successTitle,
      successMessage: DEFAULT_OPTIN_PAGE.successMessage,
      badgeText: template.badgeText,
      bulletPoints: DEFAULT_OPTIN_PAGE.bulletPoints,
      primaryColor: template.primaryColor,
      accentColor: template.accentColor,
    },
  });

  return serializeOptinPage(created);
}

export async function selectAdvertiserOptinTemplate(
  advertiserId: string,
  templateId: OptinTemplateId,
) {
  await getOrCreateAdvertiserOptinPage(advertiserId);

  const updated = await prisma.advertiserOptinPage.update({
    where: { advertiserId },
    data: { templateId },
  });

  return serializeOptinPage(updated);
}

export async function updateAdvertiserOptinColors(
  advertiserId: string,
  primaryColor: string,
  accentColor: string,
) {
  await getOrCreateAdvertiserOptinPage(advertiserId);

  const updated = await prisma.advertiserOptinPage.update({
    where: { advertiserId },
    data: { primaryColor, accentColor },
  });

  return serializeOptinPage(updated);
}

export async function updateAdvertiserOptinPage(
  advertiserId: string,
  input: {
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
  },
) {
  await getOrCreateAdvertiserOptinPage(advertiserId);

  const slug = slugifyOptinAddress(input.slug);
  if (!isValidOptinSlug(slug)) {
    throw new Error("Page address must be at least 2 characters and use letters, numbers, or hyphens.");
  }

  await assertUniqueSlug(slug, advertiserId);

  async function runUpdate() {
    return prisma.advertiserOptinPage.update({
      where: { advertiserId },
      data: {
        title: input.title.trim(),
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
  const page = await prisma.advertiserOptinPage.findFirst({
    where: { id: optinPageId, advertiserId },
    select: { id: true },
  });

  if (!page) {
    throw new Error("Select a valid optin page");
  }

  await prisma.advertiserOptinPage.update({
    where: { id: page.id },
    data: { campaignId },
  });
}

export function buildOptinDestinationUrl(baseUrl: string, slug: string) {
  const normalizedBase = baseUrl.replace(/\/$/, "");
  return `${normalizedBase}/o/${slug}`;
}

export async function resolveOptinPageDestination(
  optinPageId: string,
  advertiserId: string,
  baseUrl: string,
) {
  const page = await prisma.advertiserOptinPage.findFirst({
    where: { id: optinPageId, advertiserId },
    select: { id: true, slug: true, title: true },
  });

  if (!page) {
    throw new Error("Select a valid optin page");
  }

  return {
    page,
    destinationUrl: buildOptinDestinationUrl(baseUrl, page.slug),
  };
}

export async function getPublicOptinPage(slug: string) {
  const page = await prisma.advertiserOptinPage.findUnique({
    where: { slug },
    include: {
      campaign: {
        include: {
          fields: { orderBy: { sortOrder: "asc" } },
        },
      },
    },
  });

  if (!page?.isPublished || !page.campaign || page.campaign.status !== "ACTIVE") {
    return null;
  }

  return serializePublicOptinPage({
    ...page,
    campaign: page.campaign,
  });
}

export async function getAdvertiserOptinPreview(slug: string, advertiserId: string) {
  const page = await prisma.advertiserOptinPage.findFirst({
    where: { slug, advertiserId },
    include: {
      campaign: {
        include: { fields: { orderBy: { sortOrder: "asc" } } },
      },
    },
  });

  if (!page) {
    return null;
  }

  return buildPublicOptinPage(page, page.campaign, { previewMode: true });
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
