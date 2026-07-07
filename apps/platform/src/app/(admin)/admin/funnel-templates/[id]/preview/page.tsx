import { notFound } from "next/navigation";
import { getSession } from "@/lib/session";
import { FunnelTemplatePreview } from "@/components/admin/funnel-template-preview";
import { getOptinFunnelTemplateByAdmin } from "@/services/optin-funnel.service";
import { DEFAULT_THEME } from "@/modules/page-builder/lib/theme";

export const dynamic = "force-dynamic";

export default async function AdminFunnelTemplatePreviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session || session.user.role !== "ADMIN") notFound();

  const { id } = await params;
  let template;
  try {
    template = await getOptinFunnelTemplateByAdmin(id);
  } catch {
    notFound();
  }

  return (
    <FunnelTemplatePreview
      templateName={template.name}
      craftState={template.craftState}
      theme={template.themeJson ?? DEFAULT_THEME}
    />
  );
}
