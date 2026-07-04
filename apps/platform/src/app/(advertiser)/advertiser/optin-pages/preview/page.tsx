import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getOrCreateAdvertiserOptinPage } from "@/services/optin-page.service";

export default async function AdvertiserOptinPreviewRedirect() {
  const session = await getSession();
  const page = await getOrCreateAdvertiserOptinPage(session!.user.id);
  redirect(`/o/${page.slug}?preview=1`);
}
