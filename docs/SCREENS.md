# LeadFlow CPL Platform — Screen Inventory

**Product:** LeadFlow CPL Platform  
**Total MVP Screens:** 61

## Implementation Status Summary

| Status | Count | Description |
|--------|-------|-------------|
| Done | ~40 | Fully functional UI |
| Partial | ~8 | Basic UI, missing detail views |
| Planned | ~13 | Not yet built |

---

## Shared / Auth Screens (12)

| # | Screen | Route | Status | Wireframe Notes |
|---|--------|-------|--------|-----------------|
| 1 | Login | `/login` | Done | Centered card, role-based redirect |
| 2 | Register | `/register` | Done | Role toggle Advertiser/Publisher |
| 3 | Forgot Password | `/forgot-password` | Planned | Email input, success state |
| 4 | Reset Password | `/reset-password?token=` | Planned | Token validation |
| 5 | Email Verification | `/verify-email` | Done | Advertiser auto-activates; publisher awaits admin |
| 6 | 404 Not Found | — | Done | Branded, link to login |
| 7 | 403 Forbidden | — | Planned | Access denied message |
| 8 | 500 Error | — | Planned | Retry + support link |
| 9 | Profile Settings | `/settings/profile` | Planned | Avatar, name, email |
| 10 | Notification Preferences | `/settings/notifications` | Planned | Toggle per event type |
| 11 | Notification Center | `/notifications` | Done | List, mark read |
| 12 | Global Search | `/search?q=` | Planned | Tabbed results |

---

## Admin Screens (18)

| # | Screen | Route | Status | Wireframe Notes |
|---|--------|-------|--------|-----------------|
| 1 | Dashboard | `/admin` | Done | 7 stat cards, 4 charts, 3 data tables |
| 2 | Advertisers List | `/admin/advertisers` | Done | List with status toggle |
| 3 | Advertiser Detail | `/admin/advertisers/[id]` | Planned | Profile card, campaigns tab, wallet tab |
| 4 | Publishers List | `/admin/publishers` | Done | List with KYC, leads, status toggle |
| 5 | Publisher Detail | `/admin/publishers/[id]` | Planned | Profile, campaigns tab, earnings |
| 6 | Campaigns List | `/admin/campaigns` | Done | All campaigns with advertiser, CPL, status |
| 7 | Campaign Detail | `/admin/campaigns/[id]` | Planned | Full campaign config, leads tab |
| 8 | Leads List | `/admin/leads` | Done | Global lead queue |
| 9 | Lead Detail | `/admin/leads/[id]` | Planned | Lead data, validation, history |
| 10 | Wallets Overview | `/admin/wallets` | Partial | Balance list; adjust via API |
| 11 | Wallet Detail | `/admin/wallets/[id]` | Planned | Ledger entries, adjust modal |
| 12 | Payouts Queue | `/admin/payouts` | Done | Approve/reject actions |
| 13 | Payout Detail | `/admin/payouts/[id]` | Planned | Amount, method, process button |
| 14 | Platform Reports | `/admin/reports` | Done | Summary metrics, payout breakdown |
| 15 | Support Tickets | `/admin/support` | Done | All tickets, create ticket |
| 16 | Ticket Detail | `/admin/support/[id]` | Planned | Thread view, internal notes |
| 17 | Settings | `/admin/settings` | Done | Platform fee, per-method payout minimums |
| 18 | Audit Log | `/admin/audit-log` | Done | Actor, action, entity, timestamp |

---

## Advertiser Screens (14)

| # | Screen | Route | Status | Wireframe Notes |
|---|--------|-------|--------|-----------------|
| 1 | Dashboard | `/advertiser` | Done | Stat cards, charts, pending review |
| 2 | Campaigns List | `/advertiser/campaigns` | Done | Table with status badges, create CTA |
| 3 | Create Campaign | `/advertiser/campaigns/new` | Done | Multi-step form basics |
| 4 | Edit Campaign | `/advertiser/campaigns/[id]/edit` | Planned | Pre-filled form, pause/archive |
| 5 | Campaign Detail | `/advertiser/campaigns/[id]` | Planned | Stats, leads tab, publishers tab |
| 6 | Leads List | `/advertiser/leads` | Done | Filterable table, approve/reject |
| 7 | Lead Detail | `/advertiser/leads/[id]` | Planned | Full lead data, history |
| 8 | Lead Review Queue | `/advertiser/leads/review` | Partial | Via leads list filter |
| 9 | Wallet | `/advertiser/wallet` | Done | Balance card, mock deposit |
| 10 | Add Funds | `/advertiser/wallet/deposit` | Partial | Mock deposit in wallet page |
| 11 | Transaction History | `/advertiser/wallet/transactions` | Planned | Full ledger with filters |
| 12 | Reports | `/advertiser/reports` | Done | Campaign performance summary |
| 13 | Export | `/advertiser/reports/export` | Planned | CSV export, date range |
| 14 | Support | `/advertiser/support` | Done | Ticket list + create |

---

## Publisher Screens (14)

| # | Screen | Route | Status | Wireframe Notes |
|---|--------|-------|--------|-----------------|
| 1 | Dashboard | `/publisher` | Done | Stat cards, earnings chart |
| 2 | Marketplace | `/publisher/marketplace` | Done | Campaign cards, join, tracking link |
| 3 | Campaign Preview | `/publisher/marketplace/[id]` | Planned | Full details before applying |
| 4 | My Campaigns | `/publisher/campaigns` | Done | Joined campaigns with tracking links |
| 5 | Tracking Links | `/publisher/campaigns/[id]/links` | Partial | Copy link from campaigns page |
| 6 | Leads List | `/publisher/leads` | Done | Own leads with status |
| 7 | Lead Detail | `/publisher/leads/[id]` | Planned | Status, rejection reason |
| 8 | Earnings | `/publisher/earnings` | Done | Period summary |
| 9 | Payout History | `/publisher/payouts` | Done | Past payouts with status |
| 10 | Request Payout | `/publisher/payouts/request` | Done | Amount, Wise/Stripe/bank method + payment details |
| 11 | Payment Settings | `/publisher/settings/payment` | Planned | Wise, bank, Stripe setup |
| 12 | Reports | `/publisher/reports` | Planned | Conversion stats |
| 13 | Support | `/publisher/support` | Done | Ticket list + create |
| 14 | Profile Settings | `/publisher/settings` | Partial | Profile display only |

---

## Public Screens (3)

| # | Screen | Route | Status | Wireframe Notes |
|---|--------|-------|--------|-----------------|
| 1 | Lead Form | `/t/[slug]` | Done | Campaign-branded opt-in form |
| 2 | Campaign Preview | `/p/[slug]` | Planned | Public landing page (Phase 2) |
| 3 | Terms / Privacy | `/terms`, `/privacy` | Planned | Static legal pages |

---

## Screen Priority for Phase 1 Prototypes

Build coded Shadcn prototypes for these screens first:

1. Admin Dashboard
2. Advertiser Dashboard
3. Publisher Dashboard
4. Create Campaign (multi-step)
5. Leads List (advertiser)
6. Public Lead Form
7. Wallet (advertiser)
8. Marketplace (publisher)

---

## Common UI Elements Per Screen

| Element | All Authenticated | Dashboard | List Pages | Detail Pages | Forms |
|---------|-------------------|-----------|------------|--------------|-------|
| Sidebar | ✓ | ✓ | ✓ | ✓ | ✓ |
| Header + Breadcrumb | ✓ | ✓ | ✓ | ✓ | ✓ |
| Page Title + Actions | ✓ | — | ✓ | ✓ | ✓ |
| Stat Cards | — | ✓ | — | Optional | — |
| Charts | — | ✓ | — | Optional | — |
| Data Table | — | Optional | ✓ | — | — |
| Filters Bar | — | — | ✓ | — | — |
| Form Sections | — | — | — | — | ✓ |
| Sticky Save Bar | — | — | — | — | ✓ |
