# LeadFlow CPL Platform

A premium, enterprise-ready **Cost Per Lead (CPL)** marketplace connecting Advertisers with Publishers. LeadFlow validates leads, tracks performance, manages wallets/payouts, and delivers actionable reporting.

**Product name:** LeadFlow CPL Platform

## Roles

| Role | Description |
|------|-------------|
| **Admin** | Platform operator — users, campaigns, leads, payouts, settings |
| **Advertiser** | Lead buyer — creates campaigns, funds wallet, reviews leads |
| **Publisher** | Lead generator — promotes campaigns, earns per approved lead |

## AI Guardrails

Development follows a structured 7-phase process. Before implementing features, review:

| File | Purpose |
|------|---------|
| [`.cursor/rules/guardrail.md`](.cursor/rules/guardrail.md) | 8-step feature workflow — no code before approval |
| [`.cursor/rules/skill.md`](.cursor/rules/skill.md) | Product context, modules, stack, design tokens |

## Monorepo Structure

This project is split into two deployable services on one server:

| Domain | App | Port | Package |
|--------|-----|------|---------|
| **leadvix.io** | Main Platform | 3000 | `apps/platform` |
| **leadgenlink.site** | Tracking Service | 3001 | `apps/tracking` |

Shared packages: `packages/database`, `packages/shared`, `packages/tracking-core`

See [docs/SERVICE-ARCHITECTURE.md](docs/SERVICE-ARCHITECTURE.md) and [docs/DEPLOYMENT-4GB.md](docs/DEPLOYMENT-4GB.md) for deployment on a 4GB RAM EC2 instance.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| UI Components | Shadcn UI |
| Icons | Lucide React |
| Font | Inter |
| Database | **MySQL 8+** |
| ORM | Prisma |
| Auth | NextAuth.js v5 |
| Charts | Recharts |
| Hosting | **GoDaddy VPS** (Nginx + PM2) |
| Testing | Vitest + Playwright |

## Prerequisites

- Node.js 20+
- MySQL 8+
- npm

## Quick Start

```bash
npm install
cp .env.example apps/platform/.env
cp .env.example apps/tracking/.env
# Set DATABASE_URL, AUTH_SECRET, INTERNAL_SERVICE_TOKEN in both .env files

npm run db:push
npm run db:seed

# Development (both services)
npm run dev:platform   # http://localhost:3000 — leadvix.io
npm run dev:tracking   # http://localhost:3001 — leadgenlink.site
```

Open [http://localhost:3000](http://localhost:3000) (platform)

**Demo lead form:** [http://localhost:3001/t/demo-link](http://localhost:3001/t/demo-link) (tracking)

### Seed Users

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@cpl.local | password123 |
| Advertiser | advertiser@cpl.local | password123 |
| Publisher | publisher@cpl.local | password123 |

## Environment Variables

```env
DATABASE_URL="mysql://root:password@localhost:3306/cpl"
AUTH_SECRET="your-secret-key-min-32-characters"
AUTH_URL="http://localhost:3000"
```

## Documentation

| Document | Description |
|----------|-------------|
| [PRD](docs/PRD.md) | Product requirements, 7-phase methodology, workflows |
| [Design System](docs/DESIGN-SYSTEM.md) | Colors, typography, components |
| [Database Schema](docs/DATABASE-SCHEMA.md) | MySQL entities, Offer mapping |
| [API Spec](docs/API-SPEC.md) | Endpoints, auth, implementation status |
| [Screens](docs/SCREENS.md) | 61 screens with routes and status |
| [Deployment](docs/DEPLOYMENT.md) | GoDaddy VPS — Nginx, PM2, MySQL, SSL |
| [4GB EC2 Deployment](docs/DEPLOYMENT-4GB.md) | Low-memory dual-service setup |
| [Service Architecture](docs/SERVICE-ARCHITECTURE.md) | Platform vs tracking split |
| [Testing Strategy](docs/TESTING-STRATEGY.md) | Unit, integration, E2E, CI |
| [Stakeholder Review](docs/STAKEHOLDER-REVIEW.md) | Sign-off checklist |

## Project Structure

```
cpl/
├── apps/
│   ├── platform/          # leadvix.io — admin, advertiser, publisher, API
│   └── tracking/          # leadgenlink.site — clicks, redirects, pixel, postback
├── packages/
│   ├── database/          # Prisma schema + client
│   ├── shared/            # URL builders, env helpers
│   └── tracking-core/     # Click logging, pixel, geo lookup
├── deploy/
│   ├── nginx/             # Virtual hosts per domain
│   ├── setup-swap.sh      # 1GB swap for 4GB servers
│   └── build-low-memory.sh
├── docs/
└── ecosystem.config.js    # PM2 — both services
```

## Scripts

```bash
npm run dev              # Development server
npm run build            # Production build
npm run start            # Production server (PM2 on VPS)
npm run lint             # ESLint
npm run typecheck        # TypeScript check
npm run test:unit        # Vitest unit tests
npm run test:e2e         # Playwright E2E tests
npm run test:smoke       # Production login smoke tests
npm run db:push          # Push schema to MySQL
npm run db:seed          # Seed database
```

## Design

Premium SaaS aesthetic inspired by HubSpot CRM and Stripe Dashboard.

- **Primary:** `#2563EB` (Blue)
- **Secondary:** `#14B8A6` (Teal)
- **Background:** `#F8FAFC`
- **Font:** Inter

## Development Phases

| Phase | Focus | Status |
|-------|-------|--------|
| 1 — Discovery | Gaps, open questions | Done |
| 2 — Planning | Docs, guardrails | Done |
| 3 — Architecture | Layered app, VPS model | Done |
| 4 — Database | MySQL entities | Done |
| 5 — UI/UX | Design system, screens | Done |
| 6 — API Design | REST modules | Done |
| 7 — Implementation | Stubs, finance, deploy | In progress |

## License

Proprietary — All rights reserved.
