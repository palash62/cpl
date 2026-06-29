export const OPTIN_TEMPLATE_IDS = [
  "aurora",
  "sunrise",
  "ocean",
  "minimal",
  "bold",
  "neon",
] as const;

export type OptinTemplateId = (typeof OPTIN_TEMPLATE_IDS)[number];

export type OptinTemplateDefinition = {
  id: OptinTemplateId;
  name: string;
  description: string;
  primaryColor: string;
  accentColor: string;
  headline: string;
  subheadline: string;
  badgeText: string;
};

export const OPTIN_TEMPLATES: Record<OptinTemplateId, OptinTemplateDefinition> = {
  aurora: {
    id: "aurora",
    name: "Aurora Split",
    description: "Premium dark hero with glowing form card — high-converting split layout.",
    primaryColor: "#6366f1",
    accentColor: "#a855f7",
    headline: "Get Your Free Growth Playbook",
    subheadline: "The exact framework 12,000+ marketers use to 3× their leads",
    badgeText: "🔥 Limited free access",
  },
  sunrise: {
    id: "sunrise",
    name: "Sunrise Center",
    description: "Warm, energetic center layout that feels inviting and urgent.",
    primaryColor: "#f97316",
    accentColor: "#facc15",
    headline: "Start Converting More Leads Today",
    subheadline: "Join the waitlist and get instant access to our proven system",
    badgeText: "⚡ Free — no credit card",
  },
  ocean: {
    id: "ocean",
    name: "Ocean Wave",
    description: "Trust-building blues with bold hero and stacked conversion flow.",
    primaryColor: "#0ea5e9",
    accentColor: "#06b6d4",
    headline: "Unlock Premium Leads on Autopilot",
    subheadline: "Trusted by growth teams who refuse to leave money on the table",
    badgeText: "✓ Trusted by 500+ brands",
  },
  minimal: {
    id: "minimal",
    name: "Minimal Light",
    description: "Clean, premium white layout — perfect for B2B and professional offers.",
    primaryColor: "#0f172a",
    accentColor: "#6366f1",
    headline: "The Playbook Top Brands Don't Share",
    subheadline: "One email. Zero fluff. Actionable strategies you can use today.",
    badgeText: "100% free resource",
  },
  bold: {
    id: "bold",
    name: "Bold Hero",
    description: "Maximum impact headline with overlapping form — built for paid ads.",
    primaryColor: "#dc2626",
    accentColor: "#f97316",
    headline: "Stop Losing Leads. Start Winning.",
    subheadline: "High-converting optin built for aggressive campaigns that demand results",
    badgeText: "🏆 Top converting layout",
  },
  neon: {
    id: "neon",
    name: "Neon Glow",
    description: "Futuristic dark neon aesthetic — stand out from every competitor.",
    primaryColor: "#22d3ee",
    accentColor: "#e879f9",
    headline: "Launch Your Next Funnel in Minutes",
    subheadline: "Futuristic design that stops the scroll and drives sign-ups",
    badgeText: "✨ New — high impact",
  },
};

export function isOptinTemplateId(value: string): value is OptinTemplateId {
  return OPTIN_TEMPLATE_IDS.includes(value as OptinTemplateId);
}

export function getOptinTemplate(id: OptinTemplateId) {
  return OPTIN_TEMPLATES[id];
}

export function listOptinTemplates() {
  return OPTIN_TEMPLATE_IDS.map((id) => OPTIN_TEMPLATES[id]);
}

export function getDefaultTemplateId(): OptinTemplateId {
  return "aurora";
}
