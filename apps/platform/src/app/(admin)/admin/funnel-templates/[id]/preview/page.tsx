import { notFound } from "next/navigation";
import { FunnelTemplatePreview } from "@/components/admin/funnel-template-preview";
import { getOptinFunnelTemplateByAdmin } from "@/services/optin-funnel.service";
import { DEFAULT_THEME } from "@/modules/page-builder/lib/theme";
import { parseBreakpointParam } from "@/modules/page-builder/lib/editor-canvas";
import { normalizePreviewCraft } from "@/modules/page-builder/lib/preview-craft";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminFunnelTemplatePreviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ step?: string; bp?: string; frame?: string }>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const step = query.step === "thankYou" ? "thankYou" : "optin";
  const breakpoint = parseBreakpointParam(query.bp ?? "desktop");
  const matchEditorCanvas = query.frame !== "0";
  let template;
  try {
    template = await getOptinFunnelTemplateByAdmin(id);
  } catch {
    notFound();
  }

  const rawCraft =
    step === "thankYou" ? (template.thankYouCraftState ?? template.craftState) : template.craftState;
  const theme =
    step === "thankYou"
      ? (template.thankYouThemeJson ?? template.themeJson ?? DEFAULT_THEME)
      : (template.themeJson ?? DEFAULT_THEME);

  return (
    <FunnelTemplatePreview
      templateName={template.name}
      craftState={normalizePreviewCraft(rawCraft)}
      theme={theme}
      breakpoint={breakpoint}
      matchEditorCanvas={matchEditorCanvas}
    />
  );
}
