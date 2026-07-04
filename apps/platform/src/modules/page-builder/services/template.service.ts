import { prisma } from "@/lib/prisma";
import { parseStoredCraftState, createEmptyCraftState, normalizeCraftState, toPrismaJson } from "@/modules/page-builder/lib/serialize";
import type { CraftSerializedState, TemplateExport } from "@/modules/page-builder/types/page-document";
import { DEFAULT_THEME, type ThemeJson } from "@/modules/page-builder/lib/theme";

const CATEGORIES = ["finance", "insurance", "education", "real_estate", "healthcare", "generic"] as const;

function buildFinanceTemplate() {
  const craft = createEmptyCraftState();
  const heading = craft.heading_main;
  if (heading) {
    heading.props = {
      ...heading.props,
      text: "Secure Your Financial Future",
      typography: { fontSize: "2.5rem", fontWeight: "800", textAlign: "center", color: "#1e3a5f" },
    };
  }
  const section = craft.section_main;
  if (section?.props?.style) {
    (section.props.style as Record<string, string>).backgroundColor = "#f0f4f8";
  }
  return craft;
}

const STARTER_TEMPLATES: Array<{
  slug: string;
  name: string;
  category: string;
  craftState: ReturnType<typeof createEmptyCraftState>;
  themeJson: ThemeJson;
}> = [
  {
    slug: "generic-lead-gen",
    name: "Generic Lead Generation",
    category: "generic",
    craftState: createEmptyCraftState(),
    themeJson: DEFAULT_THEME,
  },
  {
    slug: "finance-pro",
    name: "Finance Pro",
    category: "finance",
    craftState: buildFinanceTemplate(),
    themeJson: { ...DEFAULT_THEME, primaryColor: "#1e40af", secondaryColor: "#0ea5e9" },
  },
  {
    slug: "insurance-trust",
    name: "Insurance Trust",
    category: "insurance",
    craftState: createEmptyCraftState(),
    themeJson: { ...DEFAULT_THEME, primaryColor: "#059669", secondaryColor: "#10b981" },
  },
  {
    slug: "education-course",
    name: "Education Course",
    category: "education",
    craftState: createEmptyCraftState(),
    themeJson: { ...DEFAULT_THEME, primaryColor: "#7c3aed", secondaryColor: "#a78bfa" },
  },
  {
    slug: "real-estate-listing",
    name: "Real Estate Listing",
    category: "real_estate",
    craftState: createEmptyCraftState(),
    themeJson: { ...DEFAULT_THEME, primaryColor: "#b45309", secondaryColor: "#d97706" },
  },
  {
    slug: "healthcare-consult",
    name: "Healthcare Consult",
    category: "healthcare",
    craftState: createEmptyCraftState(),
    themeJson: { ...DEFAULT_THEME, primaryColor: "#0891b2", secondaryColor: "#06b6d4" },
  },
];

export async function seedStarterTemplates() {
  for (const t of STARTER_TEMPLATES) {
    await prisma.pageTemplate.upsert({
      where: { slug: t.slug },
      create: {
        slug: t.slug,
        name: t.name,
        category: t.category,
        craftState: toPrismaJson(normalizeCraftState(t.craftState)),
        themeJson: toPrismaJson(t.themeJson),
        isSystem: true,
      },
      update: {},
    });
  }
}

export async function listTemplates(advertiserId: string, category?: string) {
  await seedStarterTemplates();
  const templates = await prisma.pageTemplate.findMany({
    where: {
      OR: [{ isSystem: true }, { advertiserId }],
      ...(category ? { category } : {}),
    },
    orderBy: { name: "asc" },
  });

  const favorites = await prisma.pageTemplateFavorite.findMany({
    where: { advertiserId },
    select: { templateId: true },
  });
  const favSet = new Set(favorites.map((f) => f.templateId));

  return templates.map((t) => ({
    id: t.id,
    slug: t.slug,
    name: t.name,
    category: t.category,
    thumbnailUrl: t.thumbnailUrl,
    isSystem: t.isSystem,
    isFavorite: favSet.has(t.id),
    craftState: parseStoredCraftState(t.craftState).craft,
    themeJson: t.themeJson as ThemeJson,
  }));
}

export async function toggleTemplateFavorite(advertiserId: string, templateId: string) {
  const existing = await prisma.pageTemplateFavorite.findUnique({
    where: { advertiserId_templateId: { advertiserId, templateId } },
  });
  if (existing) {
    await prisma.pageTemplateFavorite.delete({
      where: { advertiserId_templateId: { advertiserId, templateId } },
    });
    await prisma.pageTemplate.update({
      where: { id: templateId },
      data: { favoriteCount: { decrement: 1 } },
    });
    return { favorited: false };
  }
  await prisma.pageTemplateFavorite.create({
    data: { advertiserId, templateId },
  });
  await prisma.pageTemplate.update({
    where: { id: templateId },
    data: { favoriteCount: { increment: 1 } },
  });
  return { favorited: true };
}

export async function importTemplate(
  advertiserId: string,
  data: TemplateExport,
) {
  const slug = `import-${Date.now()}`;
  return prisma.pageTemplate.create({
    data: {
      slug,
      name: data.templateMeta.name,
      category: data.templateMeta.category,
      craftState: toPrismaJson(normalizeCraftState(data.craft as CraftSerializedState)),
      themeJson: toPrismaJson(data.theme),
      isSystem: false,
      advertiserId,
    },
  });
}

export async function exportTemplate(templateId: string): Promise<TemplateExport> {
  const t = await prisma.pageTemplate.findUniqueOrThrow({ where: { id: templateId } });
  return {
    templateMeta: {
      name: t.name,
      category: t.category,
      schemaVersion: 1,
    },
    craft: parseStoredCraftState(t.craftState).craft,
    theme: t.themeJson as ThemeJson,
  };
}

export { CATEGORIES };
