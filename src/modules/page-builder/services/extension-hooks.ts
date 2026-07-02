/**
 * Extension hooks for future A/B testing, analytics, AI, and collaboration.
 * Implementations are no-ops in v1; wire real modules without refactoring core builder.
 */

export type PublishEvent = {
  landingPageId: string;
  versionId: string;
  advertiserId: string;
  slug: string;
};

export type AnalyticsEvent = {
  landingPageId: string;
  slug: string;
  event: "page_view" | "form_start" | "form_submit";
  metadata?: Record<string, unknown>;
};

export type AbVariantHook = {
  landingPageId: string;
  variantId?: string;
};

export async function onPagePublished(_event: PublishEvent): Promise<void> {
  // Future: invalidate CDN, notify webhooks, enable A/B variant routing
}

export async function trackPageEvent(_event: AnalyticsEvent): Promise<void> {
  // Future: PageAnalyticsEvent table + heatmap scripts
}

export function resolveAbVariant(_hook: AbVariantHook): string | null {
  // Future: return variant craftState id for split traffic
  return null;
}

export type AiGenerateRequest = {
  prompt: string;
  category: string;
  advertiserId: string;
};

export async function generatePageFromPrompt(_req: AiGenerateRequest): Promise<null> {
  // Future: AI module populates craftState
  return null;
}

export type CollaborationLock = {
  landingPageId: string;
  userId: string;
};

export async function acquirePageLock(_lock: CollaborationLock): Promise<boolean> {
  // Future: PageCollaborator + distributed lock
  return true;
}
