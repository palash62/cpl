import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getOrCreateAdvertiserOptinPage } from "@/services/optin-page.service";

export const dynamic = "force-dynamic";

export default async function AdvertiserOptinPreviewRedirect() {
  const session = await getSession();
  if (!session?.user) {
    redirect("/login");
  }
  const page = await getOrCreateAdvertiserOptinPage(session.user.id);
  redirect(`/o/${page.slug}?preview=1`);
}
