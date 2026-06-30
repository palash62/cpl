# Fraud module (`src/modules/fraud`)

Isolated lead fraud detection package. Application code should import only from `@/modules/fraud` — not from internal paths.

## Public API

```ts
import {
  evaluateLead,
  getFraudConfig,
  updateFraudConfig,
  getFraudDashboardMetrics,
  listHighRiskLeads,
  listBlocklistIps,
  addBlocklistIp,
  removeBlocklistIp,
  refreshPublisherQuality,
  checkCampaignQualityAlert,
  collectSubmissionSignals,
  createSignalCollector,
  attachSignalListeners,
} from "@/modules/fraud";
```

## Architecture

| Layer | Role |
|-------|------|
| `services/evaluate.service.ts` | Orchestrator — single entry for submit pipeline |
| `rules/*.rule.ts` | Individual fraud checks |
| `scoring/` | Aggregate risk + decision thresholds |
| `providers/` | Optional IPinfo / email API adapters |
| `repositories/` | Prisma access for blocklist, duplicates, quality |
| `client/collect-signals.ts` | Browser behavioral collector |

## Adding a rule

1. Create `rules/my-rule.rule.ts` implementing the rule function.
2. Register it in `rules/index.ts`.
3. Add weight + `enabledRules` key in `config/defaults.ts`.

## Configuration

Stored in `platform_settings` under key `fraud_config`. Loaded via `getFraudConfig()`.

Environment:

- `FRAUD_IP_API_KEY` — optional IPinfo token
- `FRAUD_EMAIL_API_KEY` — optional email validation API key

## Dependency boundaries

- Module may import `@/lib/prisma` and `@/services/notify.service` for alerts.
- Rest of app must not import `rules/`, `repositories/`, or `providers/` directly.
- `lead.service.ts` is the only submit integration point.

## Tests

Unit tests live in `src/modules/fraud/__tests__/`.
