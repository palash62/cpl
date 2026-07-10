# LeadFlow CPL Platform — API Specification

**Base URL:** `/api/v1`  
**Auth:** NextAuth session cookie  
**Content-Type:** `application/json`

## Implementation Status

| Module | Status | Notes |
|--------|--------|-------|
| Auth (register, session) | Done | NextAuth v5 |
| Campaigns | Done | CRUD, pause |
| Marketplace | Done | Join, tracking links |
| Leads | Done | Submit, list, approve/reject |
| Wallet | Partial | Mock deposit on VPS MVP |
| Payouts | Done | Request, approve, reject |
| Reports | Done | Dashboard stats |
| Notifications | Done | List, mark-read |
| Support | Done | Tickets CRUD |
| Admin Users | Done | List, status update |
| Admin Settings | Done | Platform fee, min payout |
| Admin Audit Log | Done | Read-only list |
| Search | Planned | Global search |

---

## Authentication

All protected endpoints require `Authorization: Bearer <token>` or valid NextAuth session cookie.

### Role Middleware

| Role | Access |
|------|--------|
| ADMIN | All endpoints |
| ADVERTISER | Own campaigns, leads, wallet |
| PUBLISHER | Marketplace, own leads, earnings, payouts |
| PUBLIC | Lead submit, tracking redirect only |

---

## Error Response Standard

```json
{
  "error": {
    "code": "LEAD_DUPLICATE",
    "message": "A lead with this email already exists for this campaign.",
    "field": "email",
    "status": 422,
    "requestId": "req_abc123"
  }
}
```

### Error Code Categories

| Prefix | Examples |
|--------|----------|
| `AUTH_*` | AUTH_INVALID_CREDENTIALS, AUTH_EXPIRED_TOKEN, AUTH_FORBIDDEN |
| `VALIDATION_*` | VALIDATION_REQUIRED, VALIDATION_INVALID_EMAIL |
| `CAMPAIGN_*` | CAMPAIGN_NOT_FOUND, CAMPAIGN_BUDGET_EXCEEDED, CAMPAIGN_PAUSED |
| `LEAD_*` | LEAD_DUPLICATE, LEAD_VALIDATION_FAILED, LEAD_NOT_FOUND |
| `WALLET_*` | WALLET_INSUFFICIENT_FUNDS, WALLET_NOT_FOUND |
| `PAYOUT_*` | PAYOUT_BELOW_MINIMUM, PAYOUT_DUPLICATE_REQUEST |
| `PERMISSION_*` | PERMISSION_DENIED |

### HTTP Status Codes

| Code | Usage |
|------|-------|
| 200 | Success |
| 201 | Created |
| 400 | Bad request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not found |
| 422 | Validation error |
| 429 | Rate limited |
| 500 | Internal error |

---

## Auth Module

### POST `/api/v1/auth/register`

Register a new user.

**Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "name": "John Doe",
  "role": "ADVERTISER"
}
```

**Response (201):**
```json
{
  "user": { "id": "...", "email": "...", "role": "ADVERTISER", "status": "PENDING" }
}
```

### POST `/api/v1/auth/login`

**Body:** `{ "email": "...", "password": "..." }`

**Response (200):** `{ "token": "...", "user": { ... } }`

### POST `/api/v1/auth/forgot-password`

**Body:** `{ "email": "..." }`

### POST `/api/v1/auth/reset-password`

**Body:** `{ "token": "...", "password": "..." }`

### POST `/api/v1/auth/verify-email`

**Body:** `{ "token": "..." }`

---

## Users Module

### GET `/api/v1/users/me`

Current user profile.

### PATCH `/api/v1/users/me`

Update profile.

### GET `/api/v1/users` (Admin)

List users. Query: `role`, `status`, `page`, `limit`

### GET `/api/v1/users/:id` (Admin)

User detail with profile.

### PATCH `/api/v1/users/:id/status` (Admin)

**Body:** `{ "status": "ACTIVE" | "SUSPENDED" }`

### POST `/api/v1/users/kyc` (Publisher)

Submit KYC documents.

---

## Campaigns Module

### GET `/api/v1/campaigns`

List campaigns (scoped by role).

**Query:** `status`, `category`, `page`, `limit`

### POST `/api/v1/campaigns` (Advertiser)

**Body:**
```json
{
  "name": "Finance Leads Q2",
  "category": "FINANCE",
  "cpl": 25.00,
  "budget": 5000.00,
  "dailyCap": 50,
  "monthlyCap": 500,
  "publisherAccess": "APPROVAL_REQUIRED",
  "autoApprove": false,
  "targeting": { "countries": ["US", "CA"] },
  "fields": [
    { "fieldName": "first_name", "label": "First Name", "fieldType": "text", "required": true }
  ]
}
```

### GET `/api/v1/campaigns/:id`

Campaign detail.

### PATCH `/api/v1/campaigns/:id`

Update campaign.

### POST `/api/v1/campaigns/:id/pause`

### POST `/api/v1/campaigns/:id/resume`

### POST `/api/v1/campaigns/:id/duplicate`

### POST `/api/v1/campaigns/:id/join` (Publisher)

Request access to campaign.

### PATCH `/api/v1/campaigns/:id/publishers/:publisherId` (Advertiser/Admin)

Approve/reject publisher access.

**Body:** `{ "status": "APPROVED" | "REJECTED" }`

---

## Tracking Module

### GET `/t/:slug` (Public)

Redirect to lead form. Logs click. Sets attribution cookie.

### POST `/api/v1/tracking/beacon`

Click beacon for JS embed.

**Body:** `{ "slug": "...", "referrer": "..." }`

### GET `/api/v1/tracking/links` (Publisher)

List own tracking links.

### POST `/api/v1/tracking/links` (Publisher)

**Body:** `{ "campaignId": "..." }`

**Response:** `{ "slug": "...", "url": "https://...", "embedCode": "..." }`

---

## Leads Module

### POST `/api/v1/leads/submit` (Public)

Submit lead from opt-in form.

**Body:**
```json
{
  "slug": "tracking-slug",
  "data": {
    "first_name": "Jane",
    "email": "jane@example.com",
    "phone": "+15551234567"
  },
  "honeypot": ""
}
```

**Response (201):**
```json
{
  "lead": { "id": "...", "status": "VALIDATING" }
}
```

### GET `/api/v1/leads`

List leads (scoped by role).

**Query:** `status`, `campaignId`, `publisherId`, `from`, `to`, `page`, `limit`

### GET `/api/v1/leads/:id`

Lead detail with validation results and history.

### PATCH `/api/v1/leads/:id/status`

**Body:** `{ "status": "APPROVED" | "REJECTED", "reason": "..." }`

### POST `/api/v1/leads/bulk-update`

**Body:** `{ "leadIds": ["..."], "status": "APPROVED" | "REJECTED", "reason": "..." }`

### GET `/api/v1/leads/export`

**Query:** `format=csv`, `campaignId`, `from`, `to`, `fields`

Returns CSV file download.

---

## Validation Module (Internal)

### POST `/api/v1/validation/run` (Internal/Admin)

Re-run validation on a lead.

### GET `/api/v1/validation/rules` (Admin)

List configurable validation rules.

---

## Wallet Module

### GET `/api/v1/wallet`

Current user wallet balance.

**Response:**
```json
{
  "balance": 1250.00,
  "holdBalance": 50.00,
  "availableBalance": 1200.00,
  "currency": "USD"
}
```

### GET `/api/v1/wallet/transactions`

**Query:** `from`, `to`, `type`, `page`, `limit`

### POST `/api/v1/wallet/deposit` (Advertiser)

**Body:** `{ "amount": 500.00 }`

**Response:** `{ "clientSecret": "stripe_pi_...", "depositId": "..." }`

### POST `/api/v1/wallet/deposit/confirm` (Advertiser)

**Body:** `{ "depositId": "...", "paymentIntentId": "..." }`

### POST `/api/v1/wallet/adjust` (Admin)

**Body:** `{ "userId": "...", "amount": 100.00, "type": "CREDIT", "reason": "..." }`

---

## Payouts Module

### GET `/api/v1/payouts`

List payouts (scoped by role).

### POST `/api/v1/payouts/request` (Publisher)

**Body:**
```json
{
  "amount": 150.00,
  "method": "WISE",
  "paymentDetails": { "email": "publisher@example.com" },
  "idempotencyKey": "unique-key-123"
}
```

Supported methods: `WISE`, `STRIPE_CONNECT` (email in `paymentDetails`), `BANK_TRANSFER` (country-specific bank fields in `paymentDetails`).

### PATCH `/api/v1/payouts/:id/approve` (Admin)

### PATCH `/api/v1/payouts/:id/reject` (Admin)

**Body:** `{ "reason": "..." }`

### PATCH `/api/v1/payouts/:id/process` (Admin)

Mark as processing/completed after external transfer.

---

## Reports Module

### GET `/api/v1/reports/dashboard`

Role-specific dashboard stats.

**Query:** `from`, `to`

**Response (Advertiser example):**
```json
{
  "activeCampaigns": 3,
  "totalLeads": 450,
  "approvedLeads": 380,
  "rejectedLeads": 70,
  "avgCpl": 24.50,
  "totalSpend": 9310.00,
  "leadsTrend": [{ "date": "2026-06-01", "count": 15 }],
  "campaignPerformance": [{ "name": "...", "leads": 120, "approved": 100 }]
}
```

### GET `/api/v1/reports/export`

**Query:** `type=leads|campaigns|financial`, `format=csv`, `from`, `to`

---

## Notifications Module

### GET `/api/v1/notifications`

**Query:** `unreadOnly`, `page`, `limit`

### PATCH `/api/v1/notifications/:id/read`

### POST `/api/v1/notifications/read-all`

---

## Support Module

### GET `/api/v1/support/tickets`

### POST `/api/v1/support/tickets`

**Body:** `{ "subject": "...", "category": "BILLING", "body": "..." }`

### GET `/api/v1/support/tickets/:id`

### POST `/api/v1/support/tickets/:id/messages`

**Body:** `{ "body": "...", "isInternal": false }`

### PATCH `/api/v1/support/tickets/:id` (Admin)

**Body:** `{ "status": "...", "priority": "...", "assignedTo": "..." }`

---

## Admin Module

### GET `/api/v1/admin/users`

**Query:** `role`, `status`, `page`, `limit`  
**Status:** Implemented

### PATCH `/api/v1/admin/users`

**Body:** `{ "userId": "...", "status": "ACTIVE|SUSPENDED" }`  
**Status:** Implemented

### POST `/api/v1/admin/wallet/adjust`

**Body:** `{ "userId": "...", "amount": 100, "type": "CREDIT|DEBIT", "reason": "..." }`  
**Status:** Implemented

### GET `/api/v1/admin/audit-log`

**Query:** `actorId`, `entityType`, `from`, `to`, `page`, `limit`

### GET `/api/v1/admin/settings`

### PATCH `/api/v1/admin/settings`

**Body:** `{ "platformFeePercent": 10, "minPayoutAmount": 50 }`

### GET `/api/v1/admin/stats`

Platform-wide statistics for admin dashboard.

---

## Search Module

### GET `/api/v1/search`

**Query:** `q`, `type=campaigns|leads|users`, `limit`

---

## Webhooks Module (Phase 2)

### GET/POST/PATCH/DELETE `/api/v1/webhooks`

CRUD webhook endpoints.

### POST `/api/v1/webhooks/:id/test`

Send test payload.

---

## Rate Limiting

| Endpoint | Limit |
|----------|-------|
| `/api/v1/auth/login` | 5 req/min per IP |
| `/api/v1/leads/submit` | 10 req/min per IP |
| `/api/v1/*` (authenticated) | 100 req/min per user |

---

## Pagination Standard

**Query:** `page` (default 1), `limit` (default 20, max 100)

**Response meta:**
```json
{
  "data": [...],
  "meta": { "page": 1, "limit": 20, "total": 150, "totalPages": 8 }
}
```
