import {
  mergeEmailConfig,
  normalizeSmtpInput,
  parseSmtpConfigStored,
  smtpConfigToApi,
  SMTP_SETTINGS_KEY,
  type SmtpConfigStored,
} from "@/lib/email/smtp-settings";
import { resetEmailTransport } from "@/lib/email/transport";
import { prisma } from "@/lib/prisma";

async function loadStoredSmtpConfig(): Promise<SmtpConfigStored | null> {
  const row = await prisma.platformSetting.findUnique({
    where: { key: SMTP_SETTINGS_KEY },
  });
  return row ? parseSmtpConfigStored(row.value) : null;
}

export async function getResolvedEmailConfig() {
  const stored = await loadStoredSmtpConfig();
  return mergeEmailConfig(stored);
}

export async function getSmtpSettingsForAdmin() {
  const stored = await loadStoredSmtpConfig();
  const config = mergeEmailConfig(stored);
  return smtpConfigToApi(config, Boolean(stored?.pass));
}

export async function updateSmtpSettings(
  input: {
    host?: string;
    port?: number;
    secure?: boolean;
    user?: string;
    pass?: string;
    from?: string;
    adminAlertEmail?: string;
    appUrl?: string;
  },
  adminId: string,
) {
  const existing = await loadStoredSmtpConfig();
  const normalized = normalizeSmtpInput(input);

  const next: SmtpConfigStored = {
    host: normalized.host,
    port: normalized.port ?? 587,
    secure: normalized.secure ?? false,
    user: normalized.user,
    pass: normalized.pass ?? existing?.pass,
    from: normalized.from,
    adminAlertEmail: normalized.adminAlertEmail,
    appUrl: normalized.appUrl,
  };

  if (!next.host) {
    await prisma.platformSetting.deleteMany({ where: { key: SMTP_SETTINGS_KEY } });
  } else {
    await prisma.platformSetting.upsert({
      where: { key: SMTP_SETTINGS_KEY },
      create: { key: SMTP_SETTINGS_KEY, value: next as never },
      update: { value: next as never },
    });
  }

  await prisma.auditLog.create({
    data: {
      actorId: adminId,
      action: "smtp.settings.updated",
      entityType: "platform_settings",
      entityId: SMTP_SETTINGS_KEY,
      metadata: {
        host: next.host,
        port: next.port,
        secure: next.secure,
        user: next.user,
        from: next.from,
        adminAlertEmail: next.adminAlertEmail,
        appUrl: next.appUrl,
        passUpdated: Boolean(normalized.pass),
      },
    },
  });

  resetEmailTransport();
  return getSmtpSettingsForAdmin();
}
