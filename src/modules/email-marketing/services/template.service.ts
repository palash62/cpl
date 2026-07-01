import { prisma } from "@/lib/prisma";
import { AppError } from "@/lib/errors";

const STARTER_TEMPLATES = [
  {
    name: "Welcome Email",
    subject: "Welcome, {{first_name}}!",
    htmlBody: `<!DOCTYPE html>
<html><body style="font-family:Inter,sans-serif;color:#1e293b;max-width:600px;margin:0 auto;padding:24px;">
<h1 style="color:#6366f1;">Welcome, {{first_name}}!</h1>
<p>Thanks for your interest. We're excited to connect with you.</p>
<p>If you have any questions, simply reply to this email.</p>
<p>Best regards,<br/>{{company_name}}</p>
</body></html>`,
    textBody: "Welcome, {{first_name}}! Thanks for your interest. Best regards, {{company_name}}",
  },
  {
    name: "Follow-up Day 3",
    subject: "Still thinking it over, {{first_name}}?",
    htmlBody: `<!DOCTYPE html>
<html><body style="font-family:Inter,sans-serif;color:#1e293b;max-width:600px;margin:0 auto;padding:24px;">
<h2>Hi {{first_name}},</h2>
<p>Just checking in — we wanted to make sure you have everything you need.</p>
<p>Reply anytime if you have questions.</p>
<p>{{company_name}}</p>
</body></html>`,
    textBody: "Hi {{first_name}}, just checking in. {{company_name}}",
  },
];

export async function listTemplates(advertiserId: string) {
  return prisma.emailTemplate.findMany({
    where: { advertiserId },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      name: true,
      subject: true,
      previewText: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

export async function getTemplate(advertiserId: string, id: string) {
  const template = await prisma.emailTemplate.findFirst({
    where: { id, advertiserId },
  });
  if (!template) throw new AppError("NOT_FOUND", "Template not found", 404);
  return template;
}

export async function createTemplate(
  advertiserId: string,
  data: {
    name: string;
    subject: string;
    htmlBody: string;
    textBody?: string;
    previewText?: string;
  },
) {
  return prisma.emailTemplate.create({
    data: { advertiserId, ...data },
  });
}

export async function updateTemplate(
  advertiserId: string,
  id: string,
  data: Partial<{
    name: string;
    subject: string;
    htmlBody: string;
    textBody: string | null;
    previewText: string | null;
  }>,
) {
  await getTemplate(advertiserId, id);
  return prisma.emailTemplate.update({
    where: { id },
    data,
  });
}

export async function deleteTemplate(advertiserId: string, id: string) {
  const inUse = await prisma.emailAutomationStep.count({
    where: { templateId: id, automation: { advertiserId } },
  });
  if (inUse > 0) {
    throw new AppError(
      "TEMPLATE_IN_USE",
      "This template is used in an automation. Remove it from automations first.",
      409,
    );
  }
  await getTemplate(advertiserId, id);
  await prisma.emailTemplate.delete({ where: { id } });
}

export async function seedStarterTemplates(advertiserId: string) {
  const count = await prisma.emailTemplate.count({ where: { advertiserId } });
  if (count > 0) return [];

  return Promise.all(
    STARTER_TEMPLATES.map((t) =>
      prisma.emailTemplate.create({
        data: { advertiserId, ...t },
      }),
    ),
  );
}

export function sampleMergeData(overrides?: Record<string, string>) {
  return {
    first_name: "Jane",
    last_name: "Doe",
    email: "jane@example.com",
    phone: "+1 555-0100",
    campaign_name: "Sample Campaign",
    company_name: "Your Company",
    unsubscribe_url: "https://example.com/unsubscribe/sample",
    ...overrides,
  };
}
