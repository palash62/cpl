import { PageHero } from "@/components/admin/page-hero";
import { AdminBulkEmailForm } from "@/components/admin/admin-bulk-email-form";

export const dynamic = "force-dynamic";

export default function AdminBulkEmailPage() {
  return (
    <div className="space-y-7">
      <PageHero
        eyebrow="Communications"
        title="Bulk Email"
        description="Email one or many active advertisers or publishers from the admin panel."
      />
      <AdminBulkEmailForm />
    </div>
  );
}
