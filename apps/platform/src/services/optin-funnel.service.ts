import { prisma } from "@/lib/prisma";
import { Errors } from "@/lib/errors";
import { Prisma } from "@prisma/client";
import { slugifyOptinAddress, isValidOptinSlug } from "@/lib/optin-slug";
import type { OptinTemplateId } from "@/lib/optin-templates";
import {
  DEFAULT_OPTIN_PAGE,
  serializeOptinPage,
} from "@/lib/optin-page";
import {
  buildPublicOptinFunnel,
  serializeOptinFunnel,
  serializePublicOptinFunnel,
  usesBuilderRenderer,
  type PublicThankYouFunnel,
  type SerializedOptinFunnel,
} from "@/lib/optin-funnel";
import {
  createEmptyCraftState,
  createBlankCraftState,
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

export type OptinFunnelTemplate = {
  id: string;
  slug: string;
  name: string;
  category: string;
  craftState: CraftSerializedState;
  themeJson: ThemeJson;
  isSystem: boolean;
  createdAt: string;
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

export async function listOptinFunnelTemplatesForAdvertiser(): Promise<OptinFunnelTemplate[]> {
  const templates = await prisma.pageTemplate.findMany({
    where: { category: "optin_funnel", isSystem: true },
    orderBy: { createdAt: "desc" },
  });

  return templates.map((template) => ({
    id: template.id,
    slug: template.slug,
    name: template.name,
    category: template.category,
    craftState: parseStoredCraftState(template.craftState).craft,
    themeJson: (template.themeJson as ThemeJson) ?? DEFAULT_THEME,
    isSystem: template.isSystem,
    createdAt: template.createdAt.toISOString(),
  }));
}

export async function listOptinFunnelTemplatesForAdmin(): Promise<OptinFunnelTemplate[]> {
  return listOptinFunnelTemplatesForAdvertiser();
}

export async function createOptinFunnelTemplateByAdmin(input: {
  name: string;
  primaryColor?: string;
  secondaryColor?: string;
}) {
  const name = input.name.trim();
  const slugBase = slugifyOptinAddress(name) || "optin-template";
  let slug = `optin-template-${slugBase}`;
  let suffix = 1;

  while (await prisma.pageTemplate.findUnique({ where: { slug } })) {
    slug = `optin-template-${slugBase}-${suffix}`;
    suffix += 1;
  }

  const craftState = createBlankCraftState();
  const themeJson: ThemeJson = {
    ...DEFAULT_THEME,
    ...(input.primaryColor ? { primaryColor: input.primaryColor } : {}),
    ...(input.secondaryColor ? { secondaryColor: input.secondaryColor } : {}),
  };

  const created = await prisma.pageTemplate.create({
    data: {
      slug,
      name,
      category: "optin_funnel",
      craftState: toPrismaJson({
        craft: normalizeCraftState(craftState),
        meta: { schemaVersion: 1, editorBreakPoint: "desktop" },
      }),
      themeJson: toPrismaJson(themeJson),
      isSystem: true,
      advertiserId: null,
    },
  });

  return {
    id: created.id,
    slug: created.slug,
    name: created.name,
    category: created.category,
    craftState: parseStoredCraftState(created.craftState).craft,
    themeJson: (created.themeJson as ThemeJson) ?? DEFAULT_THEME,
    isSystem: created.isSystem,
    createdAt: created.createdAt.toISOString(),
  } satisfies OptinFunnelTemplate;
}

export async function getOptinFunnelTemplateByAdmin(id: string): Promise<OptinFunnelTemplate> {
  const template = await prisma.pageTemplate.findFirst({
    where: { id, category: "optin_funnel", isSystem: true },
  });
  if (!template) throw Errors.notFound("Funnel template");

  return {
    id: template.id,
    slug: template.slug,
    name: template.name,
    category: template.category,
    craftState: parseStoredCraftState(template.craftState).craft,
    themeJson: (template.themeJson as ThemeJson) ?? DEFAULT_THEME,
    isSystem: template.isSystem,
    createdAt: template.createdAt.toISOString(),
  };
}

export async function updateOptinFunnelTemplateByAdmin(
  id: string,
  input: {
    name?: string;
    craftState?: CraftSerializedState;
    themeJson?: ThemeJson;
    autosave?: boolean;
  },
) {
  const existing = await prisma.pageTemplate.findFirst({
    where: { id, category: "optin_funnel", isSystem: true },
  });
  if (!existing) throw Errors.notFound("Funnel template");

  const craftEnvelope = input.craftState
    ? toPrismaJson({
        craft: normalizeCraftState(input.craftState),
        meta: { schemaVersion: 1 as const, editorBreakPoint: "desktop" as const },
      })
    : undefined;

  const updated = await prisma.pageTemplate.update({
    where: { id },
    data: {
      ...(input.name ? { name: input.name.trim() } : {}),
      ...(craftEnvelope ? { craftState: craftEnvelope } : {}),
      ...(input.themeJson ? { themeJson: toPrismaJson(input.themeJson) } : {}),
    },
  });

  return {
    id: updated.id,
    slug: updated.slug,
    name: updated.name,
    category: updated.category,
    craftState: parseStoredCraftState(updated.craftState).craft,
    themeJson: (updated.themeJson as ThemeJson) ?? DEFAULT_THEME,
    isSystem: updated.isSystem,
    createdAt: updated.createdAt.toISOString(),
  } satisfies OptinFunnelTemplate;
}

export async function deleteOptinFunnelTemplateByAdmin(id: string) {
  const template = await prisma.pageTemplate.findFirst({
    where: { id, category: "optin_funnel", isSystem: true },
  });
  if (!template) throw Errors.notFound("Funnel template");

  await prisma.pageTemplate.delete({ where: { id } });
  return { deleted: true };
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
  let templateId: string | undefined;
  let templateName: string | undefined;

  const selectedTemplateId = input.pageTemplateId ?? input.templateId;
  if (selectedTemplateId) {
    const pageTemplate = await prisma.pageTemplate.findFirst({
      where: { id: selectedTemplateId, category: "optin_funnel", isSystem: true },
    });
    if (pageTemplate) {
      templateId = pageTemplate.id;
      templateName = pageTemplate.name;
      craftState = parseStoredCraftState(pageTemplate.craftState).craft;
      themeJson = (pageTemplate.themeJson as ThemeJson) ?? DEFAULT_THEME;
    }
  }

  const title =
    input.name.trim() ||
    templateName ||
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
      headline: DEFAULT_OPTIN_PAGE.headline,
      subheadline: DEFAULT_OPTIN_PAGE.subheadline,
      description: DEFAULT_OPTIN_PAGE.description,
      ctaText: DEFAULT_OPTIN_PAGE.ctaText,
      successTitle: DEFAULT_OPTIN_PAGE.successTitle,
      successMessage: DEFAULT_OPTIN_PAGE.successMessage,
      badgeText: null,
      bulletPoints: DEFAULT_OPTIN_PAGE.bulletPoints,
      primaryColor: themeJson.primaryColor ?? DEFAULT_OPTIN_PAGE.primaryColor,
      accentColor: themeJson.secondaryColor ?? DEFAULT_OPTIN_PAGE.accentColor,
      craftState: toPrismaJson({
        craft: normalizeCraftState(craftState),
        meta: { schemaVersion: 1, editorBreakPoint: "desktop" },
      }),
      themeJson: toPrismaJson(themeJson),
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
    thankYouCraftState?: CraftSerializedState | null;
    thankYouThemeJson?: ThemeJson;
    thankYouPixelHtml?: string | null;
    thankYouUseCampaignPixel?: boolean;
    step?: "optin" | "thankYou";
    autosave?: boolean;
  },
) {
  const existing = await prisma.advertiserOptinPage.findFirst({ where: { id, advertiserId } });
  if (!existing) throw Errors.notFound("Optin funnel");

  if (input.campaignId !== undefined && input.campaignId !== null) {
    const campaign = await prisma.campaign.findFirst({
      where: { id: input.campaignId, advertiserId },
      select: { id: true },
    });
    if (!campaign) {
      throw Errors.validation("Selected campaign is invalid for this advertiser.");
    }
  }

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

  const clearThankYouCraft = input.thankYouCraftState === null;
  const thankYouCraftEnvelope =
    input.thankYouCraftState && !clearThankYouCraft
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
      ...(clearThankYouCraft
        ? { thankYouCraftState: Prisma.DbNull }
        : thankYouCraftEnvelope
          ? { thankYouCraftState: thankYouCraftEnvelope }
          : {}),
      ...(input.thankYouThemeJson ? { thankYouThemeJson: toPrismaJson(input.thankYouThemeJson) } : {}),
      ...(input.thankYouPixelHtml !== undefined
        ? { thankYouPixelHtml: input.thankYouPixelHtml ? sanitizeHtml(input.thankYouPixelHtml) : null }
        : {}),
      ...(input.thankYouUseCampaignPixel !== undefined
        ? { thankYouUseCampaignPixel: input.thankYouUseCampaignPixel }
        : {}),
      ...(craftEnvelope || thankYouCraftEnvelope ? { editorType: "BUILDER" as const } : {}),
      autosaveAt: new Date(),
    },
  });

  const isAutosave = Boolean(input.autosave);
  const shouldSnapshot = !isAutosave || (await prisma.optinFunnelVersion.count({ where: { funnelId: id } })) === 0;

  if (shouldSnapshot) {
    if (input.step === "thankYou" && input.thankYouCraftState) {
      await createFunnelVersionSnapshot(id, advertiserId, {
        craftState: parseStoredCraftState(page.craftState).craft,
        themeJson: (page.themeJson as ThemeJson) ?? DEFAULT_THEME,
        formJson,
        thankYouCraftState: input.thankYouCraftState,
        thankYouThemeJson: (input.thankYouThemeJson ?? page.thankYouThemeJson) as ThemeJson,
        label: isAutosave ? "Initial autosave" : "Thank you save",
      });
    } else if (input.craftState) {
      await createFunnelVersionSnapshot(id, advertiserId, {
        craftState: input.craftState,
        themeJson: (input.themeJson ?? page.themeJson) as ThemeJson,
        formJson,
        thankYouCraftState: input.thankYouCraftState ?? null,
        thankYouThemeJson: (input.thankYouThemeJson ?? page.thankYouThemeJson) as ThemeJson,
        label: isAutosave ? "Initial autosave" : "Manual save",
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

  if (usesBuilderRenderer({ editorType: page.editorType, craftState: parseStoredCraftState(page.craftState) })) {
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
        editorType: "BUILDER",
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
    page.status !== "PUBLISHED" ||
    !page.publishedVersion ||
    !page.campaign ||
    page.campaign.status !== "ACTIVE"
  ) {
    return null;
  }

  const publishedCraft = parseStoredCraftState(page.publishedVersion.craftState);

  if (!usesBuilderRenderer({ editorType: page.editorType, craftState: publishedCraft })) {
    return null;
  }

  const doc = publishedCraft;
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

function buildThankYouFunnelPayload(
  page: {
    id: string;
    slug: string;
    campaignId: string | null;
    thankYouCraftState: unknown;
    thankYouThemeJson: unknown;
    thankYouPixelHtml: string | null;
    thankYouUseCampaignPixel: boolean;
    campaign: { pixelToken: string | null } | null;
  },
  options: { leadId: string | null; previewMode: boolean },
): PublicThankYouFunnel {
  return {
    funnelId: page.id,
    slug: page.slug,
    campaignId: page.campaignId ?? "",
    pixelToken: page.campaign?.pixelToken ?? null,
    thankYouUseCampaignPixel: page.thankYouUseCampaignPixel,
    thankYouPixelHtml: page.thankYouPixelHtml,
    thankYouCraftState: page.thankYouCraftState
      ? parseStoredCraftState(page.thankYouCraftState)
      : null,
    thankYouThemeJson: (page.thankYouThemeJson as ThemeJson) ?? DEFAULT_THEME,
    leadId: options.leadId,
    previewMode: options.previewMode,
  };
}

export async function getAdvertiserThankYouFunnelPreview(
  slug: string,
  advertiserId: string,
): Promise<PublicThankYouFunnel | null> {
  const page = await prisma.advertiserOptinPage.findFirst({
    where: { slug, advertiserId },
    include: { campaign: true },
  });
  if (!page) return null;

  return buildThankYouFunnelPayload(page, {
    leadId: null,
    previewMode: true,
  });
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
    previewMode: false,
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

  const campaign = await prisma.campaign.findFirst({
    where: { id: campaignId, advertiserId },
    select: { id: true },
  });
  if (!campaign) throw Errors.validation("Selected campaign is invalid for this advertiser.");

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
