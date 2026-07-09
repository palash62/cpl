import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { AdminFunnelTemplatesList } from "@/components/admin/admin-funnel-templates-list";

export const dynamic = "force-dynamic";

export default async function AdminFunnelTemplatesPage() {
  const session = await getSession();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    redirect("/login");
  }

  return <AdminFunnelTemplatesList />;
}
