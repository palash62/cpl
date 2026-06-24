import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { ROLE_ROUTES } from "@/lib/auth";

const publicPaths = ["/login", "/register", "/forgot-password", "/t/", "/api/v1/leads/submit", "/api/auth"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    publicPaths.some((p) => pathname.startsWith(p)) ||
    pathname === "/" ||
    pathname.startsWith("/_next") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  const session = await auth();

  if (!session?.user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const role = session.user.role;

  if (pathname.startsWith("/admin") && role !== "ADMIN") {
    return NextResponse.redirect(new URL(ROLE_ROUTES[role], request.url));
  }
  if (pathname.startsWith("/advertiser") && role !== "ADVERTISER") {
    return NextResponse.redirect(new URL(ROLE_ROUTES[role], request.url));
  }
  if (pathname.startsWith("/publisher") && role !== "PUBLISHER") {
    return NextResponse.redirect(new URL(ROLE_ROUTES[role], request.url));
  }

  if (pathname === "/dashboard") {
    return NextResponse.redirect(new URL(ROLE_ROUTES[role], request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
