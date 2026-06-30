import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";
import type { EmailConfig } from "@/lib/email/smtp-settings";

let transporter: Transporter | null = null;
let transporterKey: string | null = null;

function transportCacheKey(config: EmailConfig) {
  return [config.host, config.port, config.secure, config.user, config.pass].join("|");
}

export function resetEmailTransport() {
  transporter = null;
  transporterKey = null;
}

export function getTransporterForConfig(config: EmailConfig) {
  if (!config.enabled || !config.host) return null;

  const key = transportCacheKey(config);
  if (transporter && transporterKey === key) {
    return transporter;
  }

  transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: config.user ? { user: config.user, pass: config.pass } : undefined,
  });
  transporterKey = key;
  return transporter;
}
