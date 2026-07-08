import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { Errors } from "@/lib/errors";

const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/svg+xml",
]);

const MAX_BYTES = 5 * 1024 * 1024;

/**
 * Device upload for page-builder (landing pages + optin funnels).
 * Stores under public/uploads/builder so both apps can use the same picker.
 */
export async function uploadBuilderAsset(ownerId: string, file: File) {
  if (!ALLOWED_MIME.has(file.type)) {
    throw Errors.validation("Only JPEG, PNG, WebP, GIF, and SVG images are allowed.");
  }
  if (file.size > MAX_BYTES) {
    throw Errors.validation("File must be under 5MB.");
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 100) || "image";
  const stamp = Date.now();
  const uploadDir = path.join(process.cwd(), "public", "uploads", "builder", ownerId);
  await mkdir(uploadDir, { recursive: true });
  const fileName = `${stamp}-${safeName}`;
  await writeFile(path.join(uploadDir, fileName), buffer);

  return {
    url: `/uploads/builder/${ownerId}/${fileName}`,
    fileName: safeName,
    mimeType: file.type,
    sizeBytes: file.size,
  };
}
