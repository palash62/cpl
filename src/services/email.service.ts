import type { Prisma } from "@prisma/client";
import type { SendEmailInput } from "@/lib/email/types";
import { getTransporterForConfig, resetEmailTransport } from "@/lib/email/transport";
import { prisma } from "@/lib/prisma";
import { getResolvedEmailConfig } from "@/services/smtp-settings.service";

export { resetEmailTransport };

async function logEmail(
  input: SendEmailInput,
  status: "sent" | "failed" | "skipped",
  error?: string,
) {
  try {
    await prisma.emailLog.create({
      data: {
        to: input.to,
        template: input.template ?? "generic",
        subject: input.subject,
        status,
        error: error ?? null,
        metadata: (input.metadata ?? undefined) as Prisma.InputJsonValue | undefined,
      },
    });
  } catch {
    // Logging must not break the app
  }
}

export async function sendEmail(input: SendEmailInput): Promise<{ sent: boolean; skipped?: boolean }> {
  const config = await getResolvedEmailConfig();
  const transport = getTransporterForConfig(config);

  if (!transport) {
    console.info("[email:skipped]", {
      to: input.to,
      subject: input.subject,
      template: input.template,
      preview: input.text.slice(0, 200),
    });
    await logEmail(input, "skipped");
    return { sent: false, skipped: true };
  }

  try {
    await transport.sendMail({
      from: config.from,
      to: input.to,
      subject: input.subject,
      html: input.html,
      text: input.text,
    });
    await logEmail(input, "sent");
    return { sent: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown email error";
    console.error("[email:failed]", input.to, input.subject, message);
    await logEmail(input, "failed", message);
    return { sent: false };
  }
}

export async function getAdminAlertEmail() {
  const config = await getResolvedEmailConfig();
  if (config.adminAlertEmail) return config.adminAlertEmail;

  const admin = await prisma.user.findFirst({
    where: { role: "ADMIN", status: "ACTIVE" },
    select: { email: true },
    orderBy: { createdAt: "asc" },
  });

  return admin?.email ?? null;
}

export async function testSmtpConnection(testTo?: string) {
  resetEmailTransport();
  const config = await getResolvedEmailConfig();
  const transport = getTransporterForConfig(config);
  if (!transport) {
    return {
      ok: false,
      message: "SMTP is not configured. Save SMTP settings below or set SMTP_HOST in .env.",
    };
  }

  const to = testTo || config.adminAlertEmail;
  if (!to) {
    return { ok: false, message: "No recipient. Set admin alert email or pass a test address." };
  }

  const result = await sendEmail({
    to,
    subject: "CPL Platform SMTP test",
    html: `<p>SMTP test successful at ${new Date().toISOString()}</p>`,
    text: `SMTP test successful at ${new Date().toISOString()}`,
    template: "generic",
    metadata: { kind: "smtp_test" },
  });

  return result.sent
    ? { ok: true, message: `Test email sent to ${to}` }
    : { ok: false, message: "Failed to send test email. Check server logs." };
}

export async function listEmailLogs(page = 1, limit = 20) {
  const skip = (page - 1) * limit;
  const [data, total] = await Promise.all([
    prisma.emailLog.findMany({
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.emailLog.count(),
  ]);

  return {
    data,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}
