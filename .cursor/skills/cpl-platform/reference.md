# CPL Platform Reference

## Product

**LeadFlow CPL** — cost-per-lead marketplace: advertisers fund campaigns, publishers promote offers, platform validates and pays on approved leads.

### Core modules (implemented or in progress)

Authentication, user management, campaigns, offers, lead forms, lead capture/validation/approval, wallet, transactions, withdrawals, reporting, dashboards, notifications, support tickets, email autoresponder (advertiser UI), opt-in pages, fraud.

## Stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js 16 App Router |
| Language | TypeScript |
| Styling | Tailwind CSS v4, Shadcn UI |
| Icons | Lucide (client components only) |
| DB | MySQL 8+, Prisma |
| Auth | NextAuth.js v5 |
| Tests | Vitest, Playwright |

## Repo map

```
apps/platform/     Main app (@cpl/platform)
apps/tracking/     Tracking service (@cpl/tracking)
packages/database/ Prisma schema + client
packages/shared/   Shared utilities
packages/tracking-core/
scripts/env-local.sh
```

## Env files

- Root `.env.example` — template
- `apps/platform/.env`, `apps/tracking/.env`, `packages/database/.env` — local (gitignored)
- `npm run env:local` syncs localhost URLs and dev secrets

## Email module file map

```
apps/platform/src/app/(advertiser)/advertiser/email/
  layout.tsx
  page.tsx                    # dashboard
  subscribers/page.tsx
  ...                         # one route per sub-nav item

apps/platform/src/components/advertiser/email/
  autoresponder-sub-nav.tsx
  email-module-shell.tsx
  email-mock-data.ts
  panels/*-panel.tsx
```

## Design tokens

| Token | Value |
|-------|-------|
| Primary | `#2563EB` |
| Secondary | `#14B8A6` |
| Success | `#22C55E` |
| Warning | `#F59E0B` |
| Danger | `#EF4444` |
| Background | `#F8FAFC` |
| Cards | `#FFFFFF` |
| Font | Inter |

## Business flow

Advertiser → campaign + lead form → fund wallet  
Publisher → promote → traffic hits tracking domain  
Visitor → submits lead → validation → approve/reject → wallet/reporting  
Admin → users, campaigns, leads, payouts, SMTP/platform settings
