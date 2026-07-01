import { recordOpen } from "@/modules/email-marketing";

type Params = { params: Promise<{ sendId: string; token: string }> };

const PIXEL = Buffer.from(
  "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
  "base64",
);

export async function GET(_request: Request, { params }: Params) {
  const { sendId, token } = await params;
  await recordOpen(sendId, token);

  return new Response(PIXEL, {
    headers: {
      "Content-Type": "image/gif",
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      Pragma: "no-cache",
      Expires: "0",
    },
  });
}
