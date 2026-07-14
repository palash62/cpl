import { recordClick } from "@/modules/email-marketing";
import { isSafeHttpUrl } from "@/lib/safe-url";

type Params = { params: Promise<{ sendId: string; token: string }> };

export async function GET(request: Request, { params }: Params) {
  const { sendId, token } = await params;
  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url");

  if (!url || !isSafeHttpUrl(url)) {
    return new Response("Not found", { status: 404 });
  }

  const target = await recordClick(sendId, token, url);
  if (!target || !isSafeHttpUrl(target)) {
    return new Response("Not found", { status: 404 });
  }

  return Response.redirect(target, 302);
}
