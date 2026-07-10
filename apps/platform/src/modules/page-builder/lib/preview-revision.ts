import type { ThemeJson } from "@/modules/page-builder/lib/theme";

export function djb2Hash(input: string): string {
  let hash = 5381;
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 33) ^ input.charCodeAt(i);
  }
  return (hash >>> 0).toString(36);
}

export function previewContentRevision(
  craftState: unknown,
  theme: ThemeJson | null | undefined,
): string {
  const payload = JSON.stringify({ craft: craftState ?? null, theme: theme ?? null });
  return djb2Hash(payload);
}
