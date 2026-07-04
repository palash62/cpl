import { randomBytes } from "node:crypto";

export function createPixelToken() {
  return randomBytes(16).toString("hex");
}

export const TRANSPARENT_GIF = Buffer.from(
  "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
  "base64",
);
