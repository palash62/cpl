import { createHmac, randomBytes } from "crypto";

function getSecret() {
  return process.env.AUTH_SECRET || "dev-secret";
}

export function generateUnsubscribeToken(): string {
  return randomBytes(24).toString("hex");
}

export function signTrackingToken(sendId: string): string {
  return createHmac("sha256", getSecret()).update(sendId).digest("hex").slice(0, 32);
}

export function verifyTrackingToken(sendId: string, token: string): boolean {
  const expected = signTrackingToken(sendId);
  return token.length === expected.length && token === expected;
}
