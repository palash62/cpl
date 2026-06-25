import { auth } from "@/lib/auth";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/layout/page-header";

export default async function PublisherSettingsPage() {
  const session = await auth();

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" description="Manage your account profile" />
      <div className="premium-card">
        <CardHeader>
          <CardTitle className="text-base">Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p><span className="text-slate-500">Name:</span> <span className="text-slate-900">{session?.user?.name}</span></p>
          <p><span className="text-slate-500">Email:</span> <span className="text-slate-900">{session?.user?.email}</span></p>
          <Badge variant="outline">{session?.user?.role}</Badge>
        </CardContent>
      </div>
    </div>
  );
}
