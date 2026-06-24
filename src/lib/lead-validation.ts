import type { UserRole } from "@prisma/client";
import { isValidEmail, isValidPhone } from "./validations";

export interface ValidationInput {
  data: Record<string, string>;
  campaignFields: Array<{
    fieldName: string;
    required: boolean;
    fieldType: string;
  }>;
  existingEmails: string[];
  existingPhones: string[];
  honeypot?: string;
}

export interface ValidationResult {
  passed: boolean;
  score: number;
  results: Array<{ rule: string; passed: boolean; details?: string }>;
}

export function validateLead(input: ValidationInput): ValidationResult {
  const results: ValidationResult["results"] = [];
  let score = 100;

  if (input.honeypot) {
    results.push({ rule: "honeypot", passed: false, details: "Bot detected" });
    return { passed: false, score: 0, results };
  }
  results.push({ rule: "honeypot", passed: true });

  for (const field of input.campaignFields) {
    const value = input.data[field.fieldName]?.trim() ?? "";

    if (field.required && !value) {
      results.push({
        rule: `required_${field.fieldName}`,
        passed: false,
        details: `${field.fieldName} is required`,
      });
      score -= 20;
      continue;
    }

    if (field.fieldType === "email" && value && !isValidEmail(value)) {
      results.push({
        rule: "email_format",
        passed: false,
        details: "Invalid email format",
      });
      score -= 15;
    }

    if (field.fieldType === "phone" && value && !isValidPhone(value)) {
      results.push({
        rule: "phone_format",
        passed: false,
        details: "Invalid phone format",
      });
      score -= 15;
    }
  }

  const email = input.data.email?.toLowerCase();
  if (email && input.existingEmails.includes(email)) {
    results.push({
      rule: "duplicate_email",
      passed: false,
      details: "Email already exists for this campaign",
    });
    score -= 50;
  } else if (email) {
    results.push({ rule: "duplicate_email", passed: true });
  }

  const phone = input.data.phone?.replace(/\D/g, "");
  if (phone && input.existingPhones.includes(phone)) {
    results.push({
      rule: "duplicate_phone",
      passed: false,
      details: "Phone already exists for this campaign",
    });
    score -= 50;
  } else if (phone) {
    results.push({ rule: "duplicate_phone", passed: true });
  }

  const failedRequired = results.some(
    (r) => r.rule.startsWith("required_") && !r.passed,
  );
  const failedDuplicate = results.some(
    (r) => r.rule.startsWith("duplicate_") && !r.passed,
  );

  const passed = !failedRequired && !failedDuplicate && score >= 50;

  return { passed, score: Math.max(0, score), results };
}

export function canAccessRoute(
  userRole: UserRole,
  allowedRoles: UserRole[],
): boolean {
  return allowedRoles.includes(userRole);
}
