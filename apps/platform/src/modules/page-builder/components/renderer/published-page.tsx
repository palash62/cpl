"use client";

import { useCallback } from "react";
import { PageRenderer } from "@/modules/page-builder/components/renderer/page-renderer";
import { LeadForm } from "@/modules/page-builder/blocks/lead-form";
import type { CraftSerializedState } from "@/modules/page-builder/types/page-document";
import type { ThemeJson } from "@/modules/page-builder/lib/theme";
import type { FormJson } from "@/modules/page-builder/types/form-field";

type PublishedPageProps = {
  slug: string;
  craftState: CraftSerializedState;
  theme: ThemeJson;
  formJson: FormJson | null;
};

export function PublishedPage({ slug, craftState, theme, formJson }: PublishedPageProps) {
  const handleSubmit = useCallback(async (data: Record<string, string>) => {
    const res = await fetch("/api/v1/leads/submit-landing", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        landingPageSlug: slug,
        data,
        honeypot: data.honeypot ?? "",
      }),
    });
    if (!res.ok) {
      const body = await res.json();
      throw new Error(body.error?.message ?? "Submission failed");
    }
  }, [slug]);

  return (
    <PageRenderer
      craftState={craftState}
      theme={theme}
      landingPageSlug={slug}
      formJson={formJson}
      onLeadSubmit={handleSubmit}
    />
  );
}

// Re-export for lead form wiring in published mode
export { LeadForm };
