import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { prisma } from "@/lib/prisma";
import { Errors } from "@/lib/errors";
import { resolvePlatformUploadsDir } from "@/lib/platform-public-dir";
import { getLandingPage } from "@/modules/page-builder/services/landing-page.service";

const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/svg+xml",
]);

const MAX_BYTES = 5 * 1024 * 1024;

export async function uploadLandingPageAsset(
  landingPageId: string,
  advertiserId: string,
  file: File,
) {
  await getLandingPage(landingPageId, advertiserId);

  if (!ALLOWED_MIME.has(file.type)) {
    throw Errors.validation("Only JPEG, PNG, WebP, GIF, and SVG images are allowed.");
  }
  if (file.size > MAX_BYTES) {
    throw Errors.validation("File must be under 5MB.");
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 100);
  const storageKey = `landing-pages/${landingPageId}/${Date.now()}-${safeName}`;
  const uploadDir = resolvePlatformUploadsDir("landing-pages", landingPageId);
  await mkdir(uploadDir, { recursive: true });
  const filePath = path.join(uploadDir, `${Date.now()}-${safeName}`);
  await writeFile(filePath, buffer);

  const url = `/uploads/landing-pages/${landingPageId}/${path.basename(filePath)}`;

  return prisma.landingPageAsset.create({
    data: {
      landingPageId,
      advertiserId,
      fileName: safeName,
      mimeType: file.type,
      sizeBytes: file.size,
      storageKey,
      url,
    },
  });
}

export async function listLandingPageAssets(landingPageId: string, advertiserId: string) {
  await getLandingPage(landingPageId, advertiserId);
  return prisma.landingPageAsset.findMany({
    where: { landingPageId },
    orderBy: { createdAt: "desc" },
  });
}
