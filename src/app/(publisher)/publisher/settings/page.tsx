import { auth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function PublisherSettingsPage() {
  const session = await auth();

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Settings</h2>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p><span className="text-muted-foreground">Name:</span> {session?.user?.name}</p>
          <p><span className="text-muted-foreground">Email:</span> {session?.user?.email}</p>
          <Badge>{session?.user?.role}</Badge>
        </CardContent>
      </Card>
    </div>
  );
}
