# Email Marketing (Native Autoresponder)

Platform-owned email marketing for advertisers — welcome emails, drip sequences, and contact management powered by **AWS SES**.

## Overview

Advertisers can run Mailchimp-style automations without paying for a third-party ESP:

- **Contacts** — auto-synced from captured leads
- **Templates** — HTML emails with merge tags (`{{first_name}}`, `{{campaign_name}}`, etc.)
- **Automations** — multi-step drips on `LEAD_CAPTURED` or `LEAD_APPROVED`
- **Analytics** — sends, opens, clicks, bounces
- **Compliance** — unsubscribe links, bounce/complaint suppression

External integrations (Mailchimp, webhook, etc.) remain available under **Advertiser → Integrations**.

## Setup (Admin)

1. Go to **Admin → Settings → Email Marketing (AWS SES)**.
2. Configure:
   - `AWS_REGION` (e.g. `us-east-1`)
   - Access key + secret (IAM: `ses:SendEmail`, `ses:CreateEmailIdentity`, `ses:GetEmailIdentity`)
   - Verified **from domain** (e.g. `mail.yourplatform.com`)
   - **Configuration set** (optional, for bounce/complaint events)
   - **App URL** (for tracking pixels and unsubscribe links)

Or set environment variables in `.env`:

```
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
SES_FROM_DOMAIN=mail.yourplatform.com
SES_FROM_EMAIL=noreply@mail.yourplatform.com
SES_CONFIGURATION_SET=marketing
APP_URL=https://yourapp.com
```

3. In AWS SES:
   - Verify domain + enable DKIM
   - Create a configuration set → SNS topic for bounces/complaints/delivery
   - Point SNS subscription to: `https://yourapp.com/api/v1/webhooks/ses`
   - Request production access (exit sandbox)

## Running the email worker

Drip delays and retries are processed by a BullMQ worker:

```bash
# Terminal 1
npm run dev

# Terminal 2 (requires Redis)
npm run worker:email
```

Set `REDIS_URL=redis://localhost:6379` in `.env`.

## Advertiser workflow

1. **Email → Templates** — create or use starter templates
2. **Email → Automations → Create** — pick trigger, add steps (immediate, 1 day, 3 days, 7 days)
3. **Activate** — new matching leads receive the sequence
4. **Email → Settings** — set from name, reply-to; optionally verify a custom domain

## Merge tags

| Tag | Description |
|-----|-------------|
| `{{first_name}}` | Lead first name |
| `{{last_name}}` | Lead last name |
| `{{email}}` | Contact email |
| `{{phone}}` | Phone |
| `{{campaign_name}}` | Source campaign |
| `{{company_name}}` | Advertiser company / from name |
| `{{unsubscribe_url}}` | One-click unsubscribe link |

## API routes

| Route | Role |
|-------|------|
| `/api/v1/advertiser/email/*` | Templates, automations, contacts, sends, stats, settings |
| `/api/v1/admin/email/ses` | Platform SES config |
| `/api/v1/webhooks/ses` | SNS bounce/complaint handler |
| `/api/v1/email/track/open|click` | Engagement tracking |
| `/unsubscribe/[token]` | Public unsubscribe page |

## Module structure

```
src/modules/email-marketing/
├── services/     # contacts, templates, automations, dispatch, send, tracking
├── queue/        # BullMQ enqueue
├── lib/          # template render, tokens
└── index.ts      # public exports
```

Lead events trigger dispatch from `src/services/lead.service.ts`.

## Compliance

- Every marketing email includes `List-Unsubscribe` header + footer link
- Unsubscribed, bounced, and complained contacts are suppressed
- Advertisers must disclose consent on opt-in pages
