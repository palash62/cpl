import { notFound } from "next/navigation";
import { getSession } from "@/lib/session";
import { getOptinFunnelTemplateByAdmin } from "@/services/optin-funnel.service";
import { AdminFunnelTemplateDetailPanel } from "@/components/admin/admin-funnel-template-detail-panel";

export const dynamic = "force-dynamic";

export default async function AdminFunnelTemplateDetailPage({
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

  const appUrl = process.env.APP_URL ?? process.env.NEXT_PUBLIC_PLATFORM_URL ?? "http://localhost:3000";
  return <AdminFunnelTemplateDetailPanel initialTemplate={template} appUrl={appUrl.replace(/\/$/, "")} />;
}
