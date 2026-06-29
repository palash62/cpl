import type { NextAuthConfig } from "next-auth";
import type { UserRole } from "@prisma/client";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: UserRole;
    };
  }
  interface User {
    role: UserRole;
  }
}

export const ROLE_ROUTES: Record<UserRole, string> = {
  ADMIN: "/admin",
  ADVERTISER: "/advertiser",
  PUBLISHER: "/publisher",
};

export function getDashboardPath(role: UserRole): string {
  return ROLE_ROUTES[role];
}

const publicPaths = [
  "/login",
  "/register",
  "/forgot-password",
  "/t/",
  "/o/",
  "/api/v1/leads/submit",
  "/api/v1/leads/submit-optin",
  "/api/auth",
];

export const authConfig = {
  trustHost: true,
  pages: { signIn: "/login" },
  session: { strategy: "jwt" },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id!;
        token.role = user.role;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as UserRole;
      }
      return session;
    },
    authorized({ auth, request }) {
      const { pathname } = request.nextUrl;

      if (
        publicPaths.some((p) => pathname.startsWith(p)) ||
        pathname === "/" ||
        pathname.startsWith("/_next") ||
        pathname.includes(".")
      ) {
        return true;
      }

      if (!auth?.user) {
        return false;
      }

      const role = auth.user.role;

      if (pathname.startsWith("/admin") && role !== "ADMIN") {
        return Response.redirect(new URL(ROLE_ROUTES[role], request.nextUrl));
      }
      if (pathname.startsWith("/advertiser") && role !== "ADVERTISER") {
        return Response.redirect(new URL(ROLE_ROUTES[role], request.nextUrl));
      }
      if (pathname.startsWith("/publisher") && role !== "PUBLISHER") {
        return Response.redirect(new URL(ROLE_ROUTES[role], request.nextUrl));
      }

      if (pathname === "/dashboard") {
        return Response.redirect(new URL(ROLE_ROUTES[role], request.nextUrl));
      }

      return true;
    },
  },
  providers: [],
} satisfies NextAuthConfig;
