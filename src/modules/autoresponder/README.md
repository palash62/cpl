# Autoresponder module (`src/modules/autoresponder`)

Advertiser-owned 3rd-party list integrations. Import only from `@/modules/autoresponder`.

## Public API

```ts
import {
  dispatchAutoresponderEvent,
  listConnections,
  createAdvertiserConnection,
  updateAdvertiserConnection,
  deleteAdvertiserConnection,
  testConnection,
  listDeliveries,
} from "@/modules/autoresponder";
```

## Architecture

| Layer | Role |
|-------|------|
| `services/dispatch.service.ts` | Fire on lead events (matches `campaign.advertiserId`) |
| `services/connection.service.ts` | CRUD + encrypt/mask secrets |
| `providers/*.provider.ts` | Webhook, Mailchimp, AWeber, GetResponse |
| `mapping/build-payload.ts` | Lead → standard JSON payload |
| `repositories/` | Prisma access |

## Adding a provider

1. Add enum value in `prisma/schema.prisma` (`AutoresponderProvider`).
2. Create `providers/myprovider.provider.ts`.
3. Register in `providers/registry.ts`.
4. Extend Zod schema in `src/lib/validations.ts`.

## Integration

`lead.service.ts` calls `dispatchAutoresponderEvent` for all non-rejected leads (including opt-in). Do not add provider logic elsewhere.

## Secrets

API keys stored encrypted via `lib/encrypt-secrets.ts` using `INTEGRATION_ENCRYPTION_KEY` (or `AUTH_SECRET`).
