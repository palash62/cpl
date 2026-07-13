import { z } from "zod";

export const registerSchema = z
  .object({
    email: z.string().email(),
    password: z.string().min(8),
    name: z.string().min(2),
    phone: z.string().min(5, "Enter a valid phone number"),
    address: z.string().min(3, "Enter your address"),
    country: z.string().min(2, "Select your country"),
    role: z.literal("ADVERTISER").default("ADVERTISER"),
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

export const submissionMetaSchema = z
  .object({
    formDurationMs: z.number().optional(),
    mouseMoveCount: z.number().optional(),
    keyPressCount: z.number().optional(),
    pasteCount: z.number().optional(),
    timezone: z.string().optional(),
    language: z.string().optional(),
    screenWxH: z.string().optional(),
    platform: z.string().optional(),
  })
  .optional();

export const leadSubmitSchema = z.object({
  slug: z.string(),
  data: z.record(z.string(), z.string()),
  honeypot: z.string().optional(),
  deviceFingerprint: z.string().max(128).optional(),
  submissionMeta: submissionMetaSchema,
  source: z
    .string()
    .regex(/^[a-zA-Z0-9_-]{1,32}$/)
    .optional(),
  subId: z
    .string()
    .regex(/^[a-zA-Z0-9_-]{1,32}$/)
    .optional(),
});

export const optinSubmitSchema = z.object({
  optinSlug: z.string().min(1),
  data: z.record(z.string(), z.string()),
  honeypot: z.string().optional(),
  deviceFingerprint: z.string().max(128).optional(),
  submissionMeta: submissionMetaSchema,
  /** Publisher tracking link from smart-link redirect (?tracking_slug=). */
  trackingSlug: z.string().min(1).max(120).optional(),
  source: z
    .string()
    .regex(/^[a-zA-Z0-9_-]{1,32}$/)
    .optional(),
  subId: z
    .string()
    .regex(/^[a-zA-Z0-9_-]{1,32}$/)
    .optional(),
});

export const optinPageUpdateSchema = z.object({
  title: z.string().trim().min(2).max(80),
  slug: z.string().trim().min(2).max(40),
  destinationUrl: z
    .string()
    .trim()
    .max(500)
    .nullable()
    .optional()
    .refine((value) => !value || z.string().url().safeParse(value).success, {
      message: "Enter a valid destination URL",
    }),
  templateId: z
    .enum(["aurora", "sunrise", "ocean", "minimal", "bold", "neon"])
    .optional(),
  headline: z.string().trim().min(3).max(120),
  subheadline: z.string().trim().min(3).max(200),
  description: z.string().trim().max(1000).nullable().optional(),
  ctaText: z.string().trim().min(2).max(60),
  successTitle: z.string().trim().min(2).max(80),
  successMessage: z.string().trim().min(2).max(200),
  badgeText: z.string().trim().max(80).nullable().optional(),
  bulletPoints: z.array(z.string().trim().min(1).max(120)).max(6),
  primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  accentColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  isPublished: z.boolean(),
  thankYouEnabled: z.boolean().optional(),
  thankYouPixelHtml: z.string().trim().max(10000).nullable().optional(),
  thankYouUseCampaignPixel: z.boolean().optional(),
  funnelId: z.string().optional(),
});

export const optinPageColorsSchema = z.object({
  primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  accentColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
});

export const emailPayoutDetailsSchema = z.object({
  email: z.string().trim().email("Enter a valid email address"),
});

export const bankPayoutDetailsSchema = z
  .object({
    country: z.string().trim().min(2, "Country is required"),
    beneficiaryName: z.string().trim().min(2, "Beneficiary name is required"),
    accountNumber: z.string().trim().min(4, "Account number is required"),
    accountType: z.enum(["checking", "savings"]).optional(),
    routingNumber: z.string().trim().optional(),
    sortCode: z.string().trim().optional(),
    iban: z.string().trim().optional(),
    swiftBic: z.string().trim().optional(),
    bankName: z.string().trim().optional(),
    bankAddress: z.string().trim().optional(),
    addressLine1: z.string().trim().optional(),
    city: z.string().trim().optional(),
    state: z.string().trim().optional(),
    postalCode: z.string().trim().optional(),
  })
  .superRefine((data, ctx) => {
    const country = data.country.toUpperCase();
    if (country === "US") {
      if (!data.routingNumber?.trim()) {
        ctx.addIssue({ code: "custom", message: "Routing number is required for US", path: ["routingNumber"] });
      }
      if (!data.accountType) {
        ctx.addIssue({ code: "custom", message: "Account type is required for US", path: ["accountType"] });
      }
      if (!data.addressLine1?.trim()) {
        ctx.addIssue({ code: "custom", message: "Address is required for US", path: ["addressLine1"] });
      }
    }
    if (country === "GB" && !data.sortCode?.trim()) {
      ctx.addIssue({ code: "custom", message: "Sort code is required for UK", path: ["sortCode"] });
    }
    if (country === "IN" && !data.routingNumber?.trim()) {
      ctx.addIssue({ code: "custom", message: "IFSC is required for India", path: ["routingNumber"] });
    }
    const euCodes = ["DE", "FR", "ES", "IT", "NL", "BE", "AT", "IE", "PT", "FI", "GR", "LU"];
    if (euCodes.includes(country) && !data.iban?.trim()) {
      ctx.addIssue({ code: "custom", message: "IBAN is required for this country", path: ["iban"] });
    }
  });

export const payoutRequestSchema = z.discriminatedUnion("method", [
  z.object({
    amount: z.number().positive(),
    method: z.literal("WISE"),
    paymentDetails: emailPayoutDetailsSchema,
    idempotencyKey: z.string().optional(),
  }),
  z.object({
    amount: z.number().positive(),
    method: z.literal("STRIPE_CONNECT"),
    paymentDetails: emailPayoutDetailsSchema,
    idempotencyKey: z.string().optional(),
  }),
  z.object({
    amount: z.number().positive(),
    method: z.literal("BANK_TRANSFER"),
    paymentDetails: bankPayoutDetailsSchema,
    idempotencyKey: z.string().optional(),
  }),
]);

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

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email("Enter a valid email address"),
});

export const resetPasswordSchema = z
  .object({
    token: z.string().min(1, "Reset token is required"),
    newPassword: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(8, "Please confirm your password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const verifyEmailSchema = z.object({
  token: z.string().min(1, "Verification token is required"),
});

export const smtpSettingsSchema = z
  .object({
    host: z.string().trim(),
    port: z.coerce.number().int().min(1).max(65535),
    secure: z.boolean(),
    user: z.string().trim().optional(),
    pass: z.string().optional(),
    from: z.string().trim(),
    adminAlertEmail: z
      .string()
      .trim()
      .refine((v) => !v || z.string().email().safeParse(v).success, {
        message: "Enter a valid admin alert email",
      })
      .optional(),
    supportEmail: z
      .string()
      .trim()
      .refine((v) => !v || z.string().email().safeParse(v).success, {
        message: "Enter a valid support email",
      })
      .optional(),
    appUrl: z
      .string()
      .trim()
      .refine((v) => !v || z.string().url().safeParse(v).success, {
        message: "Enter a valid app URL",
      })
      .optional(),
  })
  .superRefine((data, ctx) => {
    if (data.host && data.from.length < 3) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "From address is required when SMTP host is set",
        path: ["from"],
      });
    }
  });

export const stripeSettingsSchema = z
  .object({
    publishableKey: z.string().trim(),
    secretKey: z.string().optional(),
    webhookSecret: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.publishableKey && !data.publishableKey.startsWith("pk_")) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Publishable key must start with pk_",
        path: ["publishableKey"],
      });
    }
    if (data.secretKey && !data.secretKey.startsWith("sk_")) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Secret key must start with sk_",
        path: ["secretKey"],
      });
    }
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

export const updatePublisherGlobalLinkSchema = z.object({
  globalLinkUrl: z
    .union([z.string().trim().max(500), z.null()])
    .optional()
    .transform((val) => (val === "" || val === undefined ? null : val)),
});

export const adminCreateCampaignSchema = campaignSchema.extend({
  advertiserId: z.string().min(1, "Select an advertiser"),
  optinPageId: z.string().min(1, "Select an optin page"),
  vertical: z.string().trim().min(1, "Select a vertical"),
});

export const adminUpdateCampaignSchema = campaignSchema
  .partial()
  .extend({
    optinPageId: z.string().min(1).optional(),
    vertical: z.string().trim().min(1).optional(),
  });

export const adminBulkEmailSchema = z.object({
  userIds: z.array(z.string().min(1)).min(1, "Select at least one recipient"),
  subject: z.string().trim().min(3, "Subject must be at least 3 characters").max(200),
  message: z.string().trim().min(10, "Message must be at least 10 characters").max(10000),
});

export const adminPublisherSpecialPayoutSchema = z
  .object({
    useSpecialTierPayouts: z.boolean(),
    tier1SpecialPayout: z.number().min(0).max(1000).nullable().optional(),
    tier2SpecialPayout: z.number().min(0).max(1000).nullable().optional(),
    tier3SpecialPayout: z.number().min(0).max(1000).nullable().optional(),
  })
  .superRefine((data, ctx) => {
    if (!data.useSpecialTierPayouts) return;

    const tiers = [
      ["tier1SpecialPayout", data.tier1SpecialPayout],
      ["tier2SpecialPayout", data.tier2SpecialPayout],
      ["tier3SpecialPayout", data.tier3SpecialPayout],
    ] as const;

    for (const [field, value] of tiers) {
      if (value == null || !Number.isFinite(value)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Set a minimum payout for each tier",
          path: [field],
        });
      }
    }
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

export const adminCreateAdvertiserSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters"),
  email: z.string().trim().email("Enter a valid email address"),
  company: z.string().trim().min(2, "Company name must be at least 2 characters"),
  industry: z.string().trim().max(120).optional(),
  status: z.enum(["ACTIVE", "PENDING"]).optional(),
});

const webhookConfigSchema = z.object({
  url: z.string().url("Enter a valid webhook URL"),
  method: z.enum(["POST", "PUT"]).optional(),
  headers: z.record(z.string(), z.string()).optional(),
  secret: z.string().optional(),
});

const mailchimpConfigSchema = z.object({
  apiKey: z.string().min(1, "API key is required"),
  serverPrefix: z.string().min(1, "Server prefix is required (e.g. us21)"),
  listId: z.string().min(1, "List ID is required"),
  tags: z.array(z.string()).optional(),
});

const aweberConfigSchema = z.object({
  accessToken: z.string().min(1, "Access token is required"),
  accountId: z.string().min(1, "Account ID is required"),
  listId: z.string().min(1, "List ID is required"),
});

const getResponseConfigSchema = z
  .object({
    apiKey: z.string().min(1, "API key is required"),
    campaignId: z.string().optional(),
    listId: z.string().optional(),
  })
  .superRefine((value, ctx) => {
    const listToken = (value.campaignId ?? value.listId ?? "").trim();
    if (!listToken) {
      ctx.addIssue({
        code: "custom",
        path: ["campaignId"],
        message: "GetResponse list ID is required",
      });
    }
  })
  .transform((value) => ({
    apiKey: value.apiKey.trim(),
    campaignId: (value.campaignId ?? value.listId ?? "").trim(),
  }));

const systemeConfigSchema = z
  .object({
    apiKey: z.string().min(1, "API key is required"),
    tagId: z.string().trim().optional(),
  })
  .superRefine((value, ctx) => {
    const tagId = value.tagId?.trim() ?? "";
    if (tagId && !/^\d+$/.test(tagId)) {
      ctx.addIssue({
        code: "custom",
        path: ["tagId"],
        message: "Systeme.io tag ID must be numeric",
      });
    }
  })
  .transform((value) => ({
    apiKey: value.apiKey.trim(),
    ...(value.tagId?.trim() ? { tagId: value.tagId.trim() } : {}),
  }));

const autoresponderBaseSchema = z.object({
  name: z.string().trim().min(2).max(80),
  trigger: z.enum(["LEAD_CAPTURED", "LEAD_APPROVED"]),
  campaignId: z.string().cuid().optional().nullable(),
  isEnabled: z.boolean().optional(),
  fieldMapping: z.record(z.string(), z.string()).optional().nullable(),
});

export const autoresponderConnectionSchema = z.discriminatedUnion("provider", [
  autoresponderBaseSchema.extend({
    provider: z.literal("WEBHOOK"),
    config: webhookConfigSchema,
  }),
  autoresponderBaseSchema.extend({
    provider: z.literal("MAILCHIMP"),
    config: mailchimpConfigSchema,
  }),
  autoresponderBaseSchema.extend({
    provider: z.literal("AWEBER"),
    config: aweberConfigSchema,
  }),
  autoresponderBaseSchema.extend({
    provider: z.literal("GETRESPONSE"),
    config: getResponseConfigSchema,
  }),
  autoresponderBaseSchema.extend({
    provider: z.literal("SYSTEME"),
    config: systemeConfigSchema,
  }),
]);

export const autoresponderConnectionUpdateSchema = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  trigger: z.enum(["LEAD_CAPTURED", "LEAD_APPROVED"]).optional(),
  campaignId: z.string().cuid().optional().nullable(),
  isEnabled: z.boolean().optional(),
  fieldMapping: z.record(z.string(), z.string()).optional().nullable(),
  config: z
    .union([
      webhookConfigSchema,
      mailchimpConfigSchema,
      aweberConfigSchema,
      getResponseConfigSchema,
      systemeConfigSchema,
    ])
    .optional(),
});

export function isValidEmail(email: string): boolean {
  return z.string().email().safeParse(email).success;
}

export function isValidPhone(phone: string): boolean {
  return /^\+?[\d\s\-()]{10,}$/.test(phone);
}

export const sesSettingsSchema = z.object({
  region: z.string().trim().min(1).optional(),
  accessKeyId: z.string().trim().optional(),
  secretAccessKey: z.string().optional(),
  fromDomain: z.string().trim().optional(),
  fromEmail: z.string().trim().email().optional().or(z.literal("")),
  configurationSet: z.string().trim().optional(),
  appUrl: z.string().url().optional().or(z.literal("")),
});

export const emailTemplateSchema = z.object({
  name: z.string().trim().min(2).max(80),
  subject: z.string().trim().min(1).max(200),
  htmlBody: z.string().min(1),
  textBody: z.string().optional().nullable(),
  previewText: z.string().max(200).optional().nullable(),
});

export const emailTemplateUpdateSchema = emailTemplateSchema.partial();

export const emailAutomationStepSchema = z.object({
  templateId: z.string().cuid(),
  delayMinutes: z.number().int().min(0).max(525600),
  order: z.number().int().min(0),
});

export const emailAutomationSchema = z.object({
  name: z.string().trim().min(2).max(80),
  trigger: z.enum(["LEAD_CAPTURED", "LEAD_APPROVED"]),
  campaignId: z.string().cuid().optional().nullable(),
  fromName: z.string().trim().min(2).max(80),
  replyTo: z.string().email().optional().nullable().or(z.literal("")),
  steps: z.array(emailAutomationStepSchema).min(1).max(20),
});

export const emailAutomationUpdateSchema = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  trigger: z.enum(["LEAD_CAPTURED", "LEAD_APPROVED"]).optional(),
  campaignId: z.string().cuid().optional().nullable(),
  fromName: z.string().trim().min(2).max(80).optional(),
  replyTo: z.string().email().optional().nullable().or(z.literal("")),
  status: z.enum(["DRAFT", "ACTIVE", "PAUSED"]).optional(),
  steps: z.array(emailAutomationStepSchema).min(1).max(20).optional(),
});

export const advertiserEmailSettingsSchema = z.object({
  fromName: z.string().trim().min(2).max(80).optional(),
  replyTo: z.string().email().optional().or(z.literal("")),
});

export const sendingIdentitySchema = z.object({
  domain: z
    .string()
    .trim()
    .min(3)
    .max(253)
    .regex(/^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/i),
  fromName: z.string().trim().min(2).max(80),
});

export const landingPageCreateSchema = z.object({
  name: z.string().trim().min(2).max(80),
  templateId: z.string().optional(),
  campaignId: z.string().optional(),
});

export const optinFunnelCreateSchema = z.object({
  name: z.string().trim().min(2).max(80),
  editorType: z.enum(["TEMPLATE", "BUILDER"]),
  templateId: z.string().optional(),
  pageTemplateId: z.string().optional(),
});

export const optinFunnelUpdateSchema = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  title: z.string().trim().min(2).max(80).optional(),
  slug: z.string().trim().min(2).max(40).optional(),
  campaignId: z.string().nullable().optional(),
  destinationUrl: z
    .string()
    .trim()
    .max(500)
    .nullable()
    .optional()
    .refine((value) => !value || z.string().url().safeParse(value).success, {
      message: "Enter a valid destination URL",
    }),
  templateId: z.string().optional(),
  headline: z.string().trim().min(3).max(120).optional(),
  subheadline: z.string().trim().min(3).max(200).optional(),
  description: z.string().trim().max(1000).nullable().optional(),
  ctaText: z.string().trim().min(2).max(60).optional(),
  successTitle: z.string().trim().min(2).max(80).optional(),
  successMessage: z.string().trim().min(2).max(200).optional(),
  badgeText: z.string().trim().max(80).nullable().optional(),
  bulletPoints: z.array(z.string().trim().min(1).max(120)).max(6).optional(),
  primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  accentColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  isPublished: z.boolean().optional(),
  craftState: z.record(z.string(), z.unknown()).optional(),
  themeJson: z.record(z.string(), z.unknown()).optional(),
  thankYouEnabled: z.boolean().optional(),
  thankYouCraftState: z.record(z.string(), z.unknown()).nullable().optional(),
  thankYouThemeJson: z.record(z.string(), z.unknown()).optional(),
  thankYouPixelHtml: z.string().trim().max(10000).nullable().optional(),
  thankYouUseCampaignPixel: z.boolean().optional(),
  step: z.enum(["optin", "thankYou"]).optional(),
  autosave: z.boolean().optional(),
});

export const adminOptinFunnelTemplateCreateSchema = z.object({
  name: z.string().trim().min(2, "Template name must be at least 2 characters.").max(80),
  primaryColor: z.string().trim().optional(),
  secondaryColor: z.string().trim().optional(),
  sourceTemplateId: z.string().trim().min(1).optional(),
});

export const adminOptinFunnelTemplateUpdateSchema = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  craftState: z.record(z.string(), z.unknown()).optional(),
  themeJson: z.record(z.string(), z.unknown()).optional(),
  thankYouEnabled: z.boolean().optional(),
  destinationUrl: z
    .string()
    .trim()
    .max(500)
    .nullable()
    .optional()
    .refine((value) => !value || z.string().url().safeParse(value).success, {
      message: "Enter a valid destination URL",
    }),
  thankYouCraftState: z.record(z.string(), z.unknown()).nullable().optional(),
  thankYouThemeJson: z.record(z.string(), z.unknown()).optional(),
  thankYouPixelHtml: z.string().trim().max(10000).nullable().optional(),
  thankYouUseCampaignPixel: z.boolean().optional(),
  step: z.enum(["optin", "thankYou"]).optional(),
  autosave: z.boolean().optional(),
});

export const landingPageUpdateSchema = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  slug: z.string().trim().min(2).max(40).optional(),
  campaignId: z.string().nullable().optional(),
  craftState: z.record(z.string(), z.unknown()).optional(),
  themeJson: z.record(z.string(), z.unknown()).optional(),
  autosave: z.boolean().optional(),
});

export const landingSubmitSchema = z.object({
  landingPageSlug: z.string().min(1),
  data: z.record(z.string(), z.string()),
  honeypot: z.string().optional(),
  deviceFingerprint: z.string().max(128).optional(),
  submissionMeta: submissionMetaSchema,
});

export const templateImportSchema = z.object({
  templateMeta: z.object({
    name: z.string(),
    category: z.string(),
    schemaVersion: z.literal(1),
  }),
  craft: z.record(z.string(), z.unknown()),
  theme: z.record(z.string(), z.unknown()),
});
