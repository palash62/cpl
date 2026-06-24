import { withAuth } from "@/lib/api-handler";
import {
  getPlatformSettingsRecord,
  updatePlatformSettings,
} from "@/services/admin.service";

export async function GET() {
  return withAuth(async () => {
    const settings = await getPlatformSettingsRecord();
    return Response.json({ data: settings });
  }, ["ADMIN"]);
}

export async function PATCH(request: Request) {
  return withAuth(async (session) => {
    const body = await request.json();
    const settings = await updatePlatformSettings(body, session.user.id);
    return Response.json({ data: settings });
  }, ["ADMIN"]);
}
