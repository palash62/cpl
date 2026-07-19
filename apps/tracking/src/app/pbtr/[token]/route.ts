import { handleLegacyTokenCpaPostback } from "@/lib/cpa-pbtr";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  return handleLegacyTokenCpaPostback(request, token);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  return handleLegacyTokenCpaPostback(request, token);
}
