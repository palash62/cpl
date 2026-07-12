import type { OptinFunnelEditorType } from "@prisma/client";
import { usesBuilderRenderer, type SerializedOptinFunnel } from "@/lib/optin-funnel";
import type { ThemeJson } from "@/modules/page-builder/lib/theme";
import type { CraftSerializedState, PageDocument } from "@/modules/page-builder/types/page-document";
import type { OptinFunnelTemplate } from "@/services/optin-funnel.service";

export type FunnelStepId = "optin" | "thankYou";

export type FunnelStepItem = {
  id: FunnelStepId;
  name: string;
  path: string;
  enabled: boolean;
};

export type FunnelWorkflowEntity = {
  id: string;
  name: string;
  slug: string;
  craftState: PageDocument | null;
  themeJson: ThemeJson | null;
  thankYouEnabled: boolean;
  thankYouCraftState: PageDocument | null;
  thankYouThemeJson: ThemeJson | null;
  destinationUrl: string | null;
  thankYouPixelHtml: string | null;
  updatedAt?: string;
  editorType?: OptinFunnelEditorType | string;
  templateId?: string | null;
  isPublished?: boolean;
  campaignId?: string | null;
  headline?: string;
  subheadline?: string;
  description?: string | null;
  ctaText?: string;
  successTitle?: string;
  successMessage?: string;
  badgeText?: string | null;
  bulletPoints?: string[] | null;
  primaryColor?: string | null;
  accentColor?: string | null;
};

export type FunnelWorkflowConfig = {
  apiBasePath: string;
  editPath: (id: string, step: FunnelStepId) => string;
  previewPath: (id: string, step: FunnelStepId) => string;
  backHref: string;
  showPublishHint?: boolean;
  settingsDescription?: string;
  thankYouRedirectHint?: (slug: string) => string;
};

export function wrapCraft(craft: CraftSerializedState | PageDocument | null | undefined): PageDocument | null {
  if (!craft) return null;
  if (typeof craft === "object" && "craft" in craft) {
    return craft as PageDocument;
  }
  return {
    craft: craft as CraftSerializedState,
    meta: { schemaVersion: 1, editorBreakPoint: "desktop" },
  };
}

function craftNodeName(node: unknown): string | null {
  if (!node || typeof node !== "object") return null;
  return (node as { type?: { resolvedName?: string } }).type?.resolvedName ?? null;
}

function isBlankOrStructuralCraft(craftState: PageDocument | null): boolean {
  const craft = craftState?.craft;
  if (!craft || Object.keys(craft).length <= 1) return true;

  const structural = new Set(["CanvasRoot", "Section", "Container", "Row", "Column"]);
  return !Object.values(craft).some((node) => {
    const name = craftNodeName(node);
    return !!name && !structural.has(name);
  });
}

export function funnelHasOptinPreview(funnel: SerializedOptinFunnel): boolean {
  const entity = toFunnelWorkflowEntityFromFunnel(funnel);
  if (entity.editorType) {
    return usesBuilderRenderer({
      editorType: entity.editorType as OptinFunnelEditorType,
      craftState: entity.craftState,
    });
  }
  return !isBlankOrStructuralCraft(entity.craftState);
}

export function toFunnelWorkflowEntityFromFunnel(funnel: SerializedOptinFunnel): FunnelWorkflowEntity {
  return {
    id: funnel.id,
    name: funnel.name,
    slug: funnel.slug,
    craftState: funnel.craftState,
    themeJson: funnel.themeJson,
    thankYouEnabled: funnel.thankYouEnabled,
    thankYouCraftState: funnel.thankYouCraftState,
    thankYouThemeJson: funnel.thankYouThemeJson,
    destinationUrl: funnel.destinationUrl,
    thankYouPixelHtml: funnel.thankYouPixelHtml,
    updatedAt: funnel.updatedAt,
    editorType: funnel.editorType,
    templateId: funnel.templateId,
    isPublished: funnel.isPublished,
    campaignId: funnel.campaignId,
    headline: funnel.headline,
    subheadline: funnel.subheadline,
    description: funnel.description,
    ctaText: funnel.ctaText,
    successTitle: funnel.successTitle,
    successMessage: funnel.successMessage,
    badgeText: funnel.badgeText,
    bulletPoints: funnel.bulletPoints,
    primaryColor: funnel.primaryColor,
    accentColor: funnel.accentColor,
  };
}

export function toFunnelWorkflowEntityFromAdminTemplate(template: OptinFunnelTemplate): FunnelWorkflowEntity {
  return {
    id: template.id,
    name: template.name,
    slug: template.slug,
    craftState: wrapCraft(template.craftState),
    themeJson: template.themeJson,
    thankYouEnabled: template.thankYouEnabled,
    thankYouCraftState: wrapCraft(template.thankYouCraftState),
    thankYouThemeJson: template.thankYouThemeJson,
    destinationUrl: template.destinationUrl,
    thankYouPixelHtml: template.thankYouPixelHtml,
    updatedAt: template.createdAt,
    editorType: "BUILDER",
  };
}

export function advertiserFunnelWorkflow(): FunnelWorkflowConfig {
  return {
    apiBasePath: "/api/v1/advertiser/optin-funnels",
    editPath: (id, step) => `/advertiser/optin-funnels/${id}/edit?step=${step}`,
    previewPath: (_id, step) =>
      step === "thankYou"
        ? `/o/{slug}/thank-you?preview=1&frame=1&bp=desktop`
        : `/o/{slug}?preview=1&frame=1&bp=desktop`,
    backHref: "/advertiser/optin-funnels",
    showPublishHint: true,
    settingsDescription: "Configure submit behavior and tracking for this funnel.",
    thankYouRedirectHint: (slug) => `Users will go to /o/${slug}/thank-you after submit.`,
  };
}

export function adminFunnelWorkflow(templateId: string): FunnelWorkflowConfig {
  return {
    apiBasePath: "/api/v1/admin/optin-funnel-templates",
    editPath: (id, step) => `/admin/funnel-templates/${id}/edit?step=${step}`,
    previewPath: (id, step) =>
      step === "thankYou"
        ? `/admin/funnel-templates/${id}/preview?step=thankYou&frame=1&bp=desktop`
        : `/admin/funnel-templates/${id}/preview?frame=1&bp=desktop`,
    backHref: "/admin/funnel-templates",
    showPublishHint: false,
    settingsDescription: "Configure submit behavior and tracking for this template.",
    thankYouRedirectHint: (slug) =>
      `Advertisers inherit this thank-you step when creating funnels from this template (${slug}).`,
  };
}

export function resolvePreviewUrl(
  entity: FunnelWorkflowEntity,
  workflow: FunnelWorkflowConfig,
  stepId: FunnelStepId,
  appUrl: string,
): { previewPath: string; previewUrl: string } {
  const pathTemplate = workflow.previewPath(entity.id, stepId);
  const previewPath = pathTemplate.replace("{slug}", entity.slug);
  return {
    previewPath,
    previewUrl: `${appUrl}${previewPath}`,
  };
}

export function buildFunnelSteps(thankYouEnabled: boolean): FunnelStepItem[] {
  return [
    { id: "optin", name: "optin page", path: "", enabled: true },
    { id: "thankYou", name: "thank you", path: "thank-you", enabled: thankYouEnabled },
  ];
}

export function funnelStepCount(thankYouEnabled: boolean): number {
  return thankYouEnabled ? 2 : 1;
}

const funnelDateFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: "UTC",
  month: "short",
  day: "numeric",
  year: "numeric",
});

const funnelDateTimeFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: "UTC",
  month: "short",
  day: "numeric",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
});

/** SSR-safe: fixed locale + UTC so server and browser render identical text. */
export function formatFunnelDateShort(iso: string): string {
  return funnelDateFormatter.format(new Date(iso));
}

export function formatFunnelDate(iso: string): string {
  return funnelDateTimeFormatter.format(new Date(iso));
}
