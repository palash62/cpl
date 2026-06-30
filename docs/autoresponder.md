# Advertiser Autoresponder Integrations

Connect your email list or automation tool to receive leads from your CPL campaigns automatically.

## Supported providers

| Provider | Use case |
|----------|----------|
| **Custom Webhook** | Zapier, Make, n8n, or your own endpoint |
| **Mailchimp** | Add subscribers to an audience list |
| **AWeber** | Add subscribers to a list (manual access token in v1) |
| **GetResponse** | Add contacts to a campaign |

## Triggers

Each connection chooses when to fire:

- **When lead is submitted** — fires as soon as the lead is captured (pending or approved).
- **When lead is approved** — fires only after the lead is approved and paid.

You can create multiple connections with different triggers (e.g. webhook on submit, Mailchimp on approval).

## Setup

1. Go to **Advertiser → Integrations**.
2. Click **Add integration** and pick your provider.
3. Choose **All campaigns** or limit to a specific campaign.
4. Enter credentials (API keys are stored encrypted).
5. Use **Test** to send a sample payload.

Connections apply to leads on your campaigns — including traffic from publisher Smart Links and leads from your opt-in pages.

## Campaign scope

- **All campaigns** — every lead on any of your campaigns triggers the connection.
- **Specific campaign** — only leads on that campaign are sent.

## Webhook payload

```json
{
  "event": "lead.captured",
  "leadId": "...",
  "email": "user@example.com",
  "firstName": "Jane",
  "phone": "+1...",
  "campaign": { "id": "...", "name": "..." },
  "publisher": { "id": "...", "name": "..." },
  "source": "facebook",
  "subId": "ad-123",
  "submittedAt": "2026-06-30T12:00:00.000Z"
}
```

If you set a signing secret, requests include an `X-CPL-Signature` header (HMAC-SHA256 of the body).

## Field mapping

By default, lead form fields `email`, `first_name`, `last_name`, `phone`, and `country` are mapped automatically. Custom mappings can be added in a future release.

## Compliance

You are responsible for obtaining subscriber consent before adding leads to your marketing lists. Ensure your opt-in pages and privacy policies disclose that information may be shared with your email provider.
