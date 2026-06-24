# CPL Platform — Testing Strategy

**Version:** 1.0

---

## Testing Pyramid

| Layer | Tool | Coverage Target | Scope |
|-------|------|-----------------|-------|
| Unit | Vitest | 80%+ on services | Validation rules, ledger math, utilities |
| Integration | Vitest + test DB | API routes | Prisma queries, auth middleware |
| E2E | Playwright | Critical flows | Full user journeys per role |
| Visual | Chromatic / Percy | Key screens | Dashboard, forms (Phase 1) |
| Load | k6 | Lead endpoint | 1K leads/hour target |

---

## Unit Tests

### Location: `tests/unit/`

| Module | Test File | Key Cases |
|--------|-----------|-----------|
| Lead Validation | `validation.test.ts` | Email format, phone format, duplicate detection, honeypot, geo mismatch |
| Wallet Ledger | `wallet.test.ts` | Credit/debit balance, hold release, insufficient funds |
| Campaign | `campaign.test.ts` | Budget cap checks, daily/monthly limits, auto-pause |
| Payout | `payout.test.ts` | Min threshold, idempotency, available balance |
| Auth | `auth.test.ts` | Password hash, role checks, token expiry |
| Errors | `errors.test.ts` | Error code mapping, envelope format |

### Example: Ledger Integrity

```typescript
// Every debit must have matching credits
// balance_after must equal previous balance +/- amount
// Concurrent transactions must not cause negative balance
```

---

## Integration Tests

### Location: `tests/integration/`

Uses test MySQL database (Docker or `DATABASE_URL_TEST`).

| Suite | Endpoints | Cases |
|-------|-----------|-------|
| Auth Flow | register, login | Happy path, duplicate email, invalid credentials |
| Campaign CRUD | campaigns/* | Create, update, pause, role restrictions |
| Lead Lifecycle | leads/* | Submit → validate → approve → wallet movement |
| Wallet | wallet/* | Deposit, debit on approval, balance queries |
| Payout | payouts/* | Request, approve, reject, idempotency |
| Permissions | all | Advertiser cannot access admin routes |

### Test Database Setup

```bash
# Before integration tests
DATABASE_URL=$DATABASE_URL_TEST npx prisma migrate deploy
DATABASE_URL=$DATABASE_URL_TEST npx prisma db seed
```

---

## E2E Tests (Playwright)

### Location: `tests/e2e/`

### Critical Flows

#### Flow 1: Advertiser Journey
1. Register as advertiser
2. Admin approves user (or seed active user)
3. Fund wallet via deposit
4. Create campaign with fields and budget
5. Activate campaign
6. View campaign in list
7. Receive and view lead

#### Flow 2: Publisher Journey
1. Register as publisher
2. Browse marketplace
3. Request campaign access
4. Get tracking link (after approval)
5. Submit lead via public form
6. View lead in publisher dashboard
7. See earnings updated

#### Flow 3: Admin Payout
1. Login as admin
2. Navigate to payouts queue
3. Approve pending payout
4. Verify publisher wallet debited
5. Verify payout status completed

#### Flow 4: Error — Duplicate Lead
1. Submit lead with email X
2. Submit same email again
3. Verify rejection with LEAD_DUPLICATE message

#### Flow 5: Error — Budget Exhausted
1. Create campaign with $10 budget, $5 CPL
2. Approve 2 leads
3. Verify campaign auto-paused
4. Verify new lead submission blocked

### E2E Configuration

```typescript
// playwright.config.ts
// - Base URL: http://localhost:3000
// - Retries: 2 on CI
// - Screenshots on failure
// - Video on first retry
```

---

## Phase-Specific Test Gates

| Phase | Gate | Tests Required |
|-------|------|----------------|
| 0 | Foundation | Layout renders per role; responsive sidebar; 404/403 pages |
| 1 | Design | Visual regression; axe accessibility audit; mobile responsive |
| 2 | Core | Validation unit tests; lead lifecycle integration; API error envelope |
| 3 | Finance | Ledger integrity; concurrent transactions; insufficient funds |
| 4 | Ops | Report accuracy; notification delivery; ticket permissions |
| 5 | Launch | Full E2E suite in CI; staging smoke tests; security scan |

---

## Error Handling Matrix

| Area | Error | User Message | System Action | Test |
|------|-------|-------------|---------------|------|
| Auth | Invalid credentials | "Invalid email or password" | Rate limit after 5 attempts | integration |
| Auth | Expired token | "Session expired, please log in" | Redirect to login | e2e |
| Campaign | Budget exceeded | "Campaign paused — budget exhausted" | Auto-pause + email | integration + e2e |
| Lead | Duplicate | "This lead has already been submitted" | Reject with LEAD_DUPLICATE | unit + e2e |
| Lead | Validation fail | Field-level errors | Reject with details | unit |
| Wallet | Insufficient funds | "Please add funds to continue" | Block lead approval | integration |
| Payout | Below minimum | "Minimum payout is $50" | Disable submit | unit + e2e |
| API | 500 | "Something went wrong" | Log to Sentry, return requestId | integration |
| Form | Network error | "Connection lost, retrying..." | Optimistic retry × 3 | e2e |

---

## CI Pipeline

```
Push/PR
  → ESLint
  → TypeScript check (tsc --noEmit)
  → Unit Tests (Vitest)
  → Integration Tests (Vitest + test DB)
  → Build (next build)
  → E2E Tests (Playwright on staging)
  → Deploy (on main only)
```

### GitHub Actions Workflow

```yaml
name: CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    services:
      mysql:
        image: mysql:8
        env:
          MYSQL_ROOT_PASSWORD: test
          MYSQL_DATABASE: cpl_test
        ports: ['3306:3306']
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npm run lint
      - run: npm run typecheck
      - run: npm run test:unit
      - run: npm run test:integration
      - run: npm run build
      - run: npm run test:e2e
```

---

## Security Testing (Phase 5)

| Check | Tool | Frequency |
|-------|------|-----------|
| OWASP Top 10 | Manual + OWASP ZAP | Pre-launch |
| Dependency audit | `npm audit` | Every CI run |
| Rate limiting | k6 / manual | Pre-launch |
| PII encryption | Code review | Pre-launch |
| RBAC bypass | Integration tests | Every CI run |
| SQL injection | Prisma parameterized queries | Code review |
| XSS | React escaping + CSP headers | Code review |

---

## Performance Testing

| Endpoint | Target | Tool |
|----------|--------|------|
| Dashboard API | p95 < 300ms | k6 |
| Lead submit | 1K/hour sustained | k6 |
| Lead list (paginated) | p95 < 200ms | k6 |

---

## Monitoring (Production)

| Tool | Purpose |
|------|---------|
| Sentry | Error tracking, request IDs |
| Vercel Analytics | Web vitals |
| Custom metrics | Lead volume, approval rate, payout queue depth |

---

## Test Data & Seeding

`prisma/seed.ts` creates:

| Entity | Details |
|--------|---------|
| Admin | admin@cpl.local / password |
| Advertiser | advertiser@cpl.local / password, $1000 wallet |
| Publisher | publisher@cpl.local / password |
| Campaign | Active, $25 CPL, $500 budget |
| Tracking Link | For publisher + campaign |
| Sample Leads | 5 leads in various statuses |

---

## Commands

```bash
npm run test              # All unit tests
npm run test:unit         # Unit only
npm run test:integration  # Integration with test DB
npm run test:e2e          # Playwright E2E
npm run test:coverage     # Coverage report
```
