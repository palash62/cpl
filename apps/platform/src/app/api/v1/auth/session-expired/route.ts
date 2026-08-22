import { signOut } from "@/lib/auth";

/** Clears a stale session cookie; safe from Route Handlers (not Server Components). */
export async function GET() {
  await signOut({ redirectTo: "/login" });
}
