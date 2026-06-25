import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(2),
  role: z.enum(["ADVERTISER", "PUBLISHER"]),
  company: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const campaignSchema = z.object({
  name: z.string().min(3),
  description: z.string().optional(),
  category: z.enum(["FINANCE", "INSURANCE", "EDUCATION", "REAL_ESTATE", "GENERIC"]),
  cpl: z.number().positive(),
  budget: z.number().positive().optional(),
  dailyCap: z.number().int().positive().optional(),
  monthlyCap: z.number().int().positive().optional(),
  publisherAccess: z.enum(["OPEN", "APPROVAL_REQUIRED", "INVITE_ONLY"]).optional(),
  autoApprove: z.boolean().optional(),
  status: z.enum(["DRAFT", "ACTIVE", "PAUSED"]).optional(),
  targeting: z.record(z.string(), z.unknown()).optional(),
  fields: z
    .array(
      z.object({
        fieldName: z.string(),
        label: z.string(),
        fieldType: z.string(),
        required: z.boolean().optional(),
        validationRules: z.record(z.string(), z.unknown()).optional(),
        sortOrder: z.number().optional(),
      }),
    )
    .optional(),
});

export const leadSubmitSchema = z.object({
  slug: z.string(),
  data: z.record(z.string(), z.string()),
  honeypot: z.string().optional(),
});

export const payoutRequestSchema = z.object({
  amount: z.number().positive(),
  method: z.enum(["PAYPAL", "BANK_TRANSFER", "STRIPE_CONNECT"]),
  idempotencyKey: z.string().optional(),
});

export const ticketSchema = z.object({
  subject: z.string().min(3),
  category: z.enum(["BILLING", "TECHNICAL", "CAMPAIGN", "PAYOUT", "OTHER"]),
  body: z.string().min(10),
});

export function isValidEmail(email: string): boolean {
  return z.string().email().safeParse(email).success;
}

export function isValidPhone(phone: string): boolean {
  return /^\+?[\d\s\-()]{10,}$/.test(phone);
}
