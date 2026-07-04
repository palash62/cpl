import { recordClick } from "@/modules/email-marketing";

type Params = { params: Promise<{ sendId: string; token: string }> };

export async function GET(request: Request, { params }: Params) {
  const { sendId, token } = await params;
  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url");

  if (!url) {
    return new Response("Missing url", { status: 400 });
  }

  const target = await recordClick(sendId, token, url);
  if (!target) {
    return Response.redirect(url, 302);
  }

  return Response.redirect(target, 302);
}
