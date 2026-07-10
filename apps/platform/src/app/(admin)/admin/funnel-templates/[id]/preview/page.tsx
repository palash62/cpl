import { notFound } from "next/navigation";
import { getSession } from "@/lib/session";
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
  const session = await getSession();
  if (!session || session.user.role !== "ADMIN") notFound();

  const { id } = await params;
  const query = await searchParams;
  const step = query.step === "thankYou" ? "thankYou" : "optin";
  const breakpoint = parseBreakpointParam(query.bp);
  const matchEditorCanvas = query.frame === "1";
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
