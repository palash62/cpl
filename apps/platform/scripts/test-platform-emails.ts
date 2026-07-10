/**
 * Test all three LeadVix platform email addresses.
 * Run: npm run test:emails --workspace @cpl/platform
 */
import { config } from "dotenv";
import { resolve } from "node:path";
import { PLATFORM_EMAILS } from "@/lib/email/addresses";
import {
  sendEmail,
  getAdminAlertEmail,
  getSupportEmail,
  resetEmailTransport,
} from "@/services/email.service";
import { notifyAdminAlert } from "@/services/notify.service";

config({ path: resolve(import.meta.dirname, "../.env") });

async function main() {
  resetEmailTransport();

  const adminEmail = (await getAdminAlertEmail()) ?? PLATFORM_EMAILS.admin;
  const supportEmail = (await getSupportEmail()) ?? PLATFORM_EMAILS.support;
  const stamp = new Date().toISOString();

  console.log("Platform emails:", PLATFORM_EMAILS);
  console.log("Admin recipient:", adminEmail);
  console.log("Support reply-to:", supportEmail);
  console.log("");

  const results: { name: string; ok: boolean; detail: string }[] = [];

  const noreply = await sendEmail({
    to: adminEmail,
    subject: `[Test 1] noreply transactional — ${stamp}`,
    html: `<p>From: <strong>${PLATFORM_EMAILS.fromDisplay}</strong></p><p>This is the noreply transactional test.</p>`,
    text: `noreply transactional test at ${stamp}`,
    template: "generic",
    metadata: { kind: "test_noreply" },
  });
  results.push({
    name: "noreply → admin",
    ok: noreply.sent,
    detail: noreply.skipped ? "SMTP skipped (not configured)" : noreply.sent ? "sent" : "failed",
  });

  await notifyAdminAlert({
    title: "Email test — admin alerts",
    message: `Admin alert test at ${stamp}. This should arrive at ${adminEmail}.`,
    metadata: { kind: "test_admin_alert" },
  });
  results.push({ name: "admin alert → admin", ok: true, detail: "dispatched" });

  const supportReply = await sendEmail({
    to: adminEmail,
    subject: `[Test 3] support Reply-To — ${stamp}`,
    html: `<p>From: noreply@leadvix.io</p><p>Reply-To: <strong>${supportEmail}</strong></p><p>Reply to this email to verify support routing.</p>`,
    text: `Reply-To test: reply should go to ${supportEmail}`,
    template: "generic",
    replyTo: supportEmail,
    metadata: { kind: "test_support_reply_to" },
  });
  results.push({
    name: "noreply + Reply-To support",
    ok: supportReply.sent,
    detail: supportReply.skipped ? "SMTP skipped" : supportReply.sent ? "sent" : "failed",
  });

  console.log("Results:");
  for (const r of results) {
    console.log(`  ${r.ok ? "OK" : "FAIL"}  ${r.name}: ${r.detail}`);
  }

  const failed = results.filter((r) => !r.ok);
  if (failed.length > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
