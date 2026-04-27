# zoho-claude

Programmatic control of Zoho One via Claude Code. CRM, Mail, WorkDrive, Cliq, Sign, Books, Desk, Inventory, Projects, People, Campaigns — eleven apps, one refresh token.

## Quick Start

### 1. Install

```bash
npm install
```

Requires Node.js 20 or newer.

### 2. Create a Self Client in Zoho

1. Go to https://api-console.zoho.com
2. **Add Client** → **Self Client** → **Create**
3. Note the **Client ID** and **Client Secret**

### 3. Configure environment

```bash
cp .env.example .env
```

Edit `.env`:

- **Required**: `ZOHO_CLIENT_ID`, `ZOHO_CLIENT_SECRET`
- **Per-app org IDs**: fill in only for apps you'll use. See `.env.example` for where to find each.

### 4. Generate an authorization code

Pick a scope tier:

```bash
npm run setup:oauth              # CORE: CRM, Mail, WorkDrive, Cliq, Sign  (recommended start)
npm run setup:oauth -- --minimal # just CRM + profile
npm run setup:oauth -- --full    # adds Books, Desk, Projects, People, Inventory, Campaigns
```

The script prints the exact scope string to paste into the API console's "Generate Code" tab. Refresh token gets stored at `~/.zoho/tokens.json` (mode 0600, outside the repo).

If consent fails because your Zoho One plan doesn't include all the apps in a given tier, drop down a tier and add scopes piecemeal as you enable apps.

### 5. Verify

```bash
npm run test:connection
```

Probes every app and reports which work / which need setup. Apps without an org ID in `.env` are skipped (not failed). Apps with missing scopes will report `OAUTH_SCOPE_MISMATCH` — re-run setup with a higher tier.

## Using With Claude Code

```bash
cd zoho-claude
claude
```

Claude Code reads `CLAUDE.md` automatically.

## Security

- Refresh token at `~/.zoho/tokens.json` (mode 0600), **not** in `.env`.
- Client ID/Secret in `.env` (gitignored).
- Write operations across all apps logged to `audit.log` (gitignored).
- Set `DRY_RUN=true` in `.env` to log writes without executing them.
- See `CLAUDE.md` → "Security Notes" for full details.

## Revoking Access

If a token leaks: https://accounts.zoho.com/home#sessions/userauthtoken → find your Self Client → revoke.

## Adding a New Zoho App

The pattern is short — see `src/cliq/index.js` as the cleanest example. Or ask Claude Code: "Add a Zoho Survey module that lists surveys and responses."
