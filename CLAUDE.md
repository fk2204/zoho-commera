# CLAUDE.md

## Project Overview

Programmatic control of **Zoho One** via REST APIs, orchestrated through Claude Code in the terminal. One refresh token, one HTTP client, eleven apps wired up.

This is the API control layer. Business logic — what you actually do with the data — lives in `scripts/` files you (or Claude Code) author.

## Tech Stack

- **Runtime:** Node.js 20+ (ESM)
- **Language:** JavaScript with JSDoc types
- **HTTP:** Built-in `fetch` + custom retry/backoff client
- **Logging:** `pino` with secret redaction
- **Auth:** Zoho OAuth 2.0, Self Client flow — **one token, all apps**

## Apps Wired Up

| App | Module | Base URL | Org ID env var |
|-----|--------|----------|----------------|
| **CRM v8** | `src/crm/` | `www.zohoapis.com/crm/v8` | not needed |
| **Mail** | `src/mail/` | `mail.zoho.com/api` | not needed |
| **WorkDrive** | `src/workdrive/` | `www.zohoapis.com/workdrive/api/v1` | not needed |
| **Cliq** | `src/cliq/` | `cliq.zoho.com/api/v2` | not needed |
| **Sign** | `src/sign/` | `sign.zoho.com/api/v1` | not needed |
| **Books** | `src/books/` | `www.zohoapis.com/books/v3` | `ZOHO_BOOKS_ORG_ID` |
| **Desk** | `src/desk/` | `desk.zoho.com/api/v1` | `ZOHO_DESK_ORG_ID` |
| **Inventory** | `src/inventory/` | `www.zohoapis.com/inventory/v1` | `ZOHO_INVENTORY_ORG_ID` |
| **Projects** | `src/projects/` | `projectsapi.zoho.com/restapi` | `ZOHO_PROJECTS_PORTAL_ID` |
| **People** | `src/people/` | `people.zoho.com/people/api` | not needed |
| **Campaigns** | `src/campaigns/` | `campaigns.zoho.com/api/v1.1` | not needed |

All pinned to the **US data center**. To migrate, edit `BASE_URLS` in `src/config.js`.

## Scope Tiers

Refresh tokens are scope-bound, so pick the smallest tier that fits:

| Preset | Apps | Run with |
|--------|------|----------|
| `--minimal` | CRM + profile | `npm run setup:oauth -- --minimal` |
| **default** | CRM, Mail, WorkDrive, Cliq, Sign | `npm run setup:oauth` |
| `--full` | All 11 apps above | `npm run setup:oauth -- --full` |

If consent fails because your Zoho One plan doesn't include some apps, drop a tier and add scopes piecemeal as you turn on more apps. Adding a tier later means re-running setup to mint a new refresh token.

## Architecture

```
scripts/*.js                       ← Claude Code writes/runs these
        │
        ▼
src/{app}/index.js                 ← per-app helpers (CRUD, etc.)
        │
        ▼
src/client.js: createAppClient()   ← per-app base URL + default headers,
                                     shared auth/retry/backoff
        │
        ▼
src/auth/oauth.js                  ← single refresh token, single-flight
                                     refresh, in-memory access token cache
```

The key insight: **one OAuth refresh token works for every Zoho app** as long as the right scopes were authorized at setup time. `oauth.js` mints access tokens; each app's client wraps `createAppClient()` with the right base URL and any required headers (org ID for Books/Inventory/Desk).

## Where Secrets Live

- **Client ID / Secret** → `.env` (gitignored)
- **Refresh token** → `~/.zoho/tokens.json` (mode 0600, outside the repo)
- **Access token** → in-memory only, never persisted

This split is deliberate: `.env` files leak (committed, screen-shared, `cat`'d). Long-lived refresh tokens belong outside the repo with strict permissions.

## Project Structure

```
.
├── CLAUDE.md
├── README.md
├── .env.example
├── .gitignore
├── package.json
├── src/
│   ├── config.js              # Env, base URLs, getOrgId()
│   ├── client.js              # createAppClient() — per-app HTTP wrapper
│   ├── auth/
│   │   ├── oauth.js           # Token refresh, single-flight mutex
│   │   ├── scopes.js          # Scope catalog + 3 presets
│   │   └── tokenStore.js      # ~/.zoho/tokens.json read/write
│   ├── utils/
│   │   ├── logger.js          # pino with redaction
│   │   ├── errors.js          # Typed error classes
│   │   └── confirm.js         # Interactive y/N
│   ├── crm/                   # CRM v8 — records, coql, bulk, metadata, users
│   ├── mail/                  # Send, search, folders
│   ├── workdrive/             # Files, folders, teams
│   ├── cliq/                  # Channel + DM messaging
│   ├── sign/                  # Documents, templates
│   ├── books/                 # Invoices, contacts, items, bills, expenses
│   ├── desk/                  # Tickets, contacts, agents
│   ├── inventory/             # Items, stock, sales orders
│   ├── projects/              # Portals, projects, tasks
│   ├── people/                # Employees, attendance, leave
│   ├── campaigns/             # Campaigns, lists, subscribers
│   └── one/profile.js         # User profile from accounts.zoho.com
└── scripts/
    ├── setup-oauth.js         # One-time, choose --minimal | --core | --full
    ├── test-connection.js     # Probes every configured app
    └── refresh-token.js       # Force a fresh access token (debug)
```

## Common Commands

```bash
npm install
npm run setup:oauth               # one-time, default = CORE preset
npm run setup:oauth -- --minimal  # just CRM + profile
npm run setup:oauth -- --full     # all 11 apps
npm run test:connection           # probes all configured apps
npm run refresh-token             # debug auth
node scripts/<your-script>.js
```

## Key Documentation

Read these before building anything CRM-related:

| File | Read When |
|------|-----------|
| `BUSINESS_LOGIC.md` | Building any automation — defines exact rules and formulas |
| `DATA_MODEL.md` | Working with multiple modules — defines relationships and field mappings |
| `ZOHO_LIMITATIONS.md` | Starting any new task — defines what the API cannot do |
| `ARCHITECTURE.md` | Building automation scripts — defines structure, build protocol, decision framework |

---

## Automation Approach

**All automation is Node.js scripts on this machine calling the Zoho CRM REST API.**

- No Deluge functions
- No Zoho UI clicks for automation
- No webhooks, no external servers
- Polling-based: query records modified since last run
- State tracked in `.automation-state.json`

---

## Rules — What Claude Code Must and Must Not Do

### Before writing any code:
1. Read `BUSINESS_LOGIC.md` — if the logic isn't there, ask the user before inventing it
2. Read `DATA_MODEL.md` — confirm field names and relationships
3. Check `ZOHO_LIMITATIONS.md` — confirm the API can actually do what you're about to build
4. Verify field names with `metadata.listFields(module)` — never assume a field name

### Build protocol (no exceptions):
1. **VERIFY** — check fields, check limitations
2. **QUERY FIRST** — run read-only query, log results, confirm data looks right
3. **DRY RUN** — `DRY_RUN=true`, review output
4. **ONE RECORD** — run on single test record, read it back to confirm write worked
5. **BATCH** — only after step 4 succeeds

### Hard rules:
- **Never assume a field is writable** — check `read_only` flag from `metadata.listFields()`
- **Never create a record without checking if it already exists** — idempotency is mandatory
- **Never run batch writes without a dry run first**
- **Never call `getAccessToken()` inside a loop** — one token per script run
- **Never make architectural decisions alone** — state options, ask user
- **Never assume CRM data matches local docs** — CRM is always the source of truth
- **Never build what isn't in `BUSINESS_LOGIC.md`** without asking first
- **Never suggest Deluge, Zoho UI automation, or webhooks** for this project

### When something unexpected happens:
- API returns an error not in `ZOHO_LIMITATIONS.md` → stop, report to user, do not guess
- Field doesn't exist on a module → verify with `metadata.listFields()`, do not assume typo
- CRM data doesn't match `DATA_MODEL.md` → report discrepancy, ask before proceeding
- Step produces 0 results when records were expected → log and report, do not silently pass

---

## Conventions for Claude Code

When working in this repo, Claude Code should:

1. **Read this file plus the relevant `src/{app}/index.js` first.** Each app has different conventions (Books uses `organization_id` query param; Desk uses `orgId` header). The helpers handle that — don't reinvent.
2. **Use the helpers, not raw fetch.** `src/{app}/index.js` is the contract.
3. **For CRM schema discovery, call `metadata.listFields(module)`.** Don't guess at field names — ask CRM what they are.
4. **Prefer COQL** (`crm.coql.query`) for filtered CRM reads. Single API credit regardless of records scanned.
5. **Bulk API** (`crm.bulk.bulkRead`) for >100 CRM records.
6. **Confirm destructive ops.** All `delete`/`remove`/`removeMany` helpers prompt unless `--yes` is passed.
7. **Surface Zoho error codes verbatim** (`INVALID_DATA`, `MANDATORY_NOT_FOUND`, `DUPLICATE_DATA`, `RATE_LIMIT_EXCEEDED`, `OAUTH_SCOPE_MISMATCH`).
8. **Use `DRY_RUN=true`** when testing destructive scripts. All write/delete helpers respect it and only log to `audit.log`.
9. **For new app integrations not yet covered**, follow the pattern in `src/cliq/index.js` — minimal: import `createAppClient`, define a base URL, add helper functions.

## Adding a New App or Endpoint

The pattern is short:

1. If new app: add base URL to `BASE_URLS` in `src/config.js`, add scopes to `src/auth/scopes.js`, re-run `setup:oauth`.
2. Create `src/{app}/index.js`:
   ```js
   import { createAppClient } from '../client.js';
   import { BASE_URLS } from '../config.js';
   const client = createAppClient({
     baseUrl: BASE_URLS.myapp,
     defaultHeaders: () => ({ /* if needed */ }),
   });
   export async function listThings() { return await client.request('/things'); }
   ```

Or just ask Claude Code: "Add a function to list all open Desk tickets older than 7 days."

## Rate Limits

Zoho's quota varies by app and edition. Rough guidelines:

- **CRM**: 200–10,000 calls/day per user, plus per-org cap. COQL = 1 credit per call.
- **Books / Inventory**: ~1,000 calls/day on basic plans.
- **Desk**: 200 calls/min concurrent.
- **Cliq**: 10–30 req/min per user depending on endpoint.

The HTTP client does exponential backoff with jitter on `429` and Zoho code `4820`. For bulk work, use the bulk read API (CRM) or batch operations.

## References

- API console: https://api-console.zoho.com
- CRM v8: https://www.zoho.com/crm/developer/docs/api/v8/
- Books v3: https://www.zoho.com/books/api/v3/
- Desk: https://desk.zoho.com/DeskAPIDocument
- Cliq v2: https://www.zoho.com/cliq/help/restapi/v2/
- Projects v3: https://projects.zoho.com/api-docs
- Inventory: https://www.zoho.com/inventory/api/v1/
- WorkDrive: https://workdrive.zoho.com/apidocs/v1
- Sign: https://www.zoho.com/sign/api/
- People: https://www.zoho.com/people/api/
- Mail: https://www.zoho.com/mail/help/api/
- Campaigns: https://www.zoho.com/campaigns/help/developers/
- OAuth: https://www.zoho.com/accounts/protocol/oauth/

## Security Notes

- `~/.zoho/tokens.json` is created with mode 0600. Don't `chmod` it more permissive.
- The refresh token grants the listed scopes for as long as it exists. **Revoke** at https://accounts.zoho.com/home#sessions/userauthtoken if it leaks.
- `.gitignore` blocks `.env`, `*.log`, and `tokens.json`. Don't add exceptions.
- `audit.log` records all write/delete operations across all apps. Gitignored.
- For production / CI, replace `tokenStore.js`'s file backend with a secret manager (AWS Secrets Manager, Vault, etc.) — the interface is `read/write/clear`.
- The single-flight mutex in `oauth.js` prevents simultaneous refresh races. Don't disable it.
- The 401-retry-once pattern in `client.js` prevents auth-loop hammering. Don't make it loop.
