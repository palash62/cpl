export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { TutorialsPanel } from "@/components/advertiser/tutorials-panel";
import { listTutorialsForAdvertiser } from "@/services/tutorial.service";

export default async function AdvertiserTutorialsPage() {
  const session = await getSession();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const tutorials = await listTutorialsForAdvertiser();

  return <TutorialsPanel tutorials={tutorials} />;
}
