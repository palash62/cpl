import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { AdminCpaOffersList } from "@/components/admin/admin-cpa-offers-list";

export const dynamic = "force-dynamic";

export default async function AdminCpaOffersPage() {
  const session = await getSession();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    redirect("/login");
  }

  return <AdminCpaOffersList />;
}
