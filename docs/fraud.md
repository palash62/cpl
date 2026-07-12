# Lead Fraud Detection

The CPL platform scores every lead submission for fraud risk before approval. Risk scores range from **0 (safe)** to **100 (risky)**.

## How it works

1. A visitor submits a lead form (publisher tracking link or advertiser opt-in page).
2. The browser collects lightweight behavioral signals (form duration, mouse/keyboard activity) and a soft device fingerprint.
3. The server runs built-in fraud rules and optional third-party checks.
4. Each rule contributes a **risk delta**; the total is clamped to 0–100.
5. Leads are auto-approved, queued for review, or rejected based on configurable thresholds.

## Default thresholds

| Risk score | Action |
|------------|--------|
| 0–20 | Auto-approve (if campaign allows auto-approve and advertiser has funds) |
| 21–50 | Manual review (`PENDING`) |
| 51+ | Auto-reject |

Thresholds are configurable in **Admin → Fraud Center → Fraud Settings**.

## Shadow mode

By default, **Use risk-based decisions** is **off**. Fraud scores are recorded on every lead, but final status still follows legacy quality rules until you enable risk decisions after tuning.

## Signals checked

- Duplicate email, phone, IP, or device (per campaign)
- Disposable or role-based email addresses
- IP blocklist
- Geo mismatch vs campaign targeting
- VPN / proxy / hosting IP (when IP API key is configured)
- Behavioral patterns (fast submit, no mouse movement, paste-only)
- Honeypot field (bots that fill hidden fields are rejected)

## Publisher quality

Publishers receive a rolling **30-day quality score** (approval rate) and **spam score** (average lead risk 0–100). Quality below 50% or spam score at 51+ triggers admin alerts. Review both metrics in **Admin → Publishers** when approving or rejecting accounts.

Campaigns with very high rejection rates also notify admins.

## Optional API providers

Set these environment variables for enhanced checks (built-in rules still run if keys are missing):

- `FRAUD_IP_API_KEY` — IPinfo for VPN/proxy and country lookup
- `FRAUD_EMAIL_API_KEY` — EmailListVerify API key (apps.emaillistverify.com)

EmailListVerify is also used at **account signup** (advertiser registration and admin-created publishers) to reject disposable or undeliverable addresses before an account is created.

## Admin tools

- **Fraud Center** (`/admin/fraud`) — metrics, high-risk queue, IP blocklist, settings
- **Leads** (`/admin/leads`) — risk score and failed rule flags per lead

## Privacy

Behavioral collection is limited to form timing and interaction counts plus coarse device hints (timezone, language, screen size). No canvas fingerprinting or invasive tracking in v1.

## Compliance notes

- Inform end users in your privacy policy that lead forms may use fraud-prevention signals.
- IP and email enrichment via third parties is subject to those providers' terms and applicable data-protection laws.
- OTP verification is reserved for a future release.
