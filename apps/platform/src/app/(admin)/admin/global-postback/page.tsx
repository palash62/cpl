import { requireAuth } from "@/lib/session";
import { AdminGlobalPostbackForm } from "@/components/admin/admin-global-postback-form";

export default async function AdminGlobalPostbackPage() {
  await requireAuth(["ADMIN"]);
  return <AdminGlobalPostbackForm />;
}
