import { z } from "zod";

export const registerSchema = z
  .object({
    email: z.string().email(),
    password: z.string().min(8),
    name: z.string().min(2),
    role: z.enum(["ADVERTISER", "PUBLISHER"]),
    company: z.string().optional(),
    referralRef: z.string().optional(),
  })
  .refine((data) => !data.referralRef?.trim() || data.role === "ADVERTISER", {
    message: "Referral sign-up is for advertisers only.",
    path: ["role"],
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
  status: z.enum(["DRAFT", "PENDING", "ACTIVE", "PAUSED"]).optional(),
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
  source: z
    .string()
    .regex(/^[a-zA-Z0-9_-]{1,32}$/)
    .optional(),
  subId: z
    .string()
    .regex(/^[a-zA-Z0-9_-]{1,32}$/)
    .optional(),
});

export const payoutRequestSchema = z.object({
  amount: z.number().positive(),
  method: z.enum(["PAYPAL", "BANK_TRANSFER", "STRIPE_CONNECT"]),
  idempotencyKey: z.string().optional(),
});

export const ticketSchema = z.object({
  subject: z.string().trim().min(3, "Subject must be at least 3 characters"),
  category: z.preprocess(
    (value) => (typeof value === "string" ? value.trim().toUpperCase() : value),
    z.enum(["GENERAL", "BILLING", "TECHNICAL", "CAMPAIGN", "PAYOUT", "OTHER"]),
  ),
  body: z.string().trim().min(10, "Message must be at least 10 characters"),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(8, "New password must be at least 8 characters"),
    confirmPassword: z.string().min(8, "Please confirm your new password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const updateAdvertiserProfileSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters"),
  company: z.string().trim().min(2, "Company name must be at least 2 characters").optional(),
});

export const updatePublisherProfileSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters"),
  website: z
    .string()
    .trim()
    .optional()
    .refine((val) => !val || val === "" || z.string().url().safeParse(val).success, {
      message: "Enter a valid website URL",
    }),
  trafficSource: z.string().trim().max(120)    .optional(),
});

export const adminCreateCampaignSchema = campaignSchema.extend({
  advertiserId: z.string().min(1, "Select an advertiser"),
  destinationUrl: z.string().trim().url("Enter a valid destination URL"),
  vertical: z.string().trim().min(1, "Select a vertical"),
});

export const adminCreatePublisherSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters"),
  email: z.string().trim().email("Enter a valid email address"),
  website: z
    .string()
    .trim()
    .optional()
    .refine((val) => !val || val === "" || z.string().url().safeParse(val).success, {
      message: "Enter a valid website URL",
    }),
  trafficSource: z.string().trim().max(120).optional(),
  country: z.string().trim().max(120).optional(),
  addressLine1: z.string().trim().max(160).optional(),
  addressLine2: z.string().trim().max(160).optional(),
  city: z.string().trim().max(120).optional(),
  state: z.string().trim().max(120).optional(),
  postalCode: z.string().trim().max(40).optional(),
  status: z.enum(["ACTIVE", "PENDING"]).optional(),
});

export function isValidEmail(email: string): boolean {
  return z.string().email().safeParse(email).success;
}

export function isValidPhone(phone: string): boolean {
  return /^\+?[\d\s\-()]{10,}$/.test(phone);
}
