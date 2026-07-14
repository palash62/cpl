import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { Errors } from "@/lib/errors";
import { resolvePlatformUploadsDir } from "@/lib/platform-public-dir";

const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const EXT_TO_MIME: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
};

const MAX_BYTES = 5 * 1024 * 1024;

function resolveMimeType(file: File): string | null {
  if (file.type && ALLOWED_MIME.has(file.type)) return file.type;
  const ext = path.extname(file.name).toLowerCase();
  const fromExt = EXT_TO_MIME[ext];
  return fromExt && ALLOWED_MIME.has(fromExt) ? fromExt : null;
}

/**
 * Device upload for page-builder (landing pages + optin funnels).
 * Stores under public/uploads/builder so both apps can use the same picker.
 */
export async function uploadBuilderAsset(ownerId: string, file: File) {
  const mimeType = resolveMimeType(file);
  if (!mimeType) {
    throw Errors.validation("Only JPEG, PNG, WebP, and GIF images are allowed.");
  }
  if (file.size > MAX_BYTES) {
    throw Errors.validation("File must be under 5MB.");
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 100) || "image";
  const stamp = Date.now();
  const uploadDir = resolvePlatformUploadsDir("builder", ownerId);
  await mkdir(uploadDir, { recursive: true });
  const fileName = `${stamp}-${safeName}`;
  await writeFile(path.join(uploadDir, fileName), buffer);

  return {
    url: `/uploads/builder/${ownerId}/${fileName}`,
    fileName: safeName,
    mimeType,
    sizeBytes: file.size,
  };
}
