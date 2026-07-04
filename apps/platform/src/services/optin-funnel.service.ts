import { prisma } from "@/lib/prisma";
import { Errors } from "@/lib/errors";
import { slugifyOptinAddress, isValidOptinSlug } from "@/lib/optin-slug";
import {
  DEFAULT_OPTIN_PAGE,
  serializeOptinPage,
} from "@/lib/optin-page";
import {
  buildPublicOptinFunnel,
  serializeOptinFunnel,
  serializePublicOptinFunnel,
  type PublicThankYouFunnel,
  type SerializedOptinFunnel,
} from "@/lib/optin-funnel";
import {
  buildCraftFromOptinTemplate,
  buildThankYouCraftState,
  themeFromOptinTemplate,
} from "@/lib/optin-funnel-craft-templates";
import {
  getOptinTemplate,
  isOptinTemplateId,
  type OptinTemplateId,
} from "@/lib/optin-templates";
import {
  createEmptyCraftState,
  normalizeCraftState,
  parseStoredCraftState,
  toPrismaJson,
} from "@/modules/page-builder/lib/serialize";
import { extractFormJson } from "@/modules/page-builder/lib/extract-form-json";
import { DEFAULT_THEME, type ThemeJson } from "@/modules/page-builder/lib/theme";
import type { CraftSerializedState } from "@/modules/page-builder/types/page-document";
import type { FormJson } from "@/modules/page-builder/types/form-field";
import type { OptinFunnelEditorType } from "@prisma/client";
import { sanitizeHtml } from "@/modules/page-builder/lib/sanitize";

export type OptinFunnelOption = {
  id: string;
  name: string;
  title: string;
  slug: string;
  editorType: OptinFunnelEditorType;
  isPublished: boolean;
};

async function createUniqueSlug(advertiserId: string, seed: string, excludeFunnelId?: string) {
  const base = slugifyOptinAddress(seed) || "optin";
  let slug = base;
  let attempt = 0;
  while (true) {
    const existing = await prisma.advertiserOptinPage.findUnique({ where: { slug } });
    if (!existing || existing.id === excludeFunnelId) return slug;
    attempt += 1;
    slug = `${base}-${attempt}`;
  }
}

function syncPublishFlags(isPublished: boolean) {
  return {
    isPublished,
    status: isPublished ? ("PUBLISHED" as const) : ("DRAFT" as const),
  };
}

export async function listOptinFunnels(advertiserId: string) {
  const pages = await prisma.advertiserOptinPage.findMany({
    where: { advertiserId, status: { not: "ARCHIVED" } },
    orderBy: { updatedAt: "desc" },
  });
  return pages.map(serializeOptinFunnel);
}

export async function getOptinFunnel(id: string, advertiserId: string) {
  const page = await prisma.advertiserOptinPage.findFirst({
    where: { id, advertiserId },
  });
  if (!page) throw Errors.notFound("Optin funnel");
  return serializeOptinFunnel(page);
}

export async function listOptinFunnelOptions(advertiserId: string): Promise<OptinFunnelOption[]> {
  const pages = await prisma.advertiserOptinPage.findMany({
    where: { advertiserId, status: { not: "ARCHIVED" } },
    select: {
      id: true,
      name: true,
      title: true,
      slug: true,
      editorType: true,
      isPublished: true,
    },
    orderBy: { updatedAt: "desc" },
  });

  return pages.map((page) => ({
    id: page.id,
    name: page.name,
    title: page.title,
    slug: page.slug,
    editorType: page.editorType,
    isPublished: page.isPublished,
  }));
}

export async function createOptinFunnel(
  advertiserId: string,
  input: {
    name: string;
    editorType: OptinFunnelEditorType;
    templateId?: string;
    pageTemplateId?: string;
  },
) {
  const slug = await createUniqueSlug(advertiserId, input.name);
  const user = await prisma.user.findUnique({
    where: { id: advertiserId },
    select: { advertiserProfile: { select: { company: true } }, name: true },
  });

  let craftState: CraftSerializedState = createEmptyCraftState();
  let themeJson: ThemeJson = DEFAULT_THEME;
  let thankYouCraft = buildThankYouCraftState();
  let templateId: OptinTemplateId | undefined;
  let templateMeta: ReturnType<typeof getOptinTemplate> | undefined;

  if (input.templateId && isOptinTemplateId(input.templateId)) {
    templateId = input.templateId;
    templateMeta = getOptinTemplate(templateId);
    craftState = buildCraftFromOptinTemplate(templateId);
    themeJson = themeFromOptinTemplate(templateId);
    thankYouCraft = buildThankYouCraftState();
  } else if (input.pageTemplateId) {
    const pageTemplate = await prisma.pageTemplate.findUnique({
      where: { id: input.pageTemplateId },
    });
    if (pageTemplate) {
      craftState = parseStoredCraftState(pageTemplate.craftState).craft;
      themeJson = (pageTemplate.themeJson as ThemeJson) ?? DEFAULT_THEME;
    }
  }

  const title =
    input.name.trim() ||
    templateMeta?.name ||
    user?.advertiserProfile?.company ||
    "New Optin Funnel";

  const page = await prisma.advertiserOptinPage.create({
    data: {
      advertiserId,
      slug,
      name: title,
      title,
      editorType: "BUILDER",
      templateId: templateId,
      headline: templateMeta?.headline ?? DEFAULT_OPTIN_PAGE.headline,
      subheadline: templateMeta?.subheadline ?? DEFAULT_OPTIN_PAGE.subheadline,
      description: DEFAULT_OPTIN_PAGE.description,
      ctaText: DEFAULT_OPTIN_PAGE.ctaText,
      successTitle: DEFAULT_OPTIN_PAGE.successTitle,
      successMessage: DEFAULT_OPTIN_PAGE.successMessage,
      badgeText: templateMeta?.badgeText ?? null,
      bulletPoints: DEFAULT_OPTIN_PAGE.bulletPoints,
      primaryColor: templateMeta?.primaryColor ?? DEFAULT_OPTIN_PAGE.primaryColor,
      accentColor: templateMeta?.accentColor ?? DEFAULT_OPTIN_PAGE.accentColor,
      craftState: toPrismaJson({
        craft: normalizeCraftState(craftState),
        meta: { schemaVersion: 1, editorBreakPoint: "desktop" },
      }),
      themeJson: toPrismaJson(themeJson),
      thankYouCraftState: toPrismaJson({
        craft: normalizeCraftState(thankYouCraft),
        meta: { schemaVersion: 1, editorBreakPoint: "desktop" },
      }),
      thankYouThemeJson: toPrismaJson(themeJson),
    },
  });

  return serializeOptinFunnel(page);
}

async function getNextVersionNumber(funnelId: string) {
  const latest = await prisma.optinFunnelVersion.findFirst({
    where: { funnelId },
    orderBy: { versionNumber: "desc" },
  });
  return (latest?.versionNumber ?? 0) + 1;
}

export async function createFunnelVersionSnapshot(
  funnelId: string,
  createdById: string,
  input: {
    craftState: CraftSerializedState;
    themeJson: ThemeJson;
    formJson: FormJson | null;
    thankYouCraftState?: CraftSerializedState | null;
    thankYouThemeJson?: ThemeJson | null;
    label: string;
  },
) {
  const versionNumber = await getNextVersionNumber(funnelId);
  return prisma.optinFunnelVersion.create({
    data: {
      funnelId,
      versionNumber,
      label: input.label,
      craftState: toPrismaJson(input.craftState),
      themeJson: toPrismaJson(input.themeJson),
      formJson: input.formJson ? toPrismaJson(input.formJson) : undefined,
      thankYouCraftState: input.thankYouCraftState
        ? toPrismaJson(input.thankYouCraftState)
        : undefined,
      thankYouThemeJson: input.thankYouThemeJson
        ? toPrismaJson(input.thankYouThemeJson)
        : undefined,
      createdById,
    },
  });
}

export async function updateOptinFunnel(
  id: string,
  advertiserId: string,
  input: {
    name?: string;
    title?: string;
    slug?: string;
    campaignId?: string | null;
    destinationUrl?: string | null;
    templateId?: OptinTemplateId;
    headline?: string;
    subheadline?: string;
    description?: string | null;
    ctaText?: string;
    successTitle?: string;
    successMessage?: string;
    badgeText?: string | null;
    bulletPoints?: string[];
    primaryColor?: string;
    accentColor?: string;
    isPublished?: boolean;
    craftState?: CraftSerializedState;
    themeJson?: ThemeJson;
    thankYouEnabled?: boolean;
    thankYouCraftState?: CraftSerializedState;
    thankYouThemeJson?: ThemeJson;
    thankYouPixelHtml?: string | null;
    thankYouUseCampaignPixel?: boolean;
    step?: "optin" | "thankYou";
    autosave?: boolean;
  },
) {
  const existing = await prisma.advertiserOptinPage.findFirst({ where: { id, advertiserId } });
  if (!existing) throw Errors.notFound("Optin funnel");

  let slug = existing.slug;
  if (input.slug) {
    slug = slugifyOptinAddress(input.slug);
    if (!isValidOptinSlug(slug)) {
      throw Errors.validation("Slug must be at least 2 characters, lowercase letters, numbers, or hyphens.");
    }
    const taken = await prisma.advertiserOptinPage.findUnique({ where: { slug } });
    if (taken && taken.id !== id) {
      throw Errors.validation("This page address is already taken.");
    }
  }

  const campaignId = input.campaignId !== undefined ? input.campaignId : existing.campaignId;
  let formJson: FormJson | null = (existing.formJson as FormJson | null) ?? null;

  if (input.craftState && campaignId) {
    formJson = extractFormJson(input.craftState, campaignId);
  } else if (input.craftState) {
    formJson = extractFormJson(input.craftState, existing.campaignId ?? "");
  }

  const craftEnvelope = input.craftState
    ? toPrismaJson({
        craft: normalizeCraftState(input.craftState),
        meta: { schemaVersion: 1 as const, editorBreakPoint: "desktop" as const },
      })
    : undefined;

  const thankYouCraftEnvelope = input.thankYouCraftState
    ? toPrismaJson({
        craft: normalizeCraftState(input.thankYouCraftState),
        meta: { schemaVersion: 1 as const, editorBreakPoint: "desktop" as const },
      })
    : undefined;

  const publishFlags =
    input.isPublished !== undefined ? syncPublishFlags(input.isPublished) : {};

  const page = await prisma.advertiserOptinPage.update({
    where: { id },
    data: {
      ...(input.name ? { name: input.name.trim(), title: input.name.trim() } : {}),
      ...(input.title ? { title: input.title.trim() } : {}),
      slug,
      ...(input.campaignId !== undefined ? { campaignId: input.campaignId } : {}),
      ...(input.destinationUrl !== undefined
        ? { destinationUrl: input.destinationUrl?.trim() || null }
        : {}),
      ...(input.templateId ? { templateId: input.templateId } : {}),
      ...(input.headline ? { headline: input.headline.trim() } : {}),
      ...(input.subheadline ? { subheadline: input.subheadline.trim() } : {}),
      ...(input.description !== undefined
        ? { description: input.description?.trim() || null }
        : {}),
      ...(input.ctaText ? { ctaText: input.ctaText.trim() } : {}),
      ...(input.successTitle ? { successTitle: input.successTitle.trim() } : {}),
      ...(input.successMessage ? { successMessage: input.successMessage.trim() } : {}),
      ...(input.badgeText !== undefined ? { badgeText: input.badgeText?.trim() || null } : {}),
      ...(input.bulletPoints ? { bulletPoints: input.bulletPoints } : {}),
      ...(input.primaryColor ? { primaryColor: input.primaryColor } : {}),
      ...(input.accentColor ? { accentColor: input.accentColor } : {}),
      ...publishFlags,
      ...(craftEnvelope ? { craftState: craftEnvelope } : {}),
      ...(input.themeJson ? { themeJson: toPrismaJson(input.themeJson) } : {}),
      ...(formJson !== undefined ? { formJson: formJson ? toPrismaJson(formJson) : undefined } : {}),
      ...(input.thankYouEnabled !== undefined ? { thankYouEnabled: input.thankYouEnabled } : {}),
      ...(thankYouCraftEnvelope ? { thankYouCraftState: thankYouCraftEnvelope } : {}),
      ...(input.thankYouThemeJson ? { thankYouThemeJson: toPrismaJson(input.thankYouThemeJson) } : {}),
      ...(input.thankYouPixelHtml !== undefined
        ? { thankYouPixelHtml: input.thankYouPixelHtml ? sanitizeHtml(input.thankYouPixelHtml) : null }
        : {}),
      ...(input.thankYouUseCampaignPixel !== undefined
        ? { thankYouUseCampaignPixel: input.thankYouUseCampaignPixel }
        : {}),
      autosaveAt: new Date(),
    },
  });

  if (!input.autosave) {
    if (input.step === "thankYou" && input.thankYouCraftState) {
      await createFunnelVersionSnapshot(id, advertiserId, {
        craftState: parseStoredCraftState(page.craftState).craft,
        themeJson: (page.themeJson as ThemeJson) ?? DEFAULT_THEME,
        formJson,
        thankYouCraftState: input.thankYouCraftState,
        thankYouThemeJson: (input.thankYouThemeJson ?? page.thankYouThemeJson) as ThemeJson,
        label: "Thank you save",
      });
    } else if (input.craftState) {
      await createFunnelVersionSnapshot(id, advertiserId, {
        craftState: input.craftState,
        themeJson: (input.themeJson ?? page.themeJson) as ThemeJson,
        formJson,
        thankYouCraftState: input.thankYouCraftState ?? null,
        thankYouThemeJson: (input.thankYouThemeJson ?? page.thankYouThemeJson) as ThemeJson,
        label: "Manual save",
      });
    }
  }

  return serializeOptinFunnel(page);
}

export async function listFunnelVersions(funnelId: string, advertiserId: string) {
  await getOptinFunnel(funnelId, advertiserId);
  return prisma.optinFunnelVersion.findMany({
    where: { funnelId },
    orderBy: { versionNumber: "desc" },
    select: {
      id: true,
      versionNumber: true,
      label: true,
      createdAt: true,
      createdById: true,
    },
  });
}

export async function restoreFunnelVersion(
  funnelId: string,
  versionId: string,
  advertiserId: string,
) {
  await getOptinFunnel(funnelId, advertiserId);
  const version = await prisma.optinFunnelVersion.findFirst({
    where: { id: versionId, funnelId },
  });
  if (!version) throw Errors.notFound("Version");

  const craft = parseStoredCraftState(version.craftState).craft;
  const theme = (version.themeJson as ThemeJson) ?? DEFAULT_THEME;
  const formJson = version.formJson as FormJson | null;
  const thankYouCraft = version.thankYouCraftState
    ? parseStoredCraftState(version.thankYouCraftState).craft
    : null;
  const thankYouTheme = (version.thankYouThemeJson as ThemeJson) ?? DEFAULT_THEME;

  await prisma.advertiserOptinPage.update({
    where: { id: funnelId },
    data: {
      craftState: toPrismaJson({
        craft: normalizeCraftState(craft),
        meta: { schemaVersion: 1, editorBreakPoint: "desktop" },
      }),
      themeJson: toPrismaJson(theme),
      formJson: formJson ? toPrismaJson(formJson) : undefined,
      ...(thankYouCraft
        ? {
            thankYouCraftState: toPrismaJson({
              craft: normalizeCraftState(thankYouCraft),
              meta: { schemaVersion: 1, editorBreakPoint: "desktop" },
            }),
          }
        : {}),
      thankYouThemeJson: toPrismaJson(thankYouTheme),
      autosaveAt: new Date(),
    },
  });

  await createFunnelVersionSnapshot(funnelId, advertiserId, {
    craftState: craft,
    themeJson: theme,
    formJson,
    thankYouCraftState: thankYouCraft,
    thankYouThemeJson: thankYouTheme,
    label: "Restored",
  });

  return { restored: true };
}

export async function deleteOptinFunnel(id: string, advertiserId: string) {
  const page = await prisma.advertiserOptinPage.findFirst({ where: { id, advertiserId } });
  if (!page) throw Errors.notFound("Optin funnel");
  await prisma.advertiserOptinPage.update({
    where: { id },
    data: { status: "ARCHIVED", isPublished: false },
  });
}

export async function duplicateOptinFunnel(id: string, advertiserId: string) {
  const page = await prisma.advertiserOptinPage.findFirst({ where: { id, advertiserId } });
  if (!page) throw Errors.notFound("Optin funnel");
  const slug = await createUniqueSlug(advertiserId, `${page.slug}-copy`);
  const copy = await prisma.advertiserOptinPage.create({
    data: {
      advertiserId,
      slug,
      name: `${page.name} (Copy)`,
      title: `${page.title} (Copy)`,
      editorType: page.editorType,
      destinationUrl: page.destinationUrl,
      campaignId: page.campaignId,
      templateId: page.templateId,
      headline: page.headline,
      subheadline: page.subheadline,
      description: page.description,
      ctaText: page.ctaText,
      successTitle: page.successTitle,
      successMessage: page.successMessage,
      badgeText: page.badgeText,
      bulletPoints: page.bulletPoints as object,
      primaryColor: page.primaryColor,
      accentColor: page.accentColor,
      craftState: page.craftState ? (page.craftState as object) : undefined,
      themeJson: page.themeJson ? (page.themeJson as object) : undefined,
      formJson: page.formJson ? (page.formJson as object) : undefined,
      thankYouEnabled: page.thankYouEnabled,
      thankYouCraftState: page.thankYouCraftState ? (page.thankYouCraftState as object) : undefined,
      thankYouThemeJson: page.thankYouThemeJson ? (page.thankYouThemeJson as object) : undefined,
      thankYouPixelHtml: page.thankYouPixelHtml,
      thankYouUseCampaignPixel: page.thankYouUseCampaignPixel,
      status: "DRAFT",
      isPublished: false,
    },
  });
  return serializeOptinFunnel(copy);
}

export async function publishOptinFunnel(id: string, advertiserId: string) {
  const page = await prisma.advertiserOptinPage.findFirst({
    where: { id, advertiserId },
    include: { campaign: true },
  });
  if (!page) throw Errors.notFound("Optin funnel");

  if (!page.campaignId || !page.campaign || page.campaign.status !== "ACTIVE") {
    throw Errors.validation("Link an active campaign before publishing.");
  }

  if (page.editorType === "BUILDER") {
    const doc = parseStoredCraftState(page.craftState);
    const formJson = extractFormJson(doc.craft, page.campaignId);
    if (!formJson?.fields.length) {
      throw Errors.validation("Add at least one form field before publishing.");
    }

    const thankYouDoc = page.thankYouEnabled && page.thankYouCraftState
      ? parseStoredCraftState(page.thankYouCraftState).craft
      : null;

    const version = await createFunnelVersionSnapshot(id, advertiserId, {
      craftState: doc.craft,
      themeJson: (page.themeJson as ThemeJson) ?? DEFAULT_THEME,
      formJson,
      thankYouCraftState: thankYouDoc,
      thankYouThemeJson: (page.thankYouThemeJson as ThemeJson) ?? DEFAULT_THEME,
      label: "Published",
    });

    const updated = await prisma.advertiserOptinPage.update({
      where: { id },
      data: {
        status: "PUBLISHED",
        isPublished: true,
        publishedVersionId: version.id,
        formJson,
      },
    });
    return serializeOptinFunnel(updated);
  }

  const updated = await prisma.advertiserOptinPage.update({
    where: { id },
    data: { status: "PUBLISHED", isPublished: true },
  });
  return serializeOptinFunnel(updated);
}

export async function getPublishedBuilderFunnel(slug: string) {
  const page = await prisma.advertiserOptinPage.findUnique({
    where: { slug },
    include: {
      publishedVersion: true,
      campaign: { include: { fields: { orderBy: { sortOrder: "asc" } } } },
    },
  });

  if (
    !page ||
    page.editorType !== "BUILDER" ||
    page.status !== "PUBLISHED" ||
    !page.publishedVersion ||
    !page.campaign ||
    page.campaign.status !== "ACTIVE"
  ) {
    return null;
  }

  const doc = parseStoredCraftState(page.publishedVersion.craftState);
  const thankYouDoc = page.thankYouEnabled && page.publishedVersion.thankYouCraftState
    ? parseStoredCraftState(page.publishedVersion.thankYouCraftState)
    : null;

  return {
    funnel: serializeOptinFunnel(page),
    slug: page.slug,
    campaignId: page.campaignId!,
    craftState: doc.craft,
    themeJson: (page.publishedVersion.themeJson as ThemeJson) ?? DEFAULT_THEME,
    formJson: page.publishedVersion.formJson as FormJson | null,
    thankYouCraftState: thankYouDoc?.craft ?? null,
    thankYouThemeJson: (page.publishedVersion.thankYouThemeJson as ThemeJson) ?? DEFAULT_THEME,
    pixelToken: page.campaign.pixelToken,
  };
}

export async function getPublicOptinFunnel(slug: string) {
  const page = await prisma.advertiserOptinPage.findUnique({
    where: { slug },
    include: {
      campaign: {
        include: { fields: { orderBy: { sortOrder: "asc" } } },
      },
    },
  });

  if (!page?.isPublished || !page.campaign || page.campaign.status !== "ACTIVE") {
    return null;
  }

  return serializePublicOptinFunnel({
    ...page,
    campaign: {
      name: page.campaign.name,
      pixelToken: page.campaign.pixelToken,
      fields: page.campaign.fields,
    },
  });
}

export async function getAdvertiserOptinFunnelPreview(slug: string, advertiserId: string) {
  const page = await prisma.advertiserOptinPage.findFirst({
    where: { slug, advertiserId },
    include: {
      campaign: { include: { fields: { orderBy: { sortOrder: "asc" } } } },
    },
  });
  if (!page) return null;
  return buildPublicOptinFunnel(page, page.campaign, { previewMode: true });
}

export async function getPublicThankYouFunnel(
  slug: string,
  leadId: string,
): Promise<PublicThankYouFunnel | null> {
  const page = await prisma.advertiserOptinPage.findUnique({
    where: { slug },
    include: { campaign: true },
  });

  if (
    !page?.isPublished ||
    !page.thankYouEnabled ||
    !page.campaignId ||
    !page.campaign ||
    page.campaign.status !== "ACTIVE"
  ) {
    return null;
  }

  const lead = await prisma.lead.findFirst({
    where: { id: leadId, campaignId: page.campaignId },
    select: { id: true },
  });
  if (!lead) return null;

  let thankYouCraftState = page.thankYouCraftState;
  let thankYouThemeJson = page.thankYouThemeJson;

  if (page.publishedVersionId) {
    const version = await prisma.optinFunnelVersion.findUnique({
      where: { id: page.publishedVersionId },
    });
    if (version?.thankYouCraftState) {
      thankYouCraftState = version.thankYouCraftState;
      thankYouThemeJson = version.thankYouThemeJson;
    }
  }

  return {
    funnelId: page.id,
    slug: page.slug,
    campaignId: page.campaignId,
    pixelToken: page.campaign.pixelToken,
    thankYouUseCampaignPixel: page.thankYouUseCampaignPixel,
    thankYouPixelHtml: page.thankYouPixelHtml,
    thankYouCraftState: thankYouCraftState ? parseStoredCraftState(thankYouCraftState) : null,
    thankYouThemeJson: (thankYouThemeJson as ThemeJson) ?? DEFAULT_THEME,
    leadId: lead.id,
  };
}

export async function linkOptinFunnelToCampaign(
  funnelId: string,
  campaignId: string,
  advertiserId: string,
) {
  const page = await prisma.advertiserOptinPage.findFirst({
    where: { id: funnelId, advertiserId },
    select: { id: true },
  });
  if (!page) throw Errors.notFound("Optin funnel");

  await prisma.advertiserOptinPage.update({
    where: { id: page.id },
    data: { campaignId },
  });
}

export function buildOptinDestinationUrl(baseUrl: string, slug: string) {
  const normalizedBase = baseUrl.replace(/\/$/, "");
  return `${normalizedBase}/o/${slug}`;
}

export async function resolveOptinFunnelDestination(
  funnelId: string,
  advertiserId: string,
  baseUrl: string,
) {
  const page = await prisma.advertiserOptinPage.findFirst({
    where: { id: funnelId, advertiserId },
    select: { id: true, slug: true, title: true, name: true },
  });
  if (!page) throw Errors.notFound("Optin funnel");

  return {
    page,
    destinationUrl: buildOptinDestinationUrl(baseUrl, page.slug),
  };
}

export async function getFirstAdvertiserFunnel(advertiserId: string) {
  const page = await prisma.advertiserOptinPage.findFirst({
    where: { advertiserId, status: { not: "ARCHIVED" } },
    orderBy: { createdAt: "asc" },
  });
  return page ? serializeOptinPage(page) : null;
}

export async function getOrCreateFirstTemplateFunnel(advertiserId: string) {
  const existing = await prisma.advertiserOptinPage.findFirst({
    where: { advertiserId, status: { not: "ARCHIVED" } },
    orderBy: { createdAt: "asc" },
  });
  if (existing) return serializeOptinPage(existing);

  const created = await createOptinFunnel(advertiserId, {
    name: "My Optin Funnel",
    editorType: "BUILDER",
  });
  return serializeOptinPage(created);
}

export type { SerializedOptinFunnel };
