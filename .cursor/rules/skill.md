# CPL Platform Product Context

**Project Name:** LeadFlow CPL Platform

**Purpose:** A Cost Per Lead platform connecting Advertisers and Publishers.

## Core Users

1. Admin
2. Advertiser
3. Publisher

## Business Flow

**Advertiser** → Creates Campaign → Defines Lead Form → Funds Account

**Publisher** → Selects Campaign → Promotes Offer → Generates Leads

**Visitor** → Completes Lead Form

**Platform** → Validates Lead → Approves or Rejects Lead → Updates Reporting → Calculates Earnings

**Admin** → Manages Users → Reviews Leads → Reviews Campaigns → Handles Withdrawals

## Core Modules

1. Authentication
2. User Management
3. Campaign Management
4. Offer Management
5. Lead Forms
6. Lead Capture
7. Lead Validation
8. Lead Approval
9. Wallet
10. Transactions
11. Withdrawals
12. Reporting
13. Dashboard
14. Notifications
15. Support Tickets

## Future Modules

1. Landing Page Builder
2. Built-in Opt-in Pages
3. Email Autoresponder
4. Affiliate Referral Program
5. Webhooks
6. API Integrations

## UI Design Principles

- Clean SaaS Design
- Stripe-inspired
- HubSpot-inspired
- Mobile Responsive
- Light Theme First
- Simple Navigation
- Data Focused

## Color Theme

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

## Technology Constraints

**Frontend:** React, TypeScript, Tailwind, Shadcn UI, Lucide Icons

**Backend:** Node.js (Next.js App Router)

**Database:** MySQL 8+

**ORM:** Prisma

**Hosting:** GoDaddy VPS

Always optimize decisions for this stack.

## Documentation

- [PRD](../docs/PRD.md)
- [Design System](../docs/DESIGN-SYSTEM.md)
- [Database Schema](../docs/DATABASE-SCHEMA.md)
- [API Spec](../docs/API-SPEC.md)
- [Screens](../docs/SCREENS.md)
- [Deployment](../docs/DEPLOYMENT.md)
