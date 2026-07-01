import { RoleHero } from "@/components/layout/role-hero";
import { EmailTemplateEditor } from "@/components/advertiser/email/email-template-editor";

export const dynamic = "force-dynamic";

export default function NewEmailTemplatePage() {
  return (
    <div className="space-y-6">
      <RoleHero eyebrow="Email" title="New template" description="Design your email content." />
      <EmailTemplateEditor />
    </div>
  );
}
