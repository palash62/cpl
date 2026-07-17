import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/lib/auth.config";
import { isPlatformHost } from "@/lib/platform-host";

const { auth } = NextAuth(authConfig);

export default auth((request) => {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", request.nextUrl.pathname);

  const hostHeader =
    request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? "";
  const pathname = request.nextUrl.pathname;

  if (
    hostHeader &&
    !isPlatformHost(hostHeader) &&
    !pathname.startsWith("/api") &&
    !pathname.startsWith("/_next") &&
    !pathname.startsWith("/domains/") &&
    (pathname === "/" || pathname === "/thank-you")
  ) {
    const encodedHost = encodeURIComponent(hostHeader.toLowerCase());
    const rewritePath =
      pathname === "/thank-you"
        ? `/domains/${encodedHost}/thank-you`
        : `/domains/${encodedHost}`;

    const url = request.nextUrl.clone();
    url.pathname = rewritePath;

    return NextResponse.rewrite(url, {
      request: { headers: requestHeaders },
    });
  }

  return NextResponse.next({
    request: { headers: requestHeaders },
  });
});

export const config = {
  matcher: [
    "/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\..*).*)",
  ],
};
