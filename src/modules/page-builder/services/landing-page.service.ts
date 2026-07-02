import { prisma } from "@/lib/prisma";
import { Errors } from "@/lib/errors";
import { slugifyOptinAddress, isValidOptinSlug } from "@/lib/optin-slug";
import { parseStoredCraftState, createEmptyCraftState, normalizeCraftState, toPrismaJson } from "@/modules/page-builder/lib/serialize";
import { extractFormJson } from "@/modules/page-builder/lib/extract-form-json";
import { DEFAULT_THEME, type ThemeJson } from "@/modules/page-builder/lib/theme";
import type { CraftSerializedState, PageDocument } from "@/modules/page-builder/types/page-document";
import type { FormJson } from "@/modules/page-builder/types/form-field";

export type SerializedLandingPage = {
  id: string;
  advertiserId: string;
  campaignId: string | null;
  slug: string;
  name: string;
  status: string;
  craftState: PageDocument;
  themeJson: ThemeJson;
  formJson: FormJson | null;
  publishedVersionId: string | null;
  autosaveAt: string | null;
  createdAt: string;
  updatedAt: string;
};

function serializePage(page: {
  id: string;
  advertiserId: string;
  campaignId: string | null;
  slug: string;
  name: string;
  status: string;
  craftState: unknown;
  themeJson: unknown;
  formJson: unknown;
  publishedVersionId: string | null;
  autosaveAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}): SerializedLandingPage {
  return {
    id: page.id,
    advertiserId: page.advertiserId,
    campaignId: page.campaignId,
    slug: page.slug,
    name: page.name,
    status: page.status,
    craftState: parseStoredCraftState(page.craftState),
    themeJson: (page.themeJson as ThemeJson) ?? DEFAULT_THEME,
    formJson: page.formJson as FormJson | null,
    publishedVersionId: page.publishedVersionId,
    autosaveAt: page.autosaveAt?.toISOString() ?? null,
    createdAt: page.createdAt.toISOString(),
    updatedAt: page.updatedAt.toISOString(),
  };
}

async function createUniqueSlug(advertiserId: string, seed: string) {
  const base = slugifyOptinAddress(seed) || "landing";
  let slug = base;
  let attempt = 0;
  while (true) {
    const existing = await prisma.landingPage.findUnique({ where: { slug } });
    if (!existing || existing.advertiserId === advertiserId) return slug;
    attempt += 1;
    slug = `${base}-${attempt}`;
  }
}

export async function listLandingPages(advertiserId: string) {
  const pages = await prisma.landingPage.findMany({
    where: { advertiserId, status: { not: "ARCHIVED" } },
    orderBy: { updatedAt: "desc" },
  });
  return pages.map(serializePage);
}

export async function getLandingPage(id: string, advertiserId: string) {
  const page = await prisma.landingPage.findFirst({
    where: { id, advertiserId },
  });
  if (!page) throw Errors.notFound("Landing page");
  return serializePage(page);
}

export async function createLandingPage(
  advertiserId: string,
  input: { name: string; templateId?: string; campaignId?: string },
) {
  const slug = await createUniqueSlug(advertiserId, input.name);
  let craftState: CraftSerializedState = createEmptyCraftState();
  let themeJson: ThemeJson = DEFAULT_THEME;

  if (input.templateId) {
    const template = await prisma.pageTemplate.findUnique({ where: { id: input.templateId } });
    if (template) {
      craftState = parseStoredCraftState(template.craftState).craft;
      themeJson = (template.themeJson as ThemeJson) ?? DEFAULT_THEME;
    }
  }

  const page = await prisma.landingPage.create({
    data: {
      advertiserId,
      name: input.name.trim(),
      slug,
      campaignId: input.campaignId ?? null,
      craftState: toPrismaJson({ craft: normalizeCraftState(craftState), meta: { schemaVersion: 1, editorBreakPoint: "desktop" } }),
      themeJson: toPrismaJson(themeJson),
    },
  });

  return serializePage(page);
}

export async function updateLandingPage(
  id: string,
  advertiserId: string,
  input: {
    name?: string;
    slug?: string;
    campaignId?: string | null;
    craftState?: CraftSerializedState;
    themeJson?: ThemeJson;
    autosave?: boolean;
  },
) {
  const existing = await prisma.landingPage.findFirst({ where: { id, advertiserId } });
  if (!existing) throw Errors.notFound("Landing page");

  let slug = existing.slug;
  if (input.slug) {
    slug = slugifyOptinAddress(input.slug);
    if (!isValidOptinSlug(slug)) {
      throw Errors.validation("Slug must be at least 2 characters, lowercase letters, numbers, or hyphens.");
    }
    const taken = await prisma.landingPage.findUnique({ where: { slug } });
    if (taken && taken.id !== id) {
      throw Errors.validation("This page address is already taken.");
    }
  }

  const campaignId = input.campaignId !== undefined ? input.campaignId : existing.campaignId;
  let formJson: FormJson | null = existing.formJson as FormJson | null;

  if (input.craftState && campaignId) {
    formJson = extractFormJson(input.craftState, campaignId);
  } else if (input.craftState) {
    formJson = extractFormJson(input.craftState, existing.campaignId ?? "");
  }

  const craftEnvelope = input.craftState
    ? toPrismaJson({ craft: normalizeCraftState(input.craftState), meta: { schemaVersion: 1 as const, editorBreakPoint: "desktop" as const } })
    : undefined;

  const page = await prisma.landingPage.update({
    where: { id },
    data: {
      ...(input.name ? { name: input.name.trim() } : {}),
      slug,
      ...(input.campaignId !== undefined ? { campaignId: input.campaignId } : {}),
      ...(craftEnvelope ? { craftState: craftEnvelope } : {}),
      ...(input.themeJson ? { themeJson: toPrismaJson(input.themeJson) } : {}),
      ...(formJson !== undefined ? { formJson: formJson ? toPrismaJson(formJson) : undefined } : {}),
      autosaveAt: new Date(),
    },
  });

  if (!input.autosave && craftEnvelope && input.craftState) {
    await createVersionSnapshot(id, advertiserId, input.craftState, (input.themeJson ?? page.themeJson) as ThemeJson, formJson, "Manual save");
  }

  return serializePage(page);
}

export async function deleteLandingPage(id: string, advertiserId: string) {
  const page = await prisma.landingPage.findFirst({ where: { id, advertiserId } });
  if (!page) throw Errors.notFound("Landing page");
  await prisma.landingPage.update({
    where: { id },
    data: { status: "ARCHIVED" },
  });
}

export async function duplicateLandingPage(id: string, advertiserId: string) {
  const page = await prisma.landingPage.findFirst({ where: { id, advertiserId } });
  if (!page) throw Errors.notFound("Landing page");
  const slug = await createUniqueSlug(advertiserId, `${page.slug}-copy`);
  const copy = await prisma.landingPage.create({
    data: {
      advertiserId,
      name: `${page.name} (Copy)`,
      slug,
      campaignId: page.campaignId,
      craftState: page.craftState as object,
      themeJson: page.themeJson as object,
      formJson: page.formJson ? (page.formJson as object) : undefined,
      status: "DRAFT",
    },
  });
  return serializePage(copy);
}

async function getNextVersionNumber(landingPageId: string) {
  const latest = await prisma.landingPageVersion.findFirst({
    where: { landingPageId },
    orderBy: { versionNumber: "desc" },
  });
  return (latest?.versionNumber ?? 0) + 1;
}

export async function createVersionSnapshot(
  landingPageId: string,
  createdById: string,
  craftState: CraftSerializedState,
  themeJson: ThemeJson,
  formJson: FormJson | null,
  label: string,
) {
  const versionNumber = await getNextVersionNumber(landingPageId);
  return prisma.landingPageVersion.create({
    data: {
      landingPageId,
      versionNumber,
      label,
      craftState: toPrismaJson(craftState),
      themeJson: toPrismaJson(themeJson),
      formJson: formJson ? toPrismaJson(formJson) : undefined,
      createdById,
    },
  });
}

export async function publishLandingPage(id: string, advertiserId: string) {
  const page = await prisma.landingPage.findFirst({
    where: { id, advertiserId },
    include: { campaign: true },
  });
  if (!page) throw Errors.notFound("Landing page");
  if (!page.campaignId || !page.campaign || page.campaign.status !== "ACTIVE") {
    throw Errors.validation("Link an active campaign before publishing.");
  }

  const doc = parseStoredCraftState(page.craftState);
  const formJson = extractFormJson(doc.craft, page.campaignId);
  if (!formJson?.fields.length) {
    throw Errors.validation("Add at least one form field before publishing.");
  }

  const version = await createVersionSnapshot(
    id,
    advertiserId,
    doc.craft,
    (page.themeJson as ThemeJson) ?? DEFAULT_THEME,
    formJson,
    "Published",
  );

  const updated = await prisma.landingPage.update({
    where: { id },
    data: {
      status: "PUBLISHED",
      publishedVersionId: version.id,
      formJson,
    },
  });

  const { onPagePublished } = await import("@/modules/page-builder/services/extension-hooks");
  await onPagePublished({
    landingPageId: id,
    versionId: version.id,
    advertiserId,
    slug: updated.slug,
  });

  return serializePage(updated);
}

export async function getPublishedLandingPage(slug: string) {
  const page = await prisma.landingPage.findUnique({
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

  const doc = parseStoredCraftState(page.publishedVersion.craftState);
  return {
    slug: page.slug,
    name: page.name,
    campaignId: page.campaignId!,
    craftState: doc.craft,
    themeJson: (page.publishedVersion.themeJson as ThemeJson) ?? DEFAULT_THEME,
    formJson: page.publishedVersion.formJson as FormJson | null,
  };
}

export async function getLandingPageDraftPreview(slug: string, advertiserId: string) {
  const page = await prisma.landingPage.findFirst({
    where: { slug, advertiserId },
  });
  if (!page) return null;
  const doc = parseStoredCraftState(page.craftState);
  return {
    slug: page.slug,
    name: page.name,
    craftState: doc.craft,
    themeJson: (page.themeJson as ThemeJson) ?? DEFAULT_THEME,
    formJson: page.formJson as FormJson | null,
  };
}
