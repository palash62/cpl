import { prisma } from "@/lib/prisma";
import { Errors } from "@/lib/errors";
import { toPrismaJson } from "@/modules/page-builder/lib/serialize";
import type { ThemeJson } from "@/modules/page-builder/lib/theme";
import type { CraftSerializedState } from "@/modules/page-builder/types/page-document";
import type { FormJson } from "@/modules/page-builder/types/form-field";
import { getLandingPage, createVersionSnapshot } from "@/modules/page-builder/services/landing-page.service";

export async function listPageVersions(landingPageId: string, advertiserId: string) {
  await getLandingPage(landingPageId, advertiserId);
  return prisma.landingPageVersion.findMany({
    where: { landingPageId },
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

export async function restorePageVersion(
  landingPageId: string,
  versionId: string,
  advertiserId: string,
) {
  await getLandingPage(landingPageId, advertiserId);
  const version = await prisma.landingPageVersion.findFirst({
    where: { id: versionId, landingPageId },
  });
  if (!version) throw Errors.notFound("Version");

  const craft = version.craftState as CraftSerializedState;
  const theme = version.themeJson as ThemeJson;
  const formJson = version.formJson as FormJson | null;

  await prisma.landingPage.update({
    where: { id: landingPageId },
    data: {
      craftState: toPrismaJson({ craft, meta: { schemaVersion: 1, editorBreakPoint: "desktop" } }),
      themeJson: toPrismaJson(theme),
      formJson: formJson ? toPrismaJson(formJson) : undefined,
      autosaveAt: new Date(),
    },
  });

  await createVersionSnapshot(landingPageId, advertiserId, craft, theme, formJson, "Restored");

  return { restored: true };
}
