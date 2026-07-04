import { z } from "zod";

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
