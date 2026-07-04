import type { OptinTemplateId } from "@/lib/optin-templates";
import { getDefaultTemplateId, isOptinTemplateId } from "@/lib/optin-templates";

export type OptinPageContent = {
  id: string;
  slug: string;
  title: string;
  destinationUrl: string | null;
  campaignId: string | null;
  templateId: OptinTemplateId;
  headline: string;
  subheadline: string;
  description: string | null;
  ctaText: string;
  successTitle: string;
  successMessage: string;
  badgeText: string | null;
  bulletPoints: string[];
  primaryColor: string;
  accentColor: string;
  isPublished: boolean;
};

export const DEFAULT_OPTIN_PAGE: Omit<OptinPageContent, "id" | "slug" | "campaignId"> = {
  title: "My Optin Page",
  destinationUrl: null,
  templateId: "aurora",
  headline: "Get Your Free Growth Playbook",
  subheadline: "The exact framework 12,000+ marketers use to 3× their leads",
  description:
    "Instant access to proven strategies that turn visitors into customers. No fluff — just actionable tactics delivered straight to your inbox.",
  ctaText: "Get Instant Access — It's Free",
  successTitle: "You're In! 🎉",
  successMessage: "Check your inbox — your free playbook is on its way. Welcome to the community!",
  badgeText: "🔥 Limited free access",
  bulletPoints: [
    "Proven playbook you can implement in 24 hours",
    "Weekly tips from top-performing marketers",
    "100% free — unsubscribe with one click",
  ],
  primaryColor: "#6366f1",
  accentColor: "#a855f7",
  isPublished: false,
};

export function parseBulletPoints(value: unknown): string[] {
  if (!Array.isArray(value)) return DEFAULT_OPTIN_PAGE.bulletPoints;
  return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
}

export function serializeOptinPage(page: {
  id: string;
  slug: string;
  title?: string | null;
  destinationUrl?: string | null;
  campaignId: string | null;
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
}): OptinPageContent {
  return {
    id: page.id,
    slug: page.slug,
    title: page.title?.trim() || DEFAULT_OPTIN_PAGE.title,
    destinationUrl: page.destinationUrl?.trim() || null,
    campaignId: page.campaignId,
    templateId: isOptinTemplateId(page.templateId ?? "")
      ? (page.templateId as OptinTemplateId)
      : getDefaultTemplateId(),
    headline: page.headline,
    subheadline: page.subheadline,
    description: page.description,
    ctaText: page.ctaText,
    successTitle: page.successTitle,
    successMessage: page.successMessage,
    badgeText: page.badgeText,
    bulletPoints: parseBulletPoints(page.bulletPoints),
    primaryColor: page.primaryColor,
    accentColor: page.accentColor,
    isPublished: page.isPublished,
  };
}

export type PublicOptinPage = OptinPageContent & {
  campaignName: string;
  displayTitle: string;
  fields: Array<{
    fieldName: string;
    label: string;
    fieldType: string;
    required: boolean;
  }>;
  previewMode?: boolean;
  thankYouEnabled?: boolean;
  funnelId?: string;
};

export const PREVIEW_FALLBACK_FIELDS: PublicOptinPage["fields"] = [
  { fieldName: "first_name", label: "First Name", fieldType: "text", required: true },
  { fieldName: "email", label: "Email", fieldType: "email", required: true },
  { fieldName: "phone", label: "Phone", fieldType: "phone", required: true },
];

export function buildPublicOptinPage(
  page: Parameters<typeof serializeOptinPage>[0],
  campaign?: {
    name: string;
    fields: Array<{
      fieldName: string;
      label: string;
      fieldType: string;
      required: boolean;
    }>;
  } | null,
  options?: { previewMode?: boolean },
): PublicOptinPage {
  const fields =
    campaign && campaign.fields.length > 0
      ? campaign.fields.map((field) => ({
          fieldName: field.fieldName,
          label: field.label,
          fieldType: field.fieldType,
          required: field.required,
        }))
      : PREVIEW_FALLBACK_FIELDS;

  return {
    ...serializeOptinPage(page),
    campaignName: campaign?.name ?? page.title?.trim() ?? "Preview Campaign",
    displayTitle: page.title?.trim() || campaign?.name || DEFAULT_OPTIN_PAGE.title,
    fields,
    previewMode: options?.previewMode,
    thankYouEnabled: Boolean((page as { thankYouEnabled?: boolean }).thankYouEnabled),
    funnelId: page.id,
  };
}

export function serializePublicOptinPage(
  page: Parameters<typeof serializeOptinPage>[0] & {
    campaign: {
      name: string;
      fields: Array<{
        fieldName: string;
        label: string;
        fieldType: string;
        required: boolean;
      }>;
    };
  },
): PublicOptinPage {
  return buildPublicOptinPage(page, page.campaign);
}
