import { handleGlobalCpaPostback } from "@/lib/cpa-pbtr";

export async function GET(request: Request) {
  return handleGlobalCpaPostback(request);
}

export async function POST(request: Request) {
  return handleGlobalCpaPostback(request);
}
