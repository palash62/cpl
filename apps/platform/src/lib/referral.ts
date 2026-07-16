export const REFERRAL_LEVEL_1_RATE = 0.1;
export const REFERRAL_LEVEL_2_RATE = 0.05;
export const REFERRAL_MIN_PAYOUT = 30;

export const REFERRAL_RATES_SUMMARY = "Earn 10% + 5% on 2 levels";

export const REFERRAL_LEVELS = [
  {
    level: 1,
    label: "Level 1",
    title: "Direct Referrals",
    rate: "10%",
    description: "Earn 10% of the ad spend from users you refer directly.",
    gradient: "var(--theme-gradient-revenue)",
  },
  {
    level: 2,
    label: "Level 2",
    title: "Indirect Referrals",
    rate: "5%",
    description: "Earn 5% from the ad spend of users your referrals refer.",
    gradient: "var(--theme-gradient-approved)",
  },
] as const;

export const REFERRAL_STEPS = [
  {
    step: 1,
    title: "Copy your link",
    description: "Get your unique referral link from this page and copy it.",
  },
  {
    step: 2,
    title: "Share with others",
    description: "Share on social media, email, blogs, or your website.",
  },
  {
    step: 3,
    title: "Earn commissions",
    description: "When referrals sign up and spend on ads, you earn recurring commissions.",
  },
] as const;

const REFERRAL_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generateReferralCode(length = 6) {
  let code = "";
  for (let i = 0; i < length; i += 1) {
    code += REFERRAL_ALPHABET[Math.floor(Math.random() * REFERRAL_ALPHABET.length)];
  }
  return code;
}

export const REFERRAL_COOKIE_NAME = "lv_referral_by";
export const REFERRAL_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days

export function buildReferralUrl(origin: string, referralCode: string) {
  return `${origin}/?referral_by=${encodeURIComponent(referralCode)}`;
}

export function readReferralCookie(): string {
  if (typeof document === "undefined") return "";
  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${REFERRAL_COOKIE_NAME}=`));
  if (!match) return "";
  try {
    return decodeURIComponent(match.split("=").slice(1).join("=")).trim();
  } catch {
    return "";
  }
}

export function writeReferralCookie(referralCode: string) {
  if (typeof document === "undefined") return;
  const code = referralCode.trim();
  if (!code) return;
  const secure = typeof window !== "undefined" && window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${REFERRAL_COOKIE_NAME}=${encodeURIComponent(code)}; Path=/; Max-Age=${REFERRAL_COOKIE_MAX_AGE_SECONDS}; SameSite=Lax${secure}`;
}

export function clearReferralCookie() {
  if (typeof document === "undefined") return;
  document.cookie = `${REFERRAL_COOKIE_NAME}=; Path=/; Max-Age=0; SameSite=Lax`;
}
