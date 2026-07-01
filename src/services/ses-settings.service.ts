import {
  mergeSesConfig,
  normalizeSesInput,
  parseSesConfigStored,
  sesConfigToApi,
  SES_SETTINGS_KEY,
  type SesConfigStored,
} from "@/lib/email/ses-settings";
import { prisma } from "@/lib/prisma";

async function loadStoredSesConfig(): Promise<SesConfigStored | null> {
  const row = await prisma.platformSetting.findUnique({
    where: { key: SES_SETTINGS_KEY },
  });
  return row ? parseSesConfigStored(row.value) : null;
}

export async function getResolvedSesConfig() {
  const stored = await loadStoredSesConfig();
  return mergeSesConfig(stored);
}

export async function getSesSettingsForAdmin() {
  const stored = await loadStoredSesConfig();
  const config = mergeSesConfig(stored);
  return sesConfigToApi(config, Boolean(stored?.secretAccessKey));
}

export async function updateSesSettings(
  input: {
    region?: string;
    accessKeyId?: string;
    secretAccessKey?: string;
    fromDomain?: string;
    fromEmail?: string;
    configurationSet?: string;
    appUrl?: string;
  },
  adminId: string,
) {
  const existing = await loadStoredSesConfig();
  const normalized = normalizeSesInput(input);

  const next: SesConfigStored = {
    region: normalized.region ?? "us-east-1",
    accessKeyId: normalized.accessKeyId,
    secretAccessKey: normalized.secretAccessKey ?? existing?.secretAccessKey,
    fromDomain: normalized.fromDomain,
    fromEmail: normalized.fromEmail,
    configurationSet: normalized.configurationSet,
    appUrl: normalized.appUrl,
  };

  if (!next.fromDomain || !next.accessKeyId) {
    await prisma.platformSetting.deleteMany({ where: { key: SES_SETTINGS_KEY } });
  } else {
    await prisma.platformSetting.upsert({
      where: { key: SES_SETTINGS_KEY },
      create: { key: SES_SETTINGS_KEY, value: next as never },
      update: { value: next as never },
    });
  }

  await prisma.auditLog.create({
    data: {
      actorId: adminId,
      action: "ses.settings.updated",
      entityType: "platform_settings",
      entityId: SES_SETTINGS_KEY,
      metadata: {
        region: next.region,
        fromDomain: next.fromDomain,
        fromEmail: next.fromEmail,
        configurationSet: next.configurationSet,
        secretUpdated: Boolean(normalized.secretAccessKey),
      },
    },
  });

  return getSesSettingsForAdmin();
}
