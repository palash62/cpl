# Visual Landing Page Builder

Craft.js-based visual landing page builder for advertisers. Runs in parallel with simple Opt-in Pages (`/o/{slug}`).

## Routes

| Route | Purpose |
|-------|---------|
| `/advertiser/landing-pages` | Gallery — list, create, duplicate |
| `/advertiser/landing-pages/new` | Pick template |
| `/advertiser/landing-pages/[id]/edit` | Full-screen builder |
| `/advertiser/landing-pages/[id]/preview` | Draft preview |
| `/p/{slug}` | Public published page |

## API

- `GET/POST /api/v1/advertiser/landing-pages`
- `GET/PATCH/DELETE /api/v1/advertiser/landing-pages/[id]`
- `POST /api/v1/advertiser/landing-pages/[id]/publish`
- `GET /api/v1/advertiser/landing-pages/[id]/versions`
- `POST /api/v1/advertiser/landing-pages/[id]/versions/[versionId]/restore`
- `POST /api/v1/advertiser/landing-pages/[id]/duplicate`
- `GET/POST /api/v1/advertiser/landing-pages/templates`
- `POST /api/v1/advertiser/landing-pages/[id]/assets`
- `POST /api/v1/leads/submit-landing`

## Storage

Page structure is stored as Craft.js serialized JSON in `landing_pages.craft_state`. No HTML is persisted.

- `theme_json` — global theme tokens (colors, fonts, button style)
- `form_json` — denormalized form schema extracted from LeadForm blocks on save
- `landing_page_versions` — publish snapshots and version history

## JSON schema version

`meta.schemaVersion: 1` in the craft envelope. Migrations bump this when block props change.

## Security

- `HtmlBlock` content sanitized via DOMPurify
- `EmbedCode` restricted to iframe allowlist
- `CustomCss` scoped under page root id
- Lead submit validates against published `form_json` snapshot

## Future extension points

- `LandingPageVariant` — A/B testing (Phase 3 hook in `publish.service.ts`)
- `PageAnalyticsEvent` — heatmaps/analytics
- AI generation via `craftState` import API
