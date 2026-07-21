import type { OptinFunnelEditorType, OptinFunnelStatus } from "@prisma/client";
import { parseStoredCraftState } from "@/modules/page-builder/lib/serialize";
import { DEFAULT_THEME, type ThemeJson } from "@/modules/page-builder/lib/theme";
import type { FormJson } from "@/modules/page-builder/types/form-field";
import type { PageDocument } from "@/modules/page-builder/types/page-document";
import {
  serializeOptinPage,
  type OptinPageContent,
  type PublicOptinPage,
  buildPublicOptinPage,
  serializePublicOptinPage,
} from "@/lib/optin-page";

export function hasStoredBuilderCraft(craftState: PageDocument | null | undefined): boolean {
  const craft = craftState?.craft;
  return !!craft && Object.keys(craft).length > 1;
}

export function usesBuilderRenderer(page: {
  editorType: OptinFunnelEditorType;
  craftState?: PageDocument | null;
}): boolean {
  return page.editorType === "BUILDER" || hasStoredBuilderCraft(page.craftState);
}

export type SerializedOptinFunnel = OptinPageContent & {
  advertiserId: string;
  name: string;
  editorType: OptinFunnelEditorType;
  status: OptinFunnelStatus;
  craftState: PageDocument | null;
  themeJson: ThemeJson;
  formJson: FormJson | null;
  publishedVersionId: string | null;
  thankYouEnabled: boolean;
  thankYouCraftState: PageDocument | null;
  thankYouThemeJson: ThemeJson;
  thankYouPixelHtml: string | null;
  thankYouUseCampaignPixel: boolean;
  customDomainId: string | null;
  cpaOfferId: string | null;
  customDomain: { id: string; domain: string; status: string } | null;
  autosaveAt: string | null;
  createdAt: string;
  updatedAt: string;
};

function parseCraft(value: unknown): PageDocument | null {
  if (!value) return null;
  try {
    // Invalid / empty JSON must not silently become the optin empty skeleton
    // (createEmptyCraftState has a LeadForm) — that makes thank-you thumbnails look like optin.
    if (typeof value === "object") {
      const doc = value as Partial<PageDocument> & { ROOT?: unknown; nodes?: unknown };
      const hasCraftMap =
        !!(doc.craft && typeof doc.craft === "object" && "ROOT" in (doc.craft as object)) ||
        "ROOT" in doc ||
        !!(doc.nodes && typeof doc.nodes === "object" && "ROOT" in (doc.nodes as object));
      if (!hasCraftMap) return null;
    }
    return parseStoredCraftState(value);
  } catch {
    return null;
  }
}

export function serializeOptinFunnel(page: {
  id: string;
  advertiserId: string;
  slug: string;
  name?: string | null;
  title?: string | null;
  destinationUrl?: string | null;
  campaignId: string | null;
  editorType: OptinFunnelEditorType;
  status: OptinFunnelStatus;
  templateId?: string | null;
  headline: string;
  subheadline: string;
  description: string | null;
  ctaText: string;
  successTitle: string;
  successMessage: string;
  badgeText: string | null;
  bulletPoints: unknown;
  primaryColor: string;
  accentColor: string;
  isPublished: boolean;
  craftState?: unknown;
  themeJson?: unknown;
  formJson?: unknown;
  publishedVersionId?: string | null;
  autosaveAt?: Date | null;
  thankYouEnabled?: boolean;
  thankYouCraftState?: unknown;
  thankYouThemeJson?: unknown;
  thankYouPixelHtml?: string | null;
  thankYouUseCampaignPixel?: boolean;
  customDomainId?: string | null;
  cpaOfferId?: string | null;
  customDomain?: { id: string; domain: string; status: string } | null;
  createdAt: Date;
  updatedAt: Date;
}): SerializedOptinFunnel {
  const base = serializeOptinPage(page);
  return {
    ...base,
    advertiserId: page.advertiserId,
    name: page.name?.trim() || page.title?.trim() || "My Optin Funnel",
    editorType: page.editorType,
    status: page.status,
    craftState: parseCraft(page.craftState),
    themeJson: (page.themeJson as ThemeJson) ?? DEFAULT_THEME,
    formJson: (page.formJson as FormJson | null) ?? null,
    publishedVersionId: page.publishedVersionId ?? null,
    thankYouEnabled: page.thankYouEnabled ?? false,
    thankYouCraftState: parseCraft(page.thankYouCraftState),
    thankYouThemeJson: (page.thankYouThemeJson as ThemeJson) ?? DEFAULT_THEME,
    thankYouPixelHtml: page.thankYouPixelHtml?.trim() || null,
    thankYouUseCampaignPixel: page.thankYouUseCampaignPixel ?? true,
    customDomainId: page.customDomainId ?? null,
    cpaOfferId: page.cpaOfferId ?? null,
    customDomain: page.customDomain ?? null,
    autosaveAt: page.autosaveAt?.toISOString() ?? null,
    createdAt: page.createdAt.toISOString(),
    updatedAt: page.updatedAt.toISOString(),
  };
}

export type PublicOptinFunnel = PublicOptinPage & {
  funnelId: string;
  advertiserId: string;
  editorType: OptinFunnelEditorType;
  thankYouEnabled: boolean;
  thankYouUseCampaignPixel: boolean;
  thankYouPixelHtml: string | null;
  cpaOfferId: string | null;
  pixelToken: string | null;
  craftState?: PageDocument | null;
  formJson?: FormJson | null;
  themeJson?: ThemeJson;
};

export function buildPublicOptinFunnel(
  page: Parameters<typeof serializeOptinFunnel>[0],
  campaign?: {
    name: string;
    pixelToken?: string | null;
    fields: Array<{
      fieldName: string;
      label: string;
      fieldType: string;
      required: boolean;
    }>;
  } | null,
  options?: { previewMode?: boolean },
): PublicOptinFunnel {
  const serialized = serializeOptinFunnel(page);
  const publicBase = buildPublicOptinPage(page, campaign, options);
  return {
    ...publicBase,
    funnelId: page.id,
    advertiserId: page.advertiserId,
    editorType: page.editorType,
    thankYouEnabled: serialized.thankYouEnabled,
    thankYouUseCampaignPixel: serialized.thankYouUseCampaignPixel,
    thankYouPixelHtml: serialized.thankYouPixelHtml,
    cpaOfferId: serialized.cpaOfferId,
    pixelToken: campaign?.pixelToken ?? null,
    craftState: serialized.craftState,
    formJson: serialized.formJson,
    themeJson: serialized.themeJson,
  };
}

export function serializePublicOptinFunnel(
  page: Parameters<typeof serializeOptinFunnel>[0] & {
    campaign: {
      name: string;
      pixelToken?: string | null;
      fields: Array<{
        fieldName: string;
        label: string;
        fieldType: string;
        required: boolean;
      }>;
    };
  },
): PublicOptinFunnel {
  return buildPublicOptinFunnel(page, page.campaign);
}

export type PublicThankYouFunnel = {
  funnelId: string;
  slug: string;
  campaignId: string;
  advertiserId: string;
  pixelToken: string | null;
  thankYouUseCampaignPixel: boolean;
  thankYouPixelHtml: string | null;
  thankYouCraftState: PageDocument | null;
  thankYouThemeJson: ThemeJson;
  leadId: string | null;
  previewMode?: boolean;
};
