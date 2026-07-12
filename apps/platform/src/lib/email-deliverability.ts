import { isValidEmail } from "@/lib/validations";
import type { RuleOutcome } from "@/modules/fraud/types/result";
import { DEFAULT_FRAUD_CONFIG } from "@/modules/fraud/config/defaults";

export const ELV_VERIFY_URL = "https://apps.emaillistverify.com/api/verifyEmail";

const SIGNUP_REJECT_STATUSES = new Set([
  "disposable",
  "invalid",
  "invalid_mx",
  "email_disabled",
  "dead_server",
]);

const ELV_ERROR_STATUSES = new Set(["key_not_valid", "incorrect", "missing parameters"]);

export type EmailDeliverabilityResult =
  | { ok: true }
  | { ok: false; reason: string };

/** Fetch plain-text EmailListVerify status; null when key missing or request fails. */
export async function fetchEmailListVerifyStatus(email: string): Promise<string | null> {
  const apiKey = process.env.FRAUD_EMAIL_API_KEY?.trim();
  if (!apiKey) return null;

  try {
    const url = `${ELV_VERIFY_URL}?secret=${encodeURIComponent(apiKey)}&email=${encodeURIComponent(email)}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(2500) });
    if (!res.ok) return null;

    const status = (await res.text()).trim();
    const normalized = status.toLowerCase();

    if (ELV_ERROR_STATUSES.has(normalized)) {
      console.warn(`[email-deliverability] EmailListVerify error: ${status}`);
      return null;
    }

    return status;
  } catch {
    return null;
  }
}

/** Map EmailListVerify plain-text status to a fraud rule outcome. */
export function mapEmailListVerifyStatus(status: string): RuleOutcome | null {
  const normalized = status.trim().toLowerCase();

  if (normalized === "ok") return null;

  if (normalized === "disposable") {
    return {
      rule: "disposable_email",
      passed: false,
      riskDelta: DEFAULT_FRAUD_CONFIG.weights.disposable_email,
      hardFail: true,
      details: "Disposable email (EmailListVerify)",
    };
  }

  if (normalized === "role") {
    return {
      rule: "role_email",
      passed: false,
      riskDelta: DEFAULT_FRAUD_CONFIG.weights.role_email,
      hardFail: false,
      details: "Role email (EmailListVerify)",
    };
  }

  if (normalized === "accept_all" || normalized === "ok_for_all") {
    return {
      rule: "role_email",
      passed: false,
      riskDelta: DEFAULT_FRAUD_CONFIG.weights.role_email,
      hardFail: false,
      details: `Catch-all domain (${normalized}, EmailListVerify)`,
    };
  }

  if (SIGNUP_REJECT_STATUSES.has(normalized)) {
    return {
      rule: "email_format",
      passed: false,
      riskDelta: 30,
      hardFail: false,
      details: `Invalid email (${normalized}, EmailListVerify)`,
    };
  }

  if (normalized === "unknown") return null;

  return null;
}

function signupRejectReason(status: string): string | null {
  const normalized = status.trim().toLowerCase();
  if (normalized === "disposable") {
    return "Disposable email addresses are not allowed. Use a permanent email address.";
  }
  if (SIGNUP_REJECT_STATUSES.has(normalized)) {
    return "This email address could not be verified. Check the address and try again.";
  }
  return null;
}

/** Validate an email for account signup; fail-open when ELV is not configured. */
export async function validateEmailDeliverability(email: string): Promise<EmailDeliverabilityResult> {
  const normalized = email.trim().toLowerCase();
  if (!isValidEmail(normalized)) {
    return { ok: false, reason: "Enter a valid email address." };
  }

  const status = await fetchEmailListVerifyStatus(normalized);
  if (!status) return { ok: true };

  const rejectReason = signupRejectReason(status);
  if (rejectReason) return { ok: false, reason: rejectReason };

  return { ok: true };
}
