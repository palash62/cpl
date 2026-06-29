import { prisma } from "@/lib/prisma";
import { parsePlatformSettings, settingsConfigToApi } from "@/lib/platform-settings";

export async function getPayoutTiersDisplay() {
  const settings = await prisma.platformSetting.findMany();
  const map: Record<string, unknown> = {};
  for (const s of settings) map[s.key] = s.value;
  return settingsConfigToApi(parsePlatformSettings(map));
}
