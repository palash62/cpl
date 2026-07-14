import { z } from "zod";

export const PASSWORD_REQUIREMENTS_TEXT =
  "Use at least 8 characters with uppercase, lowercase, a number, and a special character.";

export type PasswordRequirement = {
  id: string;
  label: string;
  test: (password: string) => boolean;
};

export const PASSWORD_REQUIREMENTS: PasswordRequirement[] = [
  {
    id: "length",
    label: "At least 8 characters",
    test: (password) => password.length >= 8,
  },
  {
    id: "lower",
    label: "One lowercase letter (a–z)",
    test: (password) => /[a-z]/.test(password),
  },
  {
    id: "upper",
    label: "One uppercase letter (A–Z)",
    test: (password) => /[A-Z]/.test(password),
  },
  {
    id: "number",
    label: "One number (0–9)",
    test: (password) => /\d/.test(password),
  },
  {
    id: "special",
    label: "One special character (!@#$%…)",
    test: (password) => /[^A-Za-z0-9]/.test(password),
  },
];

export function getPasswordRequirementFailures(password: string): string[] {
  return PASSWORD_REQUIREMENTS.filter((rule) => !rule.test(password)).map((rule) => rule.label);
}

export function isStrongPassword(password: string): boolean {
  return getPasswordRequirementFailures(password).length === 0;
}

/** Shared Zod schema for signup / reset / change-password flows. */
export const strongPasswordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .refine((value) => /[a-z]/.test(value), {
    message: "Password must include at least one lowercase letter",
  })
  .refine((value) => /[A-Z]/.test(value), {
    message: "Password must include at least one uppercase letter",
  })
  .refine((value) => /\d/.test(value), {
    message: "Password must include at least one number",
  })
  .refine((value) => /[^A-Za-z0-9]/.test(value), {
    message: "Password must include at least one special character",
  });
