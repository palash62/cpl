import { notFound } from "next/navigation";
import { getSession } from "@/lib/session";
import { FunnelTemplatePreview } from "@/components/admin/funnel-template-preview";
import { getOptinFunnelTemplateByAdmin } from "@/services/optin-funnel.service";
import { DEFAULT_THEME } from "@/modules/page-builder/lib/theme";

export const dynamic = "force-dynamic";

export default async function AdminFunnelTemplatePreviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ step?: string }>;
}) {
  const session = await getSession();
  if (!session || session.user.role !== "ADMIN") notFound();

  const { id } = await params;
  const query = await searchParams;
  const step = query.step === "thankYou" ? "thankYou" : "optin";
  let template;
  try {
    template = await getOptinFunnelTemplateByAdmin(id);
  } catch {
    notFound();
  }

  return (
    <FunnelTemplatePreview
      templateName={template.name}
      craftState={step === "thankYou" ? (template.thankYouCraftState ?? template.craftState) : template.craftState}
      theme={
        step === "thankYou"
          ? (template.thankYouThemeJson ?? template.themeJson ?? DEFAULT_THEME)
          : (template.themeJson ?? DEFAULT_THEME)
      }
    />
  );
}
