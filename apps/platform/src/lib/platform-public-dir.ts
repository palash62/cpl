import { existsSync } from "fs";
import path from "path";

/**
 * Resolve the platform `public/` directory in dev and Docker standalone.
 * Standalone runs from monorepo root (`/app`) with assets under `apps/platform/public`.
 */
export function resolvePlatformPublicDir() {
  const standalonePublic = path.join(process.cwd(), "apps", "platform", "public");
  const appPublic = path.join(process.cwd(), "public");

  if (existsSync(standalonePublic)) return standalonePublic;
  if (existsSync(appPublic)) return appPublic;

  return appPublic;
}

export function resolvePlatformUploadsDir(...segments: string[]) {
  return path.join(resolvePlatformPublicDir(), "uploads", ...segments);
}
