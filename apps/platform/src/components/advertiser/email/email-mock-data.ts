export type MockSubscriber = {
  id: string;
  email: string;
  name: string;
  status: "active" | "unsubscribed" | "bounced";
  lists: string;
  tags: string;
  subscribedAt: string;
};

export type MockList = {
  id: string;
  name: string;
  subscribers: number;
  createdAt: string;
};

export type MockSegment = {
  id: string;
  name: string;
  rules: string;
  subscribers: number;
  updatedAt: string;
};

export type MockTag = {
  id: string;
  name: string;
  subscribers: number;
  color: string;
};

export type MockCampaign = {
  id: string;
  name: string;
  status: "draft" | "scheduled" | "sent" | "sending";
  sent: number;
  opens: number;
  clicks: number;
  scheduledAt: string;
};

export type MockSequence = {
  id: string;
  name: string;
  steps: number;
  subscribers: number;
  status: "active" | "paused" | "draft";
  updatedAt: string;
};

export type MockForm = {
  id: string;
  name: string;
  type: "embedded" | "popup";
  submissions: number;
  conversionRate: string;
  status: "active" | "draft";
};

export type MockEmailLog = {
  id: string;
  recipient: string;
  subject: string;
  status: "delivered" | "opened" | "clicked" | "bounced" | "failed";
  sentAt: string;
};

export type MockSuppression = {
  id: string;
  email: string;
  reason: string;
  date: string;
};

export type MockActivity = {
  id: string;
  action: string;
  detail: string;
  time: string;
};

export const MOCK_SUBSCRIBERS: MockSubscriber[] = [
  { id: "1", email: "sarah@example.com", name: "Sarah Chen", status: "active", lists: "Newsletter, VIP", tags: "lead, buyer", subscribedAt: "2026-06-12" },
  { id: "2", email: "mike@acme.io", name: "Mike Johnson", status: "active", lists: "Newsletter", tags: "lead", subscribedAt: "2026-06-10" },
  { id: "3", email: "emma@startup.co", name: "Emma Wilson", status: "unsubscribed", lists: "—", tags: "trial", subscribedAt: "2026-05-28" },
  { id: "4", email: "james@corp.net", name: "James Lee", status: "active", lists: "Product Updates", tags: "buyer", subscribedAt: "2026-06-01" },
  { id: "5", email: "bad@invalid.mail", name: "—", status: "bounced", lists: "Newsletter", tags: "—", subscribedAt: "2026-05-15" },
];

export const MOCK_LISTS: MockList[] = [
  { id: "1", name: "Newsletter", subscribers: 1240, createdAt: "2026-01-15" },
  { id: "2", name: "VIP Customers", subscribers: 86, createdAt: "2026-02-20" },
  { id: "3", name: "Product Updates", subscribers: 542, createdAt: "2026-03-10" },
  { id: "4", name: "Webinar Attendees", subscribers: 318, createdAt: "2026-04-05" },
];

export const MOCK_SEGMENTS: MockSegment[] = [
  { id: "1", name: "High-intent leads", rules: "Opened email in last 7 days + clicked link", subscribers: 124, updatedAt: "2026-06-14" },
  { id: "2", name: "Inactive 30 days", rules: "No open in 30 days", subscribers: 89, updatedAt: "2026-06-13" },
  { id: "3", name: "New subscribers", rules: "Subscribed in last 14 days", subscribers: 56, updatedAt: "2026-06-15" },
];

export const MOCK_TAGS: MockTag[] = [
  { id: "1", name: "lead", subscribers: 890, color: "bg-blue-50 text-blue-700" },
  { id: "2", name: "buyer", subscribers: 234, color: "bg-green-50 text-green-700" },
  { id: "3", name: "trial", subscribers: 156, color: "bg-purple-50 text-purple-700" },
  { id: "4", name: "vip", subscribers: 42, color: "bg-amber-50 text-amber-700" },
];

export const MOCK_CAMPAIGNS: MockCampaign[] = [
  { id: "1", name: "June Product Launch", status: "sent", sent: 1240, opens: 486, clicks: 92, scheduledAt: "2026-06-01" },
  { id: "2", name: "Weekly Digest #24", status: "scheduled", sent: 0, opens: 0, clicks: 0, scheduledAt: "2026-06-20" },
  { id: "3", name: "Re-engagement Blast", status: "draft", sent: 0, opens: 0, clicks: 0, scheduledAt: "—" },
];

export const MOCK_SEQUENCES: MockSequence[] = [
  { id: "1", name: "Welcome Series", steps: 5, subscribers: 342, status: "active", updatedAt: "2026-06-10" },
  { id: "2", name: "Onboarding Drip", steps: 3, subscribers: 128, status: "active", updatedAt: "2026-06-08" },
  { id: "3", name: "Win-back Campaign", steps: 4, subscribers: 0, status: "draft", updatedAt: "2026-06-05" },
];

export const MOCK_FORMS: MockForm[] = [
  { id: "1", name: "Homepage Newsletter", type: "embedded", submissions: 1240, conversionRate: "3.2%", status: "active" },
  { id: "2", name: "Exit Intent Popup", type: "popup", submissions: 486, conversionRate: "5.8%", status: "active" },
  { id: "3", name: "Blog Sidebar", type: "embedded", submissions: 0, conversionRate: "—", status: "draft" },
];

export const MOCK_EMAIL_LOGS: MockEmailLog[] = [
  { id: "1", recipient: "sarah@example.com", subject: "Welcome to LeadVix", status: "opened", sentAt: "2026-06-15 10:32" },
  { id: "2", recipient: "mike@acme.io", subject: "Your weekly digest", status: "delivered", sentAt: "2026-06-15 09:15" },
  { id: "3", recipient: "bad@invalid.mail", subject: "Product update", status: "bounced", sentAt: "2026-06-14 16:40" },
  { id: "4", recipient: "james@corp.net", subject: "Special offer inside", status: "clicked", sentAt: "2026-06-14 14:22" },
  { id: "5", recipient: "emma@startup.co", subject: "We miss you!", status: "failed", sentAt: "2026-06-13 11:00" },
];

export const MOCK_BOUNCED: MockSuppression[] = [
  { id: "1", email: "bad@invalid.mail", reason: "Hard bounce — mailbox not found", date: "2026-06-14" },
  { id: "2", email: "old@defunct.co", reason: "Soft bounce — mailbox full", date: "2026-06-10" },
];

export const MOCK_COMPLAINTS: MockSuppression[] = [
  { id: "1", email: "spam@report.com", reason: "Marked as spam", date: "2026-06-12" },
];

export const MOCK_UNSUBSCRIBED: MockSuppression[] = [
  { id: "1", email: "emma@startup.co", reason: "User unsubscribed", date: "2026-06-08" },
  { id: "2", email: "optout@user.net", reason: "User unsubscribed", date: "2026-06-05" },
];

export const MOCK_RECENT_ACTIVITY: MockActivity[] = [
  { id: "1", action: "Campaign sent", detail: "June Product Launch — 1,240 recipients", time: "2 hours ago" },
  { id: "2", action: "New subscriber", detail: "sarah@example.com joined Newsletter", time: "4 hours ago" },
  { id: "3", action: "Automation triggered", detail: "Welcome Series — step 1 sent", time: "6 hours ago" },
  { id: "4", action: "Bounce recorded", detail: "bad@invalid.mail — hard bounce", time: "1 day ago" },
];

export const MOCK_SENDS_TREND = [
  { date: "2026-06-09", count: 120 },
  { date: "2026-06-10", count: 185 },
  { date: "2026-06-11", count: 142 },
  { date: "2026-06-12", count: 210 },
  { date: "2026-06-13", count: 168 },
  { date: "2026-06-14", count: 245 },
  { date: "2026-06-15", count: 198 },
];

export const MOCK_OPENS_TREND = [
  { date: "2026-06-09", count: 48 },
  { date: "2026-06-10", count: 72 },
  { date: "2026-06-11", count: 55 },
  { date: "2026-06-12", count: 84 },
  { date: "2026-06-13", count: 61 },
  { date: "2026-06-14", count: 98 },
  { date: "2026-06-15", count: 76 },
];

export const MOCK_ANALYTICS_BARS = [
  { name: "Mon", value: 42 },
  { name: "Tue", value: 58 },
  { name: "Wed", value: 35 },
  { name: "Thu", value: 72 },
  { name: "Fri", value: 64 },
  { name: "Sat", value: 28 },
  { name: "Sun", value: 31 },
];

export const DASHBOARD_STATS = [
  { label: "Total Subscribers", value: "1,240", icon: "Users" as const, accent: "purple" as const },
  { label: "Emails Sent", value: "8,420", icon: "Send" as const, variant: "leads" as const },
  { label: "Open Rate", value: "38.2%", icon: "Mail" as const, accent: "green" as const, trend: 4.2 },
  { label: "Click Rate", value: "7.8%", icon: "MousePointerClick" as const, accent: "orange" as const, trend: -1.1 },
];

export const ANALYTICS_STATS = [
  { label: "Delivered", value: "98.4%", icon: "CheckCircle" as const, accent: "green" as const },
  { label: "Opens", value: "38.2%", icon: "MailOpen" as const, variant: "leads" as const },
  { label: "Clicks", value: "7.8%", icon: "MousePointerClick" as const, accent: "purple" as const },
  { label: "Bounces", value: "1.6%", icon: "AlertTriangle" as const, accent: "red" as const },
];

export function filterBySearch<T extends Record<string, unknown>>(
  rows: T[],
  search: string,
  keys: (keyof T)[],
): T[] {
  const q = search.trim().toLowerCase();
  if (!q) return rows;
  return rows.filter((row) =>
    keys.some((key) => String(row[key] ?? "").toLowerCase().includes(q)),
  );
}

export function filterByField<T extends Record<string, unknown>>(
  rows: T[],
  field: keyof T,
  value: string | undefined,
): T[] {
  if (!value || value === "all") return rows;
  return rows.filter((row) => String(row[field]) === value);
}
