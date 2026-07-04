import { RoleHero } from "@/components/layout/role-hero";
import { EmailTemplateEditor } from "@/components/advertiser/email/email-template-editor";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function EditEmailTemplatePage({ params }: Props) {
  const { id } = await params;
  return (
    <div className="space-y-6">
      <RoleHero eyebrow="Email" title="Edit template" description="Update subject, body, and merge tags." />
      <EmailTemplateEditor templateId={id} />
    </div>
  );
}
