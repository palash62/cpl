import { createHmac, randomBytes, timingSafeEqual } from "crypto";

function getSecret() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("AUTH_SECRET is not configured");
  }
  return secret;
}

export function generateUnsubscribeToken(): string {
  return randomBytes(24).toString("hex");
}

export function signTrackingToken(sendId: string): string {
  return createHmac("sha256", getSecret()).update(sendId).digest("hex").slice(0, 32);
}

export function verifyTrackingToken(sendId: string, token: string): boolean {
  if (!token) return false;
  const expected = signTrackingToken(sendId);
  if (token.length !== expected.length) return false;
  try {
    return timingSafeEqual(Buffer.from(token), Buffer.from(expected));
  } catch {
    return false;
  }
}
