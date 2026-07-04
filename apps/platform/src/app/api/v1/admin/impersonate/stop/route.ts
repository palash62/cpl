import { cookies } from "next/headers";
import { VIEW_AS_COOKIE } from "@/lib/view-as";

export async function POST() {
  const cookieStore = await cookies();
  cookieStore.delete(VIEW_AS_COOKIE);
  return Response.json({ data: { cleared: true } });
}
